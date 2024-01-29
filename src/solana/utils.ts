import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {REV_SHARE_PROGRAM_ID, REV_SHARE_TOKEN_MINT} from "./constant.ts";
import {ContractDataAccountLayout} from "./layout.ts";
import { PhantomProvider } from "../types.ts";
import BN from "bn.js";

export const initializeContract = async (
    connection: Connection,
    provider: PhantomProvider,
    payer: PublicKey,
    amount_per_period: number
) => {
    const amount_to_lamport = amount_per_period * LAMPORTS_PER_SOL;
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
            ...new BN(amount_to_lamport).toArray("le", 8)
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
    const { signature } = await provider.signAndSendTransaction(txn);
    await connection.getSignatureStatus(signature);
}