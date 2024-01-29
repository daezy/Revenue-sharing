import {Connection, PublicKey, SendOptions, Transaction} from "@solana/web3.js";

export type AppContextType = {
    isWalletConnected: boolean;
    walletAddress: PublicKey;
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
    handleInit: (amount: number) => Promise<void>
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
    on: (event: PhantomEvent, callback: (args: any) => void) => void;
    isPhantom: boolean;
}

export type WindowWithSolana = Window & {
    solana?: PhantomProvider;
};