import React, { useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";

import { SOLANA_LOCAL_NET_RPC_URL } from "../solana/constant.ts";
import { AppContextType, PhantomProvider, WindowWithSolana } from "../types.ts";
import {initializeContract} from "../solana/utils.ts";

const AppContext = React.createContext<AppContextType>({
  isWalletConnected: false,
  walletAddress: PublicKey.default,
  connection: new Connection(SOLANA_LOCAL_NET_RPC_URL),
  successMsg: "",
  errorMsg: "",
  poolTotal: 0.0,
  nextShareTotal: 0.0,
  tokenBalance: 0.0,
  tokenClaimed: 0.0,
  connectWallet: () => {},
  disconnectWallet: () => {},
  onClaim: () => {},
  handleInit: async () => {}
});

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [connection, setConnection] = useState<Connection>(new Connection(SOLANA_LOCAL_NET_RPC_URL));
  const [pubKey, setPubKey] = useState<PublicKey>(PublicKey.default);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // logic to fetch any data or connect to wallet once app launches
    if ("solana" in window) {
      const solWindow = window as WindowWithSolana;
      if (solWindow?.solana?.isPhantom) {
        setProvider(solWindow.solana);
        // Attempt an eager connection
        solWindow.solana.connect({ onlyIfTrusted: true });
      }
    }
  }, []);

  useEffect(() => {
    provider?.on("connect", (publicKey: PublicKey) => {
      setConnected(true);
      setPubKey(publicKey);
      setSuccess("Wallet Connected successfully");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      setConnection(new Connection(SOLANA_LOCAL_NET_RPC_URL, "confirmed"));
    });
    provider?.on("disconnect", () => {
      setConnected(false);
      setPubKey(PublicKey.default);
      setSuccess("Wallet Disconnected successfully");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    });
  }, [provider]);

  const handleClaim = (): void => {
    //logic for claiming
  };

  const handleInit = async (amount: number) => {
    if (provider) {
      if (amount <= 0) {
        setError("Invalid Amount Entered")
        return
      }
      await initializeContract(connection, provider, pubKey, amount)
    }
  };

  const handleConnectWallet = (): void => {
    provider?.connect().catch(() => {
      setError("Could not connect wallet");
      setTimeout(() => {
        setError("");
      }, 3000);
    });
  };

  const handleDisconnectWallet = (): void => {
    provider?.disconnect().catch(() => {
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
        connection: connection,
        successMsg: success,
        errorMsg: error,
        poolTotal: 0.0,
        nextShareTotal: 0.0,
        tokenBalance: 0.0,
        tokenClaimed: 0.0,
        connectWallet: handleConnectWallet,
        disconnectWallet: handleDisconnectWallet,
        onClaim: handleClaim,
        handleInit: handleInit,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
