const { readFileSync } = require('fs');
const path = require('path');

exports.pkg = JSON.parse(readFileSync(path.resolve(process.cwd(), 'package.json')));
