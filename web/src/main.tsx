import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AirportConditions from "../../dives/airport_conditions/index.tsx";
import AccountBar from "./account/AccountBar";
import { startThemeSync } from "./account/theme";
import InstallHint from "./install/InstallHint";
import "./account/account.css";

// Before the Dive mounts, so it opens in the viewer's saved theme.
startThemeSync();

// Offline support for the home-screen app (src/service-worker.js, emitted as /sw.js).
// Production builds only, so `yarn dev` always serves fresh files.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without it the page still works; it just needs the network.
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InstallHint />
    <AccountBar />
    <AirportConditions />
  </StrictMode>,
);
