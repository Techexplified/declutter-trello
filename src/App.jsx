import { useState } from "react";
import DeclutterPopup from "./components/DeclutterPopup";
import SignInPopup from "./components/SignInPopup";

// Trello Power-Up initialization
// This App.jsx is used for local dev/preview only.
// The actual Power-Up entry points are in public/popup.html and public/connector.html

function App() {
  const [view, setView] = useState("signin"); // 'signin' | 'dashboard'
  const [isPopupOpen, setIsPopupOpen] = useState(true);

  const handleSignIn = () => {
    // Simulate Trello OAuth authorization
    setView("dashboard");
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      {/* Simulated Trello Navbar */}
      <div className="fixed top-0 left-0 right-0 bg-[#0052CC] h-12 flex items-center px-4 gap-3 z-10">
        <div className="text-white font-bold text-lg">Trello</div>
        <div className="flex-1" />
        {/* Power-Up Icon in Navbar */}
        <button
          onClick={() => setIsPopupOpen(true)}
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="Declutter - Stale Card Manager"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 6h18M3 12h12M3 18h8"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="19" cy="17" r="3" fill="#4ADE80" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold">
          U
        </div>
      </div>

      {/* Demo note */}
      <div className="mt-12 text-gray-400 text-sm">
        Click the navbar icon (top right) to open Declutter
      </div>

      {/* Popup */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-20"
          onClick={handleClose}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {view === "signin" ? (
              <SignInPopup onSignIn={handleSignIn} onClose={handleClose} />
            ) : (
              <DeclutterPopup onClose={handleClose} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
//test
