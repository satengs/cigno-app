import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    plugins: { security: await import("eslint-plugin-security") },
    rules: {
      "security/detect-object-injection": "off",
      // enable specific rules later when needed
    },
  },
];

export default eslintConfig;
