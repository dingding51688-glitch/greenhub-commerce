import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    alias: {
      "@": new URL("./", import.meta.url).pathname
    },
    tsconfig: "./tsconfig.vitest.json",
    deps: {
      esbuildOptions: {
        loader: {
          ".ts": "ts",
          ".tsx": "tsx"
        },
        jsx: "automatic"
      }
    }
  },
  esbuild: {
    loader: "tsx",
    include: [/(components|app|lib)\/.*\.(test|spec)\.tsx?$/, /components\/.*\.tsx?$/, /lib\/.*\.ts$/],
    jsx: "automatic"
  }
});
