module.exports = {
	presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
	plugins: [
		'@babel/plugin-transform-runtime',
		'@babel/plugin-proposal-class-properties',
		'babel-plugin-styled-components',
		[
			'i18next-extract',
			{
				outputPath: 'translations/{{ns}}.json',
				defaultNS: 'en',
				jsonSpace: 4
			}
		]
	]
};
