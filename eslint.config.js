import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // The React Compiler static-analysis rules (eslint-plugin-react-hooks v7)
      // are advisory and fire on intentional, idiomatic patterns used across
      // this app: resetting local form state when a dialog (re)opens, syncing a
      // URL query param to the selected item, and reading the current time for a
      // "last 24 hours" count. Keep them visible as warnings rather than hard
      // errors so they still surface unintentional cases.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    // shadcn/ui primitives legitimately co-export variants and hooks alongside
    // their component, which the fast-refresh rule flags. The rule does not
    // apply to this vendored component-library directory.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
