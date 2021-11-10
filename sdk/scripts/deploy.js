/* eslint-disable no-console */
const arg = require('arg');
const chalk = require('chalk');
const webpack = require('webpack');
const { setupBuild } = require('./utils/setup.js');
const { pkg } = require('./utils/pkg.js');
const { setupWebpackBuildConfig } = require('./configs/webpack.build.config.js');
const {runBuild} = require('./build.js');

function parseArguments() {
	const args = arg(
		{
			'--podman': String,
			'-p': '--podman'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		podman: args['--podman']
	};
}

exports.runDeploy = () => {
	const options = parseArguments();
	runBuild()
};
