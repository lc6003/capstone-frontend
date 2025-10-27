import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import HomePage from "./pages/HomePage.jsx";
import Login from "./pages/Login.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx"; 
import SignUp from "./components/SignUp.jsx";
import QuestionnairePage from "./pages/QuestionnairePage.jsx"; // import the new page
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";


export default function App() {
  const [currentPage, setCurrentPage] = useState("home"); // can be 'home', 'login', 'signup', 'questionnaire'
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    const path = window.location.pathname
    if(path.startsWith('/reset-password')){
      const token = path.split('/reset-password/')[1]
      setResetToken(token)
      setCurrentPage('reset-password')
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentPage("home"); // logged in → Home
      else setCurrentPage((p) => p ?? "login"); // logged out → Login
    });
    return unsub;
  }, []);

  // --- Sign Up Page ---
  if (currentPage === "signup") {
    return (
      <div className="container">
        <header className="header">
          <div
            className="brand"
            style={{ cursor: "pointer" }}
            onClick={() => setCurrentPage("home")}
          >
            <img
              src="/cat-envelope.jpg"
              alt="Cashvelo logo"
              className="logo-img"
              style={{ height: "40px", width: "40px", borderRadius: "8px" }}
            />
            <div>Cashvelo</div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main">
          <SignUp setCurrentPage={setCurrentPage} />
        </main>

        <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
      </div>
    );
  }

  // --- Login Page ---
  if (currentPage === "login") {
    return (
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="logo">🐱</div>
            <div>Cashvelo</div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main">
          <Login setCurrentPage={setCurrentPage} />
        </main>

        <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
      </div>
    );
  }

  // --- Forgot Password Page ---
  if (currentPage === "forgot-password") {
    return (
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="logo">🐱</div>
            <div>Cashvelo</div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main">
          <ForgotPassword setCurrentPage={setCurrentPage} />
        </main>

        <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
      </div>
    );
  }

  // --- Reset Password Page ---
  if (currentPage === "reset-password") {
    return (
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="logo">🐱</div>
            <div>Cashvelo</div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main">
          <ResetPassword token={resetToken} setCurrentPage={setCurrentPage} />
        </main>

        <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
      </div>
    );
  }

  // --- Questionnaire Page ---
  if (currentPage === "questionnaire") {
    return <QuestionnairePage setCurrentPage={setCurrentPage} />;
  }

  // --- Home Page ---
  return <HomePage setCurrentPage={setCurrentPage} />;
}
