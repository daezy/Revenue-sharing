import { useContext } from "react";
import {
  AiOutlineSecurityScan,
  AiOutlineClockCircle,
  AiOutlineHeatMap
} from "react-icons/ai";
import AppContext from "../context/AppContext";
import {formatAmount} from "../solana/utils.ts";
import {REV_SHARE_TOKEN_DECIMALS} from "../solana/constant.ts";

const MainApp = () => {
  const ctx = useContext(AppContext);

  return (
    <>
      <div className="my-20 bg-slate-100 w-11/12 md:w-8/12 lg:w-5/12 mx-auto p-6 py-9 rounded-xl">
        {ctx.successMsg && (
          <div className="bg-green-500 text-white p-4 text-center my-4 rounded-lg">
            <p>{ctx.successMsg}</p>
          </div>
        )}
        {ctx.errorMsg && (
          <div className="bg-green-700 text-white p-4 text-center my-4 rounded-lg">
            <p>{ctx.errorMsg}</p>
          </div>
        )}

        <h2 className="font-bold tracking-wider">REVENUE SHARING</h2>
        <div className="p-6 text-center text-slate-600">
          <p>You must hold at least {formatAmount(ctx.contractData ? ctx.contractData.minimumTokenBalanceForClaim : 0, REV_SHARE_TOKEN_DECIMALS)} $CEX to claim</p>
        </div>

        <div id="details" className="">
          <ul className="text-slate-700">
            <li className="flex items-center justify-between p-3 mb-1">
              <span className="flex items-center">
                <AiOutlineSecurityScan /> &nbsp; Pool total
              </span>
              <span>{ctx.poolTotal} SOL</span>
            </li>
            <li className="flex items-center justify-between p-3 mb-1">
              <span className="flex items-center">
                <AiOutlineHeatMap /> &nbsp; Next Share Total
              </span>
              <span>{ctx.nextShareTotal} SOL</span>
            </li>
            <li className="flex items-center justify-between p-3 mb-1">
              <span className="flex items-center">
                <AiOutlineClockCircle /> &nbsp; Next Share Unlock
              </span>
              <span>{ctx.nextClaimTime != 0 && (ctx.nextClaimTime *1000) > Date.now() ? (new Date(ctx.nextClaimTime * 1000)).toLocaleString() : "Now"}</span>
            </li>
            <li className="flex items-center justify-between p-3 mb-1">
              <span>$CEX Balance</span>
              <span>{ctx.balances.token} $CEX</span>
            </li>
            <li className="flex items-center justify-between p-3 mb-1">
              <span>SOL Balance</span>
              <span>{ctx.balances.sol} SOL</span>
            </li>
          </ul>
        </div>

        <button
          className="w-full text-center text-slate-100 bg-blue-600 hover:bg-blue-800 py-3 rounded-lg disabled:bg-slate-400"
          disabled={!ctx.isWalletConnected || !ctx.canClaim || (ctx.nextClaimTime != 0 && ctx.nextClaimTime*1000 >= Date.now())}
          onClick={ctx.onClaim}
        >
          Claim
        </button>
      </div>
    </>
  );
};

export default MainApp;
