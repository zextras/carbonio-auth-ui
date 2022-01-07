// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');

module.exports = {
	pkgName: pkg.zapp.zipname,
	pkgLabel: 'Zextras Error Reporter',
	pkgDescription: pkg.description,
	version: pkg.version,
	projectType: 'app'
};
