import "./App.css";
import MainApp from "./components/MainApp";
import Navbar from "./components/Navbar";
import Init from "./components/Init";
import { Routes, Route } from "react-router-dom";
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/init" element={<Init />} />
      </Routes>

      <footer className="container mx-auto text-slate-100 capitalize text-center my-5">
        <p>Copyright &copy; 2024 by Team</p>
      </footer>
    </>
  );
}

export default App;
