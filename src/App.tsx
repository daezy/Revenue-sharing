import "./App.css";
import MainApp from "./components/MainApp";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <MainApp />

      <footer className="container mx-auto text-slate-100 capitalize text-center my-5">
        <p>Copyright &copy; 2024 by Team</p>
      </footer>
    </>
  );
}

export default App;
