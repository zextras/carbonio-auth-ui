// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: CC0-1.0

module.exports = {
	extends: ['./node_modules/@zextras/carbonio-ui-configs/rules/eslint.js'],
	plugins: ['unused-imports', 'notice'],
	overrides: [],
	rules: {
		'import/order': [
			'warn',
			{
				groups: [['builtin', 'external']],
				pathGroups: [
					{
						pattern: 'react',
						group: 'external',
						position: 'before'
					}
				],
				pathGroupsExcludedImportTypes: ['react'],
				'newlines-between': 'always',
				alphabetize: {
					order: 'asc',
					caseInsensitive: true
				}
			}
		],
		'no-console': ['error', { allow: ['error', 'warn'] }],
		'notice/notice': [
			'error',
			{
				templateFile: './notice.template.ts'
			}
		],
		// sonar lint rules
		'sonarjs/cognitive-complexity': 'warn',
		'sonarjs/no-collapsible-if': 'warn',
		'sonarjs/no-duplicate-string': 'warn',
		'sonarjs/no-duplicated-branches': 'warn',
		'sonarjs/no-identical-conditions': 'warn',
		'sonarjs/no-identical-expressions': 'warn',
		'sonarjs/no-redundant-boolean': 'warn',
		'sonarjs/no-small-switch': 'warn',
		'sonarjs/no-unused-collection': 'warn',
		'sonarjs/no-use-of-empty-return-value': 'warn',
		'sonarjs/prefer-immediate-return': 'warn',
		'sonarjs/prefer-object-literal': 'warn',
		'sonarjs/prefer-single-boolean-return': 'warn',
		'sonarjs/prefer-while': 'warn',
		'sonarjs/no-useless-catch': 'warn',
		'sonarjs/no-nested-template-literals': 'warn',
		'sonarjs/no-all-duplicated-branches': 'warn',
		'sonarjs/no-gratuitous-expressions': 'warn',
		'sonarjs/max-switch-cases': 'warn',
		'sonarjs/no-empty-collection': 'warn',
		'sonarjs/no-identical-functions': 'warn',

		'@typescript-eslint/no-shadow': 'warn',

		'no-param-reassign': [
			'warn',
			{ props: true, ignorePropertyModificationsFor: ['accumulator', 'state', 'event'] }
		],
		'unused-imports/no-unused-imports': 'warn'
	},
	settings: {
		'import/resolver': {
			node: {
				moduleDirectory: ['node_modules', 'utils'],
				extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx']
			}
		}
	},
	ignorePatterns: ['notice.template.ts']
};
