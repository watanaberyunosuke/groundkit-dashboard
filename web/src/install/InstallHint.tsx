// iPhone and iPad never offer to install a web app, so this tells viewers how. Shown in
// any iOS browser until the page runs from the Home Screen or the viewer dismisses it.
import { useState } from "react";
import "./install.css";

const DISMISSED_KEY = "groundkit-install-hint-dismissed";

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia("(display-mode: standalone)").matches;
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function InstallHint() {
  const [show, setShow] = useState(() => isIos() && !isStandalone() && !wasDismissed());
  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private browsing: the hint comes back next visit.
    }
    setShow(false);
  };

  return (
    <aside className="gk-install" aria-label="Install GroundKit">
      <img src="/icons/apple-touch-icon.png" alt="" width={36} height={36} className="gk-install-icon" />
      <p className="gk-install-text">
        <strong>Install GroundKit.</strong> Tap <ShareIcon /> <span className="gk-install-step">Share</span>,
        then <span className="gk-install-step">Add to Home Screen</span>.
      </p>
      <button type="button" className="gk-install-dismiss" onClick={dismiss}>Not now</button>
    </aside>
  );
}

// The iOS share symbol (a box with an arrow up), so viewers can find the button.
function ShareIcon() {
  return (
    <svg className="gk-install-share" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M10 2.5v10M6.5 6 10 2.5 13.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8.5H5.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
