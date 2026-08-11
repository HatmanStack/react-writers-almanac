/**
 * Flat ESLint config for the whole repository.
 *
 * It lives at the repo root, not in frontend/, so a single invocation covers the
 * application source, the Playwright specs and the build scripts. Previously the
 * config sat in frontend/ with `files: ['src/**']`, which left tests/e2e/ and
 * scripts/ unlinted entirely.
 *
 * The .cjs extension is deliberate: the root package.json is `"type": "module"`,
 * and every plugin loaded below is CommonJS.
 */
const js = require('@eslint/js');
const globals = require('globals');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

/**
 * Two rules from js.configs.recommended are turned off on TypeScript and left on
 * for plain JS. Both are false-positive generators on TS for the same reason —
 * they reason about identifiers without types — and both already have a better
 * replacement in a TS project.
 *
 * Measured on this tree before the carve-outs were written:
 *
 *   no-unused-vars  47 errors, every one of them a *type-signature parameter
 *                   name* (`date`, `direction`, `isShowing`, `state`), 15 of
 *                   them in store/types.ts and the rest spread across the
 *                   per-component types.ts files. Those names document a
 *                   signature and are not values at all. The replacement,
 *                   @typescript-eslint/no-unused-vars, understands type
 *                   positions and honours argsIgnorePattern; it stays on below.
 *                   (The audit measured 52 against the base commit; the earlier
 *                   phases deleted types/api.ts's dead ApiClient, taking 5 with
 *                   it. 47 is the figure at this tree.)
 *
 *   no-undef        16 errors, every one a false positive: `React` ×3 from
 *                   type-only `React.FC` annotations that the modern JSX
 *                   transform needs no import for, plus HTMLButtonElement,
 *                   Element, Node, PromiseRejectionEvent and `global` ×3. tsc
 *                   catches genuinely undefined identifiers with type
 *                   information ESLint does not have.
 *
 * "Fixing" either set would mean editing type declarations or adding meaningless
 * `import React` statements to satisfy a linter. This is a two-rule carve-out,
 * not an argument against the spread: no-fallthrough, no-dupe-keys,
 * no-unreachable, no-constant-condition and the rest of the recommended set were
 * absent from this repo entirely until now and all catch real bugs.
 */
const TYPESCRIPT_BASE_CARVE_OUTS = {
  'no-unused-vars': 'off',
  'no-undef': 'off',
};

module.exports = [
  {
    ignores: [
      'node_modules/',
      'build/',
      'dist/',
      'frontend/build/',
      'frontend/dist/',
      'coverage/',
      'test-results/',
      'playwright-report/',
      // ESLint does not read .gitignore. Local agent worktrees live here.
      '.claude/',
      // ADR-2 reserves the backend's disposition for the user. It has never been
      // linted, and bringing it into scope now would surface findings whose only
      // remedy is to modify files no phase of this plan may touch.
      'backend/',
    ],
  },
  {
    // Application source: browser-hosted TypeScript and React.
    files: ['frontend/src/**/*.ts', 'frontend/src/**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      // Replaces a hand-maintained 34-entry literal. It was inert then (nothing
      // spread js.configs.recommended, so no-undef never ran) and it is inert
      // now for a different reason — no-undef is carved out for TS below. The
      // globals package is load-bearing only in the scripts/ block.
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // FIRST: the base recommended set is the floor. Everything below
      // deliberately overrides it, and in a JS object literal later keys win —
      // appending this spread instead would silently undo those overrides.
      ...js.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'no-console': 'warn',
      ...TYPESCRIPT_BASE_CARVE_OUTS,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    // Playwright specs and config: Node-hosted TypeScript. Browser globals are
    // included because page.evaluate() callbacks are authored inline and run in
    // the page.
    files: ['tests/e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
      'no-console': 'warn',
      ...TYPESCRIPT_BASE_CARVE_OUTS,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Build and data scripts: plain CommonJS Node. There is no typechecker here
    // and no typed replacement, so no-undef and base no-unused-vars stay ON —
    // this is the one place in the repo where they earn their keep. console is
    // this script's user interface, so no-console stays off.
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Same rules, ESM parse. `scripts/**/*.js` cannot cover .mjs, so without
    // this block the generator is silently unlinted -- and .mjs is the correct
    // extension for it, since package.json sets "type": "module" while the
    // older scripts here are CommonJS.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      eqeqeq: ['error', 'always'],
    },
  },
];
