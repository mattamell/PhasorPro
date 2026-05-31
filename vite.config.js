import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  define: {
    "process.env.DRAGGABLE_DEBUG": "false",
  },
  plugins: [react()],
});
