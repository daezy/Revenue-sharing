import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram, SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {
    REV_SHARE_DATA_ACCOUNT,
    REV_SHARE_PDA_ADDRESS,
    REV_SHARE_PROGRAM_ID,
    REV_SHARE_TOKEN_DECIMALS,
    REV_SHARE_TOKEN_MINT
} from "./constant.ts";
import {ContractDataAccountLayout, UserDataLayout} from "./layout.ts";
import {ContractDataInterface, PhantomProvider} from "../types.ts";
import BN from "bn.js";
import {
    AccountLayout, AccountState,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress, MintLayout,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";

const saveDataToFile = (data: {
    programId: string,
    dataAccount: string,
    pdaAccount: string,
    tokenMint: string
}) => {
    // create file in browser
    const fileName = "revshare";
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    // create "a" HTLM element with href to file
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
}

export async function getAccountInfo(
    connection: Connection,
    address: PublicKey,
    programId = TOKEN_PROGRAM_ID
) {
    const info = await connection.getAccountInfo(address, "confirmed")
    if (!info) throw new Error('TokenAccountNotFoundError')
    if (!info.owner.equals(programId)) throw new Error('TokenInvalidAccountOwnerError')
    if (info.data.length != AccountLayout.span) throw new Error('TokenInvalidAccountSizeError')

    const rawAccount = AccountLayout.decode(Buffer.from(info.data))

    return {
        address,
        mint: rawAccount.mint,
        owner: rawAccount.owner,
        amount: rawAccount.amount,
        delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
        delegatedAmount: rawAccount.delegatedAmount,
        isInitialized: rawAccount.state !== AccountState.Uninitialized,
        isFrozen: rawAccount.state === AccountState.Frozen,
        isNative: !!rawAccount.isNativeOption,
        rentExemptReserve: rawAccount.isNativeOption ? rawAccount.isNative : null,
        closeAuthority: rawAccount.closeAuthorityOption ? rawAccount.closeAuthority : null,
    }
}


export function createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedToken, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ]

    return new TransactionInstruction({
        keys,
        programId: associatedTokenProgramId,
        data: Buffer.alloc(0),
    })
}

export const getOrCreateAssociatedTokenAccount = async (
    connection: Connection,
    payer: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    provider: PhantomProvider,
    allowOwnerOffCurve = false,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) => {
    const associatedToken = await getAssociatedTokenAddress(
        mint,
        owner,
        allowOwnerOffCurve,
        programId,
        associatedTokenProgramId
    )

    // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
    // Sadly we can't do this atomically.
    let account
    try {
        account = await getAccountInfo(connection, associatedToken, programId)
    } catch (error) {
        // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
        // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
        // TokenInvalidAccountOwnerError in this code path.
        //@ts-expect-error fuck-off
        if (error.message === 'TokenAccountNotFoundError' || error.message === 'TokenInvalidAccountOwnerError') {
            // As this isn't atomic, it's possible others can create associated accounts meanwhile.
            try {
                const transaction = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                        payer,
                        associatedToken,
                        owner,
                        mint,
                        programId,
                        associatedTokenProgramId
                    )
                )

                const blockHash = (await connection.getLatestBlockhash("finalized")).blockhash;
                transaction.feePayer = payer;
                transaction.recentBlockhash = blockHash;
                const signedTxn = await provider.signTransaction(transaction);
                const signature = await connection.sendRawTransaction(signedTxn.serialize(), { skipPreflight: true, preflightCommitment: "confirmed"});
                const res = await connection.confirmTransaction(signature, "confirmed");
                const { err } = res.value;
                if (err) {
                    throw new Error("An Error Occurred")
                }
            } catch (error) {
                console.log(error)
                // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
                // instruction error if the associated account exists already.
            }

            // Now this should always succeed
            account = await getAccountInfo(connection, associatedToken, programId)
        } else {
            throw error
        }
    }

    // if (!account.mint.equals(mint.toBuffer())) throw Error('TokenInvalidMintError')
    // if (!account.owner.equals(owner.toBuffer())) throw new Error('TokenInvalidOwnerError')

    return account
}

export function formatAmount(amount: number, decimal: number) {
    return amount/(10**decimal)
}

export const getUserBalances = async (
    connection: Connection,
    tokenAccount: PublicKey,
    userPubKey: PublicKey
) => {
    let tokenBalance;
    try {
        tokenBalance = formatAmount(
            parseInt((await connection.getTokenAccountBalance(tokenAccount)).value.amount),
            REV_SHARE_TOKEN_DECIMALS
        );
    } catch {
        tokenBalance = 0;
    }
    const solBalance = (await connection.getBalance(userPubKey))/LAMPORTS_PER_SOL;
    return {
        tokenBalance: tokenBalance,
        solBalance: solBalance
    }
}

export const getContractData = async (
    connection: Connection,
    address: PublicKey
) => {
    const info = await connection.getAccountInfo(address, "confirmed");
    if (!info) throw new Error('AccountNotFoundError');
    if (!info.owner.equals(new PublicKey(REV_SHARE_PROGRAM_ID))) throw new Error('TokenInvalidAccountOwnerError');
    if (info.data.length != ContractDataAccountLayout.span) throw new Error('TokenInvalidAccountSizeError');
    const data = ContractDataAccountLayout.decode(Buffer.from(info.data));
    return {
        isInitialized: data.isInitialized,
        adminPubkey: PublicKey.default,
        tokenMintPubkey: PublicKey.default,
        pdaBump: Uint8Array.of(0),
        depositPerPeriod: parseInt((data.depositPerPeriod as unknown as bigint).toString()),
        minimumTokenBalanceForClaim: parseInt((data.minimumTokenBalanceForClaim as unknown as bigint).toString())
    }
}

export const getUserData = async (
    connection: Connection,
    tokenMint: PublicKey,
    provider: PhantomProvider
) => {
    const [accountPDA,] = PublicKey.findProgramAddressSync(
        [Buffer.from("rev_share_user", "utf-8"), provider.publicKey.toBuffer(), tokenMint.toBuffer()],
        new PublicKey(REV_SHARE_PROGRAM_ID)
    );
    const info = await connection.getAccountInfo(accountPDA, "confirmed");
    if (!info) throw new Error('User Data AccountNotFoundError');
    if (info.data.length != UserDataLayout.span) throw new Error('TokenInvalidAccountSizeError');
    const data = UserDataLayout.decode(Buffer.from(info.data));
    return {
        isInitialized: data.isInitialized,
        ownerPubKey: PublicKey.default,
        lastClaimTs: parseInt((data.lastClaimTs as unknown as bigint).toString())
    }
}

export const calculateShare = async (
    connection: Connection,
    tokenBalance: number,
    contractData: ContractDataInterface | null,
    mint: PublicKey
) => {
    const info = await connection.getAccountInfo(mint, "confirmed");
    if (info && contractData) {
        const data = MintLayout.decode(Buffer.from(info.data));
        return ((tokenBalance * contractData.depositPerPeriod)/formatAmount(parseInt(data.supply.toString()), REV_SHARE_TOKEN_DECIMALS))/LAMPORTS_PER_SOL
    }
    return 0
}

export const initializeContract = async (
    connection: Connection,
    provider: PhantomProvider,
    payer: PublicKey,
    amountPerPeriod: number,
    minimumTokenBalance: number
) => {
    const amountToLamport = amountPerPeriod * LAMPORTS_PER_SOL;
    const minimumTknBalance = minimumTokenBalance * 10**REV_SHARE_TOKEN_DECIMALS;
    console.log(amountToLamport, minimumTknBalance);
    const revShareProgramId = new PublicKey(REV_SHARE_PROGRAM_ID);
    const dataAccountKeypair = new Keypair();
    const tokenMint = new PublicKey(REV_SHARE_TOKEN_MINT);
    const [pdaAccountPubKey,] = PublicKey.findProgramAddressSync(
        [Buffer.from("rev_share", "utf-8"), payer.toBuffer(), tokenMint.toBuffer()],
        new PublicKey(REV_SHARE_PROGRAM_ID)
    );
    const instruction_data = Buffer.from(
        Uint8Array.of(
            0,
            ...new BN(amountToLamport).toArray("le", 8),
            ...new BN(minimumTknBalance).toArray("le", 8)
        )
    )
    const createDataAcctIX = SystemProgram.createAccount({
        programId: revShareProgramId,
        space: ContractDataAccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(ContractDataAccountLayout.span),
        fromPubkey: payer,
        newAccountPubkey: dataAccountKeypair.publicKey
    })
    const initIX = new TransactionInstruction({
        programId: new PublicKey(REV_SHARE_PROGRAM_ID),
        keys: [
            { pubkey: payer, isSigner: true, isWritable: false},
            { pubkey: dataAccountKeypair.publicKey, isSigner: false, isWritable: true},
            { pubkey: pdaAccountPubKey, isSigner: false, isWritable: true},
            { pubkey: tokenMint, isSigner: false, isWritable: false},
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
        ],
        data: instruction_data
    })
    const txn = new Transaction().add(createDataAcctIX, initIX);
    txn.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    txn.feePayer = payer;
    txn.partialSign(dataAccountKeypair);
    const signedTxn = await provider.signTransaction(txn);
    const signature = await connection.sendRawTransaction(signedTxn.serialize(), { skipPreflight: true, preflightCommitment: "confirmed"});
    const res = await connection.confirmTransaction(signature, "confirmed");
    const { err } = res.value;
    if (err) {
        throw new Error(`An Error Occurred: ${err.toString()}`)
    }
    const data = {
        programId: revShareProgramId.toString(),
        dataAccount: dataAccountKeypair.publicKey.toString(),
        pdaAccount: pdaAccountPubKey.toString(),
        tokenMint: tokenMint.toString()
    }
    saveDataToFile(data);
}

export const handleClaim = async (
    connection: Connection,
    provider: PhantomProvider,
    tokenMint: PublicKey
) => {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        provider.publicKey,
        new PublicKey(REV_SHARE_TOKEN_MINT),
        provider.publicKey,
        provider
    );
    const [claimerPDA,] = PublicKey.findProgramAddressSync(
        [Buffer.from("rev_share_user", "utf-8"), provider.publicKey.toBuffer(), tokenMint.toBuffer()],
        new PublicKey(REV_SHARE_PROGRAM_ID)
    );
    const instructionData = Buffer.from(
        Uint8Array.of(
            1
        )
    );
    const claimIX = new TransactionInstruction({
        programId: new PublicKey(REV_SHARE_PROGRAM_ID),
        keys: [
            { pubkey: provider.publicKey, isSigner: true, isWritable: false },
            { pubkey: claimerPDA, isSigner: false, isWritable: true },
            { pubkey: tokenAccount.address, isSigner: false, isWritable: false },
            { pubkey: tokenMint, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(REV_SHARE_DATA_ACCOUNT), isSigner: false, isWritable: false },
            { pubkey: new PublicKey(REV_SHARE_PDA_ADDRESS), isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        data: instructionData
    });
    const txn = new Transaction().add(claimIX);
    txn.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    txn.feePayer = provider.publicKey;
    const signedTxn = await provider.signTransaction(txn);
    const signature = await connection.sendRawTransaction(signedTxn.serialize(), { skipPreflight: true, preflightCommitment: "confirmed"});
    const res = await connection.confirmTransaction(signature, "confirmed");
    const { err } = res.value;
    if (err) {
        console.log(err)
        throw new Error(`An Error Occurred: ${err.toString()}`)
    }
}