import { useContext, useState } from "react";
import logo from "../assets/wallet.svg";
import chart from "../assets/chart.svg";
import user from "../assets/user.svg";
import cart from "../assets/cart.svg";
import hashtag from "../assets/hashtag.svg";
import { FaBars } from "react-icons/fa";
import AppContext from "../context/AppContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const ctx = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <nav className="text-slate-800 bg-slate-100">
        <div className="container mx-auto px-4 py-4 flex md:items-center flex-col md:flex-row justify-between">
          <div
            id="brand"
            className="flex items-center justify-between ml-3 mb-3 md:mb-0"
          >
            <Link to="/">
              <img src={logo} alt="" width={35} className="" />
            </Link>

            <button
              className="hover:bg-slate-300 p-2 rounded md:hidden"
              onClick={() => {
                setIsOpen((open) => !open);
              }}
            >
              <FaBars />
            </button>
          </div>

          <div
            className={`media-links text-sm flex flex-col md:block border md:border-none border-solid border-slate-900 my-3 md:my-0 rounded-lg py-3 md:py-0  ${
              isOpen ? "" : "hidden"
            }`}
          >
            <Link
              to="/init"
              className="mx-4 text-lg uppercase hover:text-blue-600 py-2"
            >
              Init
            </Link>
            <a href="" className="mx-4 hover:text-blue-600 py-2">
              <img src={chart} alt="chart" className="inline mr-1" width={30} />
              Chart
            </a>
            <a href="" className="mx-4 hover:text-blue-600 py-2">
              <img src={user} alt="chart" className="inline mr-1" width={30} />
              Telegram
            </a>
            <a href="" className="mx-4 hover:text-blue-600 py-2">
              <img
                src={hashtag}
                alt="chart"
                className="inline mr-1"
                width={25}
              />
              Twitter
            </a>
            <a href="" className="mx-4 hover:text-blue-600 py-2">
              <img src={cart} alt="chart" className="inline mr-1" width={30} />
              Buy $CEX
            </a>
          </div>

          <button
            className="bg-blue-600 text-slate-100 rounded-xl px-4 py-3 hover:bg-blue-800"
            onClick={() => {
              if (!ctx.isWalletConnected) {
                return ctx.connectWallet();
              } else {
                return ctx.disconnectWallet();
              }
            }}
          >
            {ctx.isWalletConnected
              ? ctx.walletAddress.slice(0, 15)
              : "Connect Wallet"}
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
