import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "localhost",
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://aifshop-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      "/hubs": {
        target: "https://aifshop-backend.onrender.com",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"), // nếu src nằm trong /client
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: path.resolve(__dirname, "./client/test/setup.ts"),
    css: true,
  },
});
