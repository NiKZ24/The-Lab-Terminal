import js from "@eslint/js";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    settings: { react: { version: "18" } },
    rules: {
      // The point of this pass: prove no symbol is used without being defined/imported.
      "no-undef": "error",
      // Count JSX usage so component identifiers aren't falsely flagged as undefined/unused.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      // Not relevant to a refactor-correctness check:
      "no-unused-vars": "off",
    },
  },
];
