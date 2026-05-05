import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // process.env を優先（Docker 環境変数）、次に .env ファイル、最後にデフォルト値
  const backendUrl = process.env.BACKEND_URL ?? env.BACKEND_URL ?? "http://localhost:5001";

  const proxyPaths = ["/auth", "/advisories", "/users", "/audit-logs", "/rss.xml", "/openapi.json"];

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: Object.fromEntries(proxyPaths.map((p) => [p, backendUrl])),
    },
  };
});
