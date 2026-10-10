import {defineConfig, globalIgnores} from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([...nextVitals, {
    rules: {
        "react-hooks/refs": "off",
        "react-hooks/set-state-in-effect": "off",
        "react-hooks/exhaustive-deps": "warn",   // was off: it hides real bugs
    },
}, globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),]);

export default eslintConfig;
