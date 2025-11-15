import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const LOCAL_API = env.VITE_LOCAL_API_URL || "http://localhost:5000";

  return {
    server: {
      host: "localhost",
      port: 5173,
      open: true,
      proxy: {
        "/api": {
          target: "https://localhost:7109",
          changeOrigin: true,
          secure: true,
        },
        "/hubs": {
          target: "https://localhost:7109",
          changeOrigin: true,
          secure: true,
          ws: true,
        },
        // Local backend proxy (opt-in via env VITE_LOCAL_API_URL)
        "/api-local": {
          target: LOCAL_API,
          changeOrigin: true,
          secure: false,
        },
        "/hubs-local": {
          target: LOCAL_API,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    plugins: [react()],
    build: {
      outDir: "dist/spa",
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: path.resolve(__dirname, "./client/test/setup.ts"),
      css: true,
    },
  };
});
