/* eslint-disable import/extensions */
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const semver = require('semver');
const { createBabelConfig } = require('./babelrc.build.js');
const { pkg } = require('../scripts/utils/pkg.js');

exports.setupWebpackWatchConfig = ( options, { basePath } ) => {
	const defaultConfig = {
		entry: {
			app: path.resolve(process.cwd(), 'sdk/scripts/utils/entry.js')
		},
		mode: 'development',
		devServer: {
			hot: true,
			port: 9000,
			sockPort: 9000,
			historyApiFallback: true,
			https: true,
			contentBase: path.resolve(
				process.cwd(),
				'node_modules',
				'@zextras',
				'zapp-shell',
				'dist',
				'public'
			),
			open: [basePath]
		},
		devtool: 'source-map',
		target: 'web',
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules/,
					loader: require.resolve('babel-loader'),
					options: createBabelConfig(`babel.config.js`, options, pkg)
				},
				{
					test: /\.(less|css)$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
							options: {
								hmr: true
							}
						},
						{
							loader: require.resolve('css-loader'),
							options: {
								modules: {
									localIdentName: '[name]__[local]___[hash:base64:5]'
								},
								importLoaders: 1,
								sourceMap: true
							}
						},
						{
							loader: require.resolve('postcss-loader'),
							options: {
								sourceMap: true
							}
						},
						{
							loader: require.resolve('less-loader'),
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.(png|jpg|gif|woff2?|svg|eot|ttf|ogg|mp3)$/,
					use: [
						{
							loader: require.resolve('file-loader'),
							options: {}
						}
					]
				},
				{
					test: /\.hbs$/,
					loader: require.resolve('handlebars-loader')
				},
				{
					test: /\.(js|jsx)$/,
					use: require.resolve('react-hot-loader/webpack'),
					include: /node_modules/
				},
				{
					test: /\.properties$/,
					use: [
						{
							loader: path.resolve(__dirname, '../utils/properties-loader.js')
						}
					]
				}
			]
		},
		resolve: {
			extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
			alias: {
				'app-entrypoint': path.resolve(process.cwd(), 'src/app.jsx')
			},
			fallback: { path: require.resolve('path-browserify') }
		},
		output: {
			path: path.resolve(process.cwd(), 'dist'),
			filename: '[name].bundle.js',
			chunkFilename: '[name].chunk.js',
			publicPath: basePath
		},
		plugins: [
			new webpack.ProvidePlugin({
				process: 'process/browser'
			}),
			new webpack.DefinePlugin({
				PACKAGE_VERSION: JSON.stringify(pkg.version),
				ZIMBRA_PACKAGE_VERSION: semver.valid(semver.coerce(pkg.version)),
				PACKAGE_NAME: JSON.stringify(pkg.zapp.name)
			}),
			new MiniCssExtractPlugin({
				// Options similar to the same options in webpackOptions.output
				// all options are optional
				filename: 'style.[chunkhash:8].css',
				chunkFilename: '[id].css',
				ignoreOrder: false // Enable to remove warnings about conflicting order
			}),
			new CopyPlugin({
				patterns: [
					{ from: 'translations', to: 'i18n' },
					{ from: 'CHANGELOG.md', to: '.', noErrorOnMissing: true }
				]
			})
		]
	};

	defaultConfig.externals = {
		/* Exports for Apps */
		react: `__ZAPP_SHARED_LIBRARIES__['react']`,
		'react-dom': `__ZAPP_SHARED_LIBRARIES__['react-dom']`,
		'react-i18next': `__ZAPP_SHARED_LIBRARIES__['react-i18next']`,
		'react-redux': `__ZAPP_SHARED_LIBRARIES__['react-redux']`,
		lodash: `__ZAPP_SHARED_LIBRARIES__['lodash']`,
		'react-router-dom': `__ZAPP_SHARED_LIBRARIES__['react-router-dom']`,
		moment: `__ZAPP_SHARED_LIBRARIES__['moment']`,
		'styled-components': `__ZAPP_SHARED_LIBRARIES__['styled-components']`,
		'@reduxjs/toolkit': `__ZAPP_SHARED_LIBRARIES__['@reduxjs/toolkit']`,
		'@zextras/zapp-shell': `__ZAPP_SHARED_LIBRARIES__['@zextras/zapp-shell']['${pkg.zapp.name}']`,
		'@zextras/zapp-ui': `__ZAPP_SHARED_LIBRARIES__['@zextras/zapp-ui']`,
		/* Exports for App's Handlers */
		faker: `__ZAPP_SHARED_LIBRARIES__['faker']`,
		msw: `__ZAPP_SHARED_LIBRARIES__['msw']`
	};

	const confPath = path.resolve(process.cwd(), 'zapp.webpack.js');
	if (!fs.existsSync(confPath)) {
		return defaultConfig;
	}
	const molder = require(confPath);
	molder(defaultConfig, pkg, options);

	return defaultConfig;
};
