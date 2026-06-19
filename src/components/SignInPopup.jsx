import { useState } from "react";

const TRELLO_APP_KEY =
  import.meta.env.VITE_TRELLO_APP_KEY || "YOUR_TRELLO_APP_KEY";

export default function SignInPopup({ onSignIn, onClose }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleTrelloAuth = () => {
    setIsAuthenticating(true);

    // Trello OAuth flow
    // In a real Power-Up, you use window.Trello.authorize()
    // For standalone React app, we use the Trello REST API OAuth flow
    const authUrl =
      `https://trello.com/1/authorize?` +
      `expiration=never` +
      `&name=Declutter` +
      `&scope=read,write` +
      `&response_type=token` +
      `&key=${TRELLO_APP_KEY}` +
      `&return_url=${encodeURIComponent(window.location.href)}` +
      `&callback_method=postMessage`;

    // Open Trello OAuth popup
    const authWindow = window.open(
      authUrl,
      "Trello Authorization",
      "width=500,height=600,left=200,top=100",
    );

    // Listen for the token from the popup
    const messageHandler = (event) => {
      if (event.origin !== "https://trello.com") return;

      const token = event.data;
      if (token && typeof token === "string") {
        localStorage.setItem("trello_token", token);
        window.removeEventListener("message", messageHandler);
        setIsAuthenticating(false);
        onSignIn(token);
      }
    };

    window.addEventListener("message", messageHandler);

    // Fallback: poll for window close (if callback_method=fragment)
    const pollTimer = setInterval(() => {
      if (authWindow && authWindow.closed) {
        clearInterval(pollTimer);
        const storedToken = localStorage.getItem("trello_token");
        if (storedToken) {
          window.removeEventListener("message", messageHandler);
          setIsAuthenticating(false);
          onSignIn(storedToken);
        } else {
          setIsAuthenticating(false);
        }
      }
    }, 500);
  };

  return (
    <div className="w-[340px] bg-[#161B22] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h12M3 18h8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="19" cy="17" r="3" fill="#4ADE80" />
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">
              Declutter
            </div>
            <div className="text-gray-500 text-[10px] leading-tight">
              Stale Card Manager for Trello
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h10M4 18h6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="19"
              cy="17"
              r="4"
              fill="#4ADE80"
              stroke="#161B22"
              strokeWidth="2"
            />
            <path
              d="M17.5 17l1 1 2-2"
              stroke="#161B22"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="text-white font-bold text-xl mb-2">
          Welcome to Declutter
        </h2>
        <p className="text-gray-400 text-sm mb-1 leading-relaxed">
          Keep your Trello boards clean and organized.
        </p>
        <p className="text-gray-500 text-xs mb-8 leading-relaxed">
          Automatically detect stale cards, get health scores, and sweep old
          cards with one click.
        </p>

        {/* Features list */}
        <div className="w-full space-y-2.5 mb-8">
          {[
            { icon: "📊", text: "Board health score & aging insights" },
            { icon: "🧹", text: "Auto-sweep stale cards on schedule" },
            { icon: "⚡", text: "Quick actions for at-risk cards" },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5"
            >
              <span className="text-base">{f.icon}</span>
              <span className="text-gray-300 text-xs text-left">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={handleTrelloAuth}
          disabled={isAuthenticating}
          className="w-full bg-[#0052CC] hover:bg-[#0065FF] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-900/40"
        >
          {isAuthenticating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting to Trello…</span>
            </>
          ) : (
            <>
              {/* Trello logo mark */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="2" y="2" width="9" height="13" rx="2" />
                <rect x="13" y="2" width="9" height="8" rx="2" />
              </svg>
              <span>Sign in with Trello</span>
            </>
          )}
        </button>

        <p className="text-gray-600 text-[10px] mt-4 leading-relaxed">
          By signing in, you authorize Declutter to read and manage your Trello
          boards. Your data stays private.
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-center">
        <span className="text-gray-600 text-[10px]">
          ✨ Powering cleaner, healthier boards
        </span>
      </div>
    </div>
  );
}
//test
