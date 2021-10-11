/* eslint-disable import/extensions */
const { execSync } = require('child_process');

const { pkg } = require('./pkg.js');

exports.setupBuild = () => {
	const prefix = '/static/iris/';

	const commitHash = execSync('git rev-parse HEAD').toString().trim();
	const basePath = `${prefix}${pkg.zapp.name}/${commitHash}/`;
	const shellHash = execSync('cat node_modules/@zextras/zapp-shell/dist/commit').toString().trim();
	return {
		prefix,
		basePath,
		shellHash
	};
};
