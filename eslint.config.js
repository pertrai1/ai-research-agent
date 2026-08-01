import eslint from '@eslint/js';
import llmCore from 'eslint-plugin-llm-core';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...llmCore.configs.recommended,
);
