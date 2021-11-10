/* eslint-disable import/extensions */
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const semver = require('semver');
const modifyResponse = require('node-http-proxy-json');
const { createBabelConfig } = require('./babelrc.build.js');
const { pkg } = require('../utils/pkg.js');

exports.setupWebpackWatchConfig = (options, { basePath, shellHash }) => {
	const server = `https://${options.host || '127.0.0.1:4443'}/`;
	const defaultConfig = {
		entry: {
			app: path.resolve(process.cwd(), 'sdk/scripts/utils/entry.js')
		},
		mode: 'development',
		devServer: {
			hot: true,
			port: 9000,
			historyApiFallback: {
				index: basePath,
				rewrites: { from: '/static/iris/carbonio-shell/current', to: `${basePath}/index.html` }
			},
			https: true,
			// http2: false,
			onBeforeSetupMiddleware(devServer) {
				devServer.app.get('/_cli', (req, res) => {
					res.json({
						isWatch: true,
						isStandalone: !!options.standalone,
						server: !!options.server,
						hasHandlers: !!options.hasHandlers,
						enableErrorReporter: !!options.enableErrorReporter,
						app_package: {
							package: pkg.zapp.name,
							name: pkg.zapp.name,
							label: pkg.zapp.display,
							version: pkg.version,
							description: pkg.description
						}
					});
				});
			},
			static: {
				directory: path.resolve(process.cwd(), 'node_modules', '@zextras', 'zapp-shell', 'dist'),
				publicPath: `/static/iris/carbonio-shell/${shellHash}`
			},
			open: [`/static/iris/carbonio-shell/${shellHash}`],
			proxy: [
				// {
				// 	context: ['/static/iris/carbonio-shell/current'],
				// 	secure: false,
				// 	target: 'https://localhost:9000',
				// 	pathRewrite: { '^/current': `/${shellHash}` }
				// },
				{
					context: [
						`!/static/iris/carbonio-shell/**/*`,
						`!${basePath}/**/*`,
						'!/static/iris/components.json'
					],
					target: server,
					secure: false,
					logLevel: 'debug',
					ws: true,
					cookieDomainRewrite: {
						'*': server,
						[server]: 'localhost:9000'
					}
				},
				{
					context: ['/static/iris/components.json'],
					target: server,
					secure: false,
					logLevel: 'debug',
					cookieDomainRewrite: {
						'*': server,
						[server]: 'localhost:9000'
					},
					selfHandleResponse: false,
					onProxyRes(proxyRes, req, res) {
						modifyResponse(res, proxyRes, function (body) {
							console.log('[Proxy] modifying components.json');
							const components = body.components.reduce((acc, module) => {
								if (module.name === pkg.zapp.name) {
									return [...acc, { ...module, js_entrypoint: `${basePath}app.bundle.js` }];
								}
								if (module.name === 'carbonio-error-reporter') return acc;
								return [...acc, module];
							}, []);
							// eslint-disable-next-line new-cap
							return JSON.stringify({ components });
						});
						// const bodyChunks = [];
						// proxyRes.on('data', (chunk) => {
						// 	bodyChunks.push(chunk);
						// 	console.log('data', chunk);
						// });
						// proxyRes.on('end', () => {
						// 	const body = Buffer.concat(bodyChunks);
						// 	// console.log(body.toJSON());
						// 	const original = JSON.parse(body.toString());
						// 	const components = original.components.reduce((acc, module) => {
						// 		if (module.name === pkg.zapp.name) {
						// 			return [...acc, { ...module, js_entrypoint: `${basePath}app.bundle.js` }];
						// 		}
						// 		if (module.name === 'carbonio-error-reporter') return acc;
						// 		return [...acc, module];
						// 	}, []);
						// 	// eslint-disable-next-line new-cap
						// 	res.send(new Buffer.from(JSON.stringify({ components })));
						// });
					}
				}
			]
		},
		devtool: 'source-map',
		target: 'web',
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules/,
					loader: require.resolve('babel-loader'),
					options: createBabelConfig(`babel.config.js`)
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
				// {
				// 	test: /\.(js|jsx)$/,
				// 	use: require.resolve('react-hot-loader/webpack'),
				// 	include: /node_modules/
				// },
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
			// new webpack.HotModuleReplacementPlugin(),
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
	// eslint-disable-next-line global-require, import/no-dynamic-require
	const molder = require(confPath);
	molder(defaultConfig, pkg, options);

	return defaultConfig;
};
