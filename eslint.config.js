import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['build', '.react-router', 'storybook-static', 'coverage', 'playwright-report', 'test-results', 'public/media', 'src/shared/api/schema.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.strict,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // React Router의 Link는 href 대신 to를 씁니다.
      'jsx-a11y/anchor-is-valid': ['error', { components: ['Link'], specialLink: ['to'] }],
    },
    // React Aria Components의 Button·Input 등을 jsx-a11y가 실제 요소로 알아보게 합니다.
    settings: {
      'jsx-a11y': {
        components: {
          Button: 'button',
          Input: 'input',
          Link: 'a',
          Heading: 'h2',
        },
      },
    },
  },
);
