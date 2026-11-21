import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import process from "node:process";
import {fileURLToPath} from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/api": path.resolve(__dirname, "./src/api"),
      "@/context": path.resolve(__dirname, "./src/context"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
      "@/services": path.resolve(__dirname, "./src/services"),
    },
  },
  server: {
    host: "0.0.0.0",
    // Allow access from network
    port: 5173,
    allowedHosts: ["localhost", "127.0.0.1", "client", "smartnshine-client"],
    proxy: {
      "/api": {
        // In Docker, VITE_PROXY_TARGET is set to http://server:5000 by
        // docker-compose so the Vite dev server can reach the API container.
        // For local dev (no Docker) it falls back to localhost:5000.
        target: process.env.VITE_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["xlsx"],
  },
  build: {
    target: "es2022",
    cssTarget: "chrome89",
    minify: "esbuild",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("framer-motion") || id.includes("motion-dom")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (id.includes("axios")) {
              return "vendor-axios";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-recharts";
            }
            if (id.includes("xlsx")) {
              return "vendor-xlsx";
            }
          }
        },
      },
    },
  },
});
