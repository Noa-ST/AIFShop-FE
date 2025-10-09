import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "localhost",
    port: 5173,
    open: true, // tự động mở trình duyệt khi run dev
    proxy: {
      // ✅ Proxy toàn bộ request /api → .NET backend
      "/api": {
        target: "http://localhost:5000", // hoặc 5001 nếu dùng HTTPS
        changeOrigin: true,
        secure: false,
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
});
