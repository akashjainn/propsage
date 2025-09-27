/* Root ESLint configuration for monorepo */
module.exports = {
  root: true,
  ignorePatterns: ["dist", "node_modules"],
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [
      "./tsconfig.base.json",
      "./apps/api/tsconfig.json",
      "./apps/web/tsconfig.json",
      "./packages/core/tsconfig.json"
    ],
    tsconfigRootDir: __dirname,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "import", "unused-imports"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  settings: {
    react: { version: "detect" },
    "import/resolver": {
      typescript: {
        project: [
          "apps/api/tsconfig.json",
          "apps/web/tsconfig.json",
          "packages/core/tsconfig.json"
        ]
      }
    }
  },
  rules: {
    "react/prop-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "unused-imports/no-unused-imports": "warn",
    "import/order": ["warn", { "newlines-between": "always", alphabetize: { order: "asc" } }],
    // Lower the severity of prefer-const to avoid failing CI on minor style issues in legacy code
    "prefer-const": "warn",
    // Allow default React import pattern variations without erroring
    "import/default": "off"
  },
  overrides: [
    {
      files: ["apps/api/src/**/*.{ts,tsx}", "apps/api/test/**/*.{ts,tsx}"],
      rules: {
        // Temporarily relax unsafe rules for existing API code; plan to re-enable incrementally.
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-base-to-string": "off"
      }
    },
    {
      files: ["apps/web/src/**/*.{ts,tsx}"],
      rules: {
        // Relax unsafe rules for legacy web code; will tighten progressively.
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-base-to-string": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        // Temporarily suppress React legacy rules / escaping noise for rapid iteration
        "react/react-in-jsx-scope": "off",
        "react/no-unescaped-entities": "off",
        "react/jsx-no-target-blank": "off",
        // Allow intentionally empty blocks in legacy code (will tighten later)
        "no-empty": "off"
      }
    }
  ]
};
