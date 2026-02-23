import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    prettier,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                {
                    prefer: "type-imports",
                },
            ],
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            // New react-hooks rules from eslint-config-next@16 — downgrade to
            // warnings since these are new and the project doesn't use React Compiler
            "react-hooks/immutability": "warn",
            "react-hooks/preserve-manual-memoization": "warn",
            "react-hooks/set-state-in-effect": "warn",
            "no-var": "warn",
            "prefer-const": "warn",
            "no-console": [
                "warn",
                {
                    allow: ["warn", "error"],
                },
            ],
        },
    },
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        "public/sw.js",
        "public/swe-worker-*.js",
    ]),
]);

export default eslintConfig;
