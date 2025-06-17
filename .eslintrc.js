module.exports = {
  extends: ["next/core-web-vitals", "plugin:tailwindcss/recommended"],
  plugins: ["unused-imports"],
  rules: {
    "unused-imports/no-unused-imports": "warn",
    "tailwindcss/no-custom-classname": "off",
  },
};
