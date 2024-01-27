import { useContext } from "react";
import {
  AiOutlineSecurityScan,
  AiOutlineHeatMap,
  AiOutlineClockCircle,
} from "react-icons/ai";
import AppContext from "../context/AppContext";

const MainApp = () => {
  const ctx = useContext(AppContext);

  return (
    <>
      <div className="my-20 bg-slate-100 w-11/12 md:w-8/12 lg:w-5/12 mx-auto p-6 py-9 rounded-xl">
        <h2 className="font-bold tracking-wider">REVENUE SHARING</h2>
        <div className="p-6 text-center text-slate-600">
          <p>You must hold 5.000.000 $CEX to claim</p>
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
              <span>{Date.now()}</span>
            </li>
            <li className="flex items-center justify-between p-3 mb-1">
              <span>Balance</span>
              <span>{ctx.tokenBalance} $CEX</span>
            </li>
            <li className="flex items-center justify-between p-3 mb-1">
              <span>Claimed</span>
              <span>{ctx.tokenClaimed} $CEX</span>
            </li>
          </ul>
        </div>

        <button
          className="w-full text-center text-slate-100 bg-blue-600 hover:bg-blue-800 py-3 rounded-lg disabled:bg-slate-400"
          disabled={!ctx.isWalletConnected}
          onClick={ctx.onClaim}
        >
          Claim
        </button>
      </div>
    </>
  );
};

export default MainApp;
