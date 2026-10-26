import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/painel-clima/",
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,jsx}"],
  },
});
