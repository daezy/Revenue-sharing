import React, { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

type AppContextType = {
  isWalletConnected: boolean;
  walletAddress: string;
  successMsg: string | null;
  errorMsg: string | null;
  poolTotal: number;
  nextShareTotal: number;
  tokenBalance: number;
  tokenClaimed: number;
  connectWallet: () => void;
  disconnectWallet: () => void;
  onClaim: () => void;
};

type PhantomEvent = "disconnect" | "connect" | "accountChanged";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, callback: (args: any) => void) => void;
  isPhantom: boolean;
}

type WindowWithSolana = Window & {
  solana?: PhantomProvider;
};

const AppContext = React.createContext<AppContextType>({
  isWalletConnected: false,
  walletAddress: "",
  successMsg: "",
  errorMsg: "",
  poolTotal: 0.0,
  nextShareTotal: 0.0,
  tokenBalance: 0.0,
  tokenClaimed: 0.0,
  connectWallet: () => {},
  disconnectWallet: () => {},
  onClaim: () => {},
});

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const [walletAvail, setWalletAvail] = useState(false);
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // logic to fetch aany data or connect to wallet once app lauches
    if ("solana" in window) {
      const solWindow = window as WindowWithSolana;
      if (solWindow?.solana?.isPhantom) {
        setProvider(solWindow.solana);
        setWalletAvail(true);
        // Attemp an eager connection
        solWindow.solana.connect({ onlyIfTrusted: true });
      }
    }
  }, []);

  useEffect(() => {
    provider?.on("connect", (publicKey: PublicKey) => {
      console.log(`connect event: ${publicKey}`);
      setConnected(true);
      setPubKey(String(publicKey));
      setSuccess("Wallet Connected successfully");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    });
    provider?.on("disconnect", () => {
      console.log("disconnect event");
      setConnected(false);
      setPubKey(null);
      setSuccess("Wallet Disconnected successfully");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    });
  }, [provider]);

  const handleClaim = (): void => {
    //logic for claiming
  };
  const handleConnectWallet = (): void => {
    console.log(`connect handler`);
    provider?.connect().catch((err) => {
      setError("Could not connect wallet");
      setTimeout(() => {
        setError("");
      }, 3000);
    });
  };

  const handleDisonnectWallet = (): void => {
    console.log("disconnect handler");
    provider?.disconnect().catch((err) => {
      setError("Could not disconnect wallet");
      setTimeout(() => {
        setError("");
      }, 3000);
    });
  };

  return (
    <AppContext.Provider
      value={{
        isWalletConnected: connected,
        walletAddress: pubKey,
        successMsg: success,
        errorMsg: error,
        poolTotal: 0.0,
        nextShareTotal: 0.0,
        tokenBalance: 0.0,
        tokenClaimed: 0.0,
        connectWallet: handleConnectWallet,
        disconnectWallet: handleDisonnectWallet,
        onClaim: handleClaim,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
