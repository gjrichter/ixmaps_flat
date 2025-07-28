module.exports = [
  {
    ignores: ["node_modules/**", "libs/**", "*.min.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        $: "readonly"
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-redeclare": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "warn",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "warn",
      "no-extra-semi": "warn",
      "no-func-assign": "error",
      "no-irregular-whitespace": "warn",
      "no-unreachable": "error",
      "use-isnan": "error",
      "valid-typeof": "error"
    },
    plugins: {}
  }
]; 