import process from "node:process";
import { defineConfig } from "vitest/config";

process.env["NI_CONFIG_FILE"] = "false";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["dist", "node_modules"],
    alias: {
      "~/": new URL("./src/", import.meta.url).pathname,
    },
    watch: false,
  },
});
