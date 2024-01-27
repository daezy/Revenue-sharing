import React, { useEffect, useState } from "react";

type AppContextType = {
  isWalletConnected: boolean;
  walletAddress: string;
  poolTotal: number;
  nextShareTotal: number;
  tokenBalance: number;
  tokenClaimed: number;
  connectWallet: () => void;
  onClaim: () => void;
};

const AppContext = React.createContext<AppContextType>({
  isWalletConnected: false,
  walletAddress: "",
  poolTotal: 0.0,
  nextShareTotal: 0.0,
  tokenBalance: 0.0,
  tokenClaimed: 0.0,
  connectWallet: () => {},
  onClaim: () => {},
});

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    // logic to fetch aany data or connect to wallet once app lauches
  }, []);

  const handleClaim = (): void => {
    //logic for claiming
  };
  const handleConnectWallet = (): void => {
    //logic for claiming
  };

  return (
    <AppContext.Provider
      value={{
        isWalletConnected: false,
        walletAddress: address,
        poolTotal: 0.0,
        nextShareTotal: 0.0,
        tokenBalance: 0.0,
        tokenClaimed: 0.0,
        connectWallet: handleConnectWallet,
        onClaim: handleClaim,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
