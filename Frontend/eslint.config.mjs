import globals from 'globals';
import eslintJs from '@eslint/js';
import eslintTs from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

// ----------------------------------------------------------------------

/**
 * @rules common
 * from 'react', 'eslint-plugin-react-hooks'...
 */
const commonRules = () => ({
  ...reactHooksPlugin.configs.recommended.rules,
  'func-names': 0,
  'no-bitwise': 0,
  'no-unused-vars': 0,
  'object-shorthand': 0,
  'no-useless-rename': 0,
  'default-case-last': 0,
  'consistent-return': 0,
  'no-constant-condition': 0,
  'default-case': 0,
  'lines-around-directive': 0,
  'arrow-body-style': 0,
  // react
  'react/jsx-key': 0,
  'react/prop-types': 0,
  'react/display-name': 0,
  'react/no-children-prop': 0,
  'react/jsx-boolean-value': 0,
  'react/self-closing-comp': 0,
  'react/react-in-jsx-scope': 0,
  'react/jsx-no-useless-fragment': 0,
  'react/jsx-curly-brace-presence': 0,
  'react-hooks/refs': 0,
  'react-hooks/immutability': 0,
  'react-hooks/set-state-in-effect': 0,
  'react-hooks/incompatible-library': 0,
  'react-hooks/preserve-manual-memoization': 0,
  // typescript
  '@typescript-eslint/no-shadow': 0,
  '@typescript-eslint/no-explicit-any': 0,
  '@typescript-eslint/no-empty-object-type': 0,
  '@typescript-eslint/consistent-type-imports': 0,
  '@typescript-eslint/no-unused-vars': 0,
});

/**
 * @rules import
 * from 'eslint-plugin-import'.
 */
const importRules = () => ({
  ...importPlugin.configs.recommended.rules,
  'import/named': 0,
  'import/export': 0,
  'import/default': 0,
  'import/namespace': 0,
  'import/no-named-as-default': 0,
  'import/newline-after-import': 0,
  'import/no-named-as-default-member': 0,
  'import/no-cycle': 0,
});

/**
 * @rules unused imports
 * from 'eslint-plugin-unused-imports'.
 */
const unusedImportsRules = () => ({
  'unused-imports/no-unused-imports': 0,
  'unused-imports/no-unused-vars': 0,
});

/**
 * @rules sort or imports/exports
 * from 'eslint-plugin-perfectionist'.
 */
const sortImportsRules = () => ({
  'perfectionist/sort-named-imports': 0,
  'perfectionist/sort-named-exports': 0,
  'perfectionist/sort-exports': 0,
  'perfectionist/sort-imports': 0,
});

/**
 * Custom ESLint configuration.
 */
export const customConfig = {
  plugins: {
    'react-hooks': reactHooksPlugin,
    'unused-imports': unusedImportsPlugin,
    perfectionist: perfectionistPlugin,
    import: importPlugin,
  },
  settings: {
    // https://www.npmjs.com/package/eslint-import-resolver-typescript
    ...importPlugin.configs.typescript.settings,
    'import/resolver': {
      ...importPlugin.configs.typescript.settings['import/resolver'],
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    ...commonRules(),
    ...importRules(),
    ...unusedImportsRules(),
    ...sortImportsRules(),
  },
};

// ----------------------------------------------------------------------

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { ignores: ['*', '!src/', '!eslint.config.*'] },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
  },
  eslintJs.configs.recommended,
  ...eslintTs.configs.recommended,
  reactPlugin.configs.flat.recommended,
  customConfig,
];
