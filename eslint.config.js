import eslint from '@eslint/js';
import llmCore from 'eslint-plugin-llm-core';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...llmCore.configs.recommended,
  {
    files: ['src/page-reader.ts'],
    rules: {
      'llm-core/max-complexity': 'off',
      'llm-core/max-file-length': 'off',
      'llm-core/max-function-length': 'off',
      'llm-core/max-nesting-depth': 'off',
      'llm-core/max-params': 'off',
      'llm-core/no-magic-numbers': 'off',
      'llm-core/no-unsafe-array-access': 'off',
    },
  },
);
