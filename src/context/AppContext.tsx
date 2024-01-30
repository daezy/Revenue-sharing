import React, { useEffect, useState } from "react";
import {
  Connection, LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

import {
  REV_SHARE_DATA_ACCOUNT,
  REV_SHARE_PDA_ADDRESS, REV_SHARE_TOKEN_DECIMALS,
  REV_SHARE_TOKEN_MINT,
  SOLANA_LOCAL_NET_RPC_URL
} from "../solana/constant.ts";
import {AppContextType, ContractDataInterface, PhantomProvider, WindowWithSolana} from "../types.ts";
import {
  calculateShare, formatAmount,
  getContractData,
  getOrCreateAssociatedTokenAccount,
  getUserBalances, getUserData, handleClaim,
  initializeContract
} from "../solana/utils.ts";

const AppContext = React.createContext<AppContextType>({
  isWalletConnected: false,
  canClaim: false,
  walletAddress: PublicKey.default,
  balances: { token: "", sol: ""},
  contractData: null,
  connection: new Connection(SOLANA_LOCAL_NET_RPC_URL),
  successMsg: "",
  errorMsg: "",
  poolTotal: 0.0,
  nextShareTotal: 0.0,
  tokenBalance: 0.0,
  tokenClaimed: 0.0,
  nextClaimTime: 0,
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
  const [ error, setError] = useState("");
  const [ tokenBalance, setTokenBalance ] = useState("0");
  const [ solBalance, setSolBalance ] = useState("0");
  const [ contractData, setContractData ] = useState<ContractDataInterface | null>(null);
  const [ poolTotal, setPoolTotal ] = useState("0");
  const [ poolShare, setPoolShare ] = useState("0");
  const [ canClaim, setCanClaim ] = useState(false);
  const [ nextClaimTime, setNextClaimTime ] = useState(0);

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
    const setUp = async (connection: Connection, payer: PublicKey, provider: PhantomProvider) => {
      const poolBalance = (await connection.getBalance(
          new PublicKey(REV_SHARE_PDA_ADDRESS),
          "confirmed"
      ))/LAMPORTS_PER_SOL;
      let globCData;
      try {
        const cData = await getContractData(connection, new PublicKey(REV_SHARE_DATA_ACCOUNT));
        setContractData(cData);
        setPoolTotal(poolBalance.toString());
        globCData = cData;
      } catch (e) {
        setError(`Error Fetching contract account ${e}`)
      }
      try {
        const userData = await getUserData(connection, new PublicKey(REV_SHARE_TOKEN_MINT), provider);
        if (userData.lastClaimTs == 0) {
          setNextClaimTime(Date.now())
        } else {
          setNextClaimTime(userData.lastClaimTs + (24*60*60))
        }
      } catch (e) {
        setError(`Error Fetching user Data ${e}`)
      }
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          new PublicKey(REV_SHARE_TOKEN_MINT),
          payer,
          provider
      );
      console.log(`User Token Account: ${userTokenAccount.address}`)
      try {
        const { tokenBalance, solBalance } = await getUserBalances(
            connection,
            userTokenAccount.address,
            payer
        );
        setTokenBalance(tokenBalance.toString());
        setSolBalance(solBalance.toString());
        if (globCData) {
          if (tokenBalance < formatAmount(globCData.minimumTokenBalanceForClaim, REV_SHARE_TOKEN_DECIMALS)) {
            setError("You're not eligible to claim due to insufficient balance");
            setPoolShare("0");
          } else {
            const poolShare = await calculateShare(connection, tokenBalance, globCData, new PublicKey(REV_SHARE_TOKEN_MINT));
            setPoolShare(poolShare.toString());
            setCanClaim(true);
          }
        }
      } catch (e) {
        setError(`Error Fetching User Balances ${e}`)
      }
    }
    provider?.on("connect", (publicKey: PublicKey) => {
      setConnected(true);
      setPubKey(publicKey);
      setSuccess("Wallet Connected successfully");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      setConnection(new Connection(SOLANA_LOCAL_NET_RPC_URL, "confirmed"));
      setUp(connection, publicKey, provider).then((res) => console.log(res))
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

  const handleTokenClaim = async () => {
    if (provider) {
      try {
        await handleClaim(
            connection,
            provider,
            new PublicKey(REV_SHARE_TOKEN_MINT)
        )
        setSuccess("SOL Claimed Successfully!!")
      } catch (e) {
        console.log(e);
        setError("An Error Occurred")
      }

    }
  };

  const handleInit = async (amount: number, minimumTokenBalance: number) => {
    if (provider) {
      if (amount <= 0 || minimumTokenBalance <= 0) {
        setError("Invalid Amount Entered")
        return
      }
      try {
        await initializeContract(connection, provider, pubKey, amount, minimumTokenBalance)
      } catch (e) {
        setError(`An Error Occurred: ${e}`);
        throw e
      }
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
        canClaim: canClaim,
        walletAddress: pubKey,
        balances: {token: tokenBalance, sol: solBalance},
        contractData,
        connection: connection,
        successMsg: success,
        errorMsg: error,
        poolTotal: parseFloat(poolTotal),
        nextShareTotal: parseFloat(parseFloat(poolShare).toFixed(2)),
        tokenBalance: 0.0,
        tokenClaimed: 0.0,
        nextClaimTime: nextClaimTime,
        connectWallet: handleConnectWallet,
        disconnectWallet: handleDisconnectWallet,
        onClaim: handleTokenClaim,
        handleInit: handleInit,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
