import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [".next/**", "node_modules/**", "pnpm-lock.yaml"],
  },
  ...nextVitals,
];
