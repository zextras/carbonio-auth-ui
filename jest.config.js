/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

module.exports = {
	transform: {
		'^.+\\.[t|j]sx?$': ['babel-jest', { configFile: './babel.config.jest.js' }]
	},
	moduleDirectories: [
		'node_modules',
		// add the directory with the test-utils.js file:
		'test/utils' // a utility folder
	],
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
	coverageDirectory: 'coverage',
	coverageReporters: ['lcov', 'html'],
	reporters: ['default'],
	// testMatch: ['/test/**/*.js?(x)'],
	setupFilesAfterEnv: ['<rootDir>/src/jest-env-setup.js'],
	testEnvironment: 'jsdom'
};
