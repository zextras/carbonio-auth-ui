/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

module.exports = {
	useHistoryNavigation: jest.fn(() => ({
		replaceHistory: jest.fn(),
		pushHistory: jest.fn(),
		goBack: jest.fn()
	}))
};
