const path = require('path');
const fs = require('fs');

exports.createBabelConfig = (fileName) => {
	const confPath = path.resolve(process.cwd(), fileName);

	if (!fs.existsSync(confPath)) {
		throw new Error(`${fileName} file not found.`);
	}

	// eslint-disable-next-line import/no-dynamic-require,global-require
	return require(confPath);
};
