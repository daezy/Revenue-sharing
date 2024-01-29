import {Connection, PublicKey, SendOptions, Transaction} from "@solana/web3.js";
import BN from "bn.js";

export type AppContextType = {
    isWalletConnected: boolean;
    walletAddress: PublicKey;
    contractData: ContractDataInterface | null,
    balances: { token: string, sol: string},
    connection: Connection | null;
    successMsg: string | null;
    errorMsg: string | null;
    poolTotal: number;
    nextShareTotal: number;
    tokenBalance: number;
    tokenClaimed: number;
    connectWallet: () => void;
    disconnectWallet: () => void;
    onClaim: () => void;
    handleInit: (amount: number, minimumTokenBalance: number) => Promise<void>
};

export type PhantomEvent = "disconnect" | "connect" | "accountChanged";

export interface ConnectOpts {
    onlyIfTrusted: boolean;
}

export interface PhantomProvider {
    connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    signAndSendTransaction: (
        transaction: Transaction,
        opts?: SendOptions
    ) => Promise<{ signature: string; publicKey: PublicKey }>;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    on: (event: PhantomEvent, callback: (args: any) => void) => void;
    publicKey: PublicKey,
    isPhantom: boolean;
}

export type WindowWithSolana = Window & {
    solana?: PhantomProvider;
};

export interface ContractDataInterface {
    isInitialized: number,
    adminPubkey: PublicKey,
    tokenMintPubkey: PublicKey,
    pdaBump: Uint8Array,
    depositPerPeriod: BN,
    minimumTokenBalanceForClaim: BN,
}