// Builds the MotherDuck Dive (../dives/airport_conditions/index.tsx) as a static site for
// Vercel. The Dive is imported unchanged; only its data hooks are swapped for
// src/dive-runtime.ts, which runs the same SQL on DuckDB-WASM.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Emits src/service-worker.js as /sw.js, prefixed with this build's id and its hashed
// /assets/ files, so each deploy installs a new worker that knows what to cache.
function serviceWorker(): Plugin {
  return {
    name: "groundkit-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((f) => f.startsWith("assets/"))
        .sort()
        .map((f) => `/${f}`);
      const build = createHash("sha256").update(assets.join("\n")).digest("hex").slice(0, 12);
      const body = readFileSync(new URL("./src/service-worker.js", import.meta.url), "utf8");
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `const BUILD = ${JSON.stringify(build)};\nconst ASSETS = ${JSON.stringify(assets)};\n\n${body}`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Public build-time variables use the Next.js-style prefix, which is how the Vercel
  // Supabase integration names them. Only NEXT_PUBLIC_* values reach the browser.
  envPrefix: "NEXT_PUBLIC_",
  resolve: {
    alias: {
      "@motherduck/react-sql-query": fileURLToPath(new URL("./src/dive-runtime.ts", import.meta.url)),
    },
    // The Dive lives outside web/, so resolve its imports from web/node_modules.
    dedupe: ["react", "react-dom", "recharts"],
  },
  server: {
    fs: { allow: [".."] },
    // `yarn dev` / `yarn preview` expect the API on :8000 (see README).
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  preview: { proxy: { "/api": "http://127.0.0.1:8000" } },
  optimizeDeps: { exclude: ["@duckdb/duckdb-wasm"] },
});
