/* eslint-disable no-console */
const arg = require('arg');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { buildSetup } = require('./utils/setup');
const { pkg } = require('./utils/pkg');
const { setupWebpackWatchConfig } = require('./configs/webpack.watch.config');

function parseArguments() {
	const args = arg(
		{
			'--host': Number,
			'-h': '--host'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		analyzeBundle: args['--host'] || false
	};
}

const logBuild = (err, stats) => {
	if (err) {
		console.log(chalk.bgRed.white.bold('Webpack Runtime Error'));
		console.error(err.stack || err);
		if (err.details) {
			console.error(err.details);
		}
	}

	const info = stats.toJson();

	if (stats.hasWarnings()) {
		chalk.bgRed.white.bold(`Webpack Compilations Warning${info.warnings.length > 0 ? 's' : ''}`);
		console.warn(info.warnings);
	}

	if (stats.hasErrors()) {
		console.log(
			chalk.bgRed.white.bold(`Webpack Compilations Error${info.errors.length > 0 ? 's' : ''}`)
		);
		console.error(info.errors);
	} else {
		console.log(chalk.bgBlue.white.bold('Compiled Successfully!'));
	}
};

exports.runWatch = async () => {
	const options = parseArguments();
	console.log('Building ', chalk.green(pkg.zapp.name));
	console.log('Using base path ', chalk.green(buildSetup.basePath));
	const config = setupWebpackWatchConfig(options, buildSetup);
	const compiler = webpack(config);
	// const watching = compiler.watch( {}, logBuild );
	const server = new WebpackDevServer(config.devServer, compiler);
	const runServer = async () => {
		console.log('Starting server...');
		await server.start();
	};
	runServer();
};
