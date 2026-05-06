import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variable',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                },
            ],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'no-restricted-imports': [
                'warn',
                {
                    paths: [
                        {
                            name: 'react',
                            importNames: ['useState'],
                            message: '业务状态请使用 Controller.internal，UI 原语组件除外',
                        },
                    ],
                },
            ],
        },
        settings: {
            react: { version: 'detect' },
        },
    },
    {
        files: ['src/uis/primitives/**/*.tsx'],
        rules: {
            'no-restricted-imports': 'off',
        },
    },
    {
        ignores: ['dist/', 'node_modules/'],
    },
);
