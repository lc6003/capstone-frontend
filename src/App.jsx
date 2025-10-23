import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import HomePage from "./components/HomePage.jsx";
import Login from "./components/Login.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import SignUp from "./components/SignUp.jsx";
import Questionnaire from "./components/Questionnaire.jsx";

export default function App(){
  const [currentPage, setCurrentPage] = useState('home'); // start on login to test
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Check if user has completed questionnaire (you can implement this logic later)
        // For now, we'll go directly to home
        setCurrentPage('home');
      } else {
        setCurrentPage((p) => p ?? 'login'); // logged out → Login (safety)
      }
    });
    return unsub;
  }, []);

  if (currentPage === 'signup') {
    return (
      <div className="container">
        <header className="header">
          <div
            className="brand"
            style={{ cursor: 'pointer' }}
            onClick={() => setCurrentPage('home')}
          >
            {/* replaced emoji with the same image logo used on HomePage */}
            <img
              src="/cat-envelope.jpg"
              alt="Cashvelo logo"
              className="logo-img"
              style={{ height: '40px', width: '40px', borderRadius: '8px' }}
            />
            <div>Cashvelo</div>
          </div>
          <ThemeToggle/>
        </header>

        <main className="main">
          <SignUp setCurrentPage={setCurrentPage} />
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Cashvelo
        </footer>
      </div>
    );
  }

  if (currentPage === 'questionnaire') {
    return (
      <div className="container">
        <header className="header">
          <div
            className="brand"
            style={{ cursor: 'pointer' }}
            onClick={() => setCurrentPage('home')}
          >
            <img
              src="/cat-envelope.jpg"
              alt="Cashvelo logo"
              className="logo-img"
              style={{ height: '40px', width: '40px', borderRadius: '8px' }}
            />
            <div>Cashvelo</div>
          </div>
          <ThemeToggle/>
        </header>

        <main className="main">
          <Questionnaire setCurrentPage={setCurrentPage} user={currentUser} />
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Cashvelo
        </footer>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <div className="container">
        <header className="header">
          <div
            className="brand"
            style={{ cursor: 'pointer' }}
            onClick={() => setCurrentPage('home')}
          >
            <img
              src="/cat-envelope.jpg"
              alt="Cashvelo logo"
              className="logo-img"
              style={{ height: '40px', width: '40px', borderRadius: '8px' }}
            />
            <div>Cashvelo</div>
          </div>
          <ThemeToggle/>
        </header>

        <main className="main">
          <Login setCurrentPage={setCurrentPage} />
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Cashvelo
        </footer>
      </div>
    );
  }

  return <HomePage setCurrentPage={setCurrentPage} />;
}
