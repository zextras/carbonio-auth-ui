/* eslint-disable no-console */
const arg = require('arg');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { runBuild } = require('./build');
const { pkg } = require('./utils/pkg');
const { buildSetup } = require('./utils/setup');

const ENTRY_REGEX = /^app\..*\.js$/;
function parseArguments() {
	const args = arg(
		{
			'--server': String,
			'-p': '--server'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		podman: args['--server']
	};
}

const updateJson = (jsonObject, stats) => {
	const index = jsonObject.components.findIndex((component) => component.name === pkg.zapp.name);
	const newEntry = {
		name: pkg.zapp.name,
		commit: buildSetup.commitHash,
		display: pkg.zapp.display,
		route: pkg.zapp.route,
		description: pkg.description,
		version: pkg.version,
		priority: pkg.zapp.priority,
		js_entrypoint:
			buildSetup.basePath + Object.keys(stats.compilation.assets).find((p) => ENTRY_REGEX.test(p))
	};
	if (index >= 0) {
		// eslint-disable-next-line no-param-reassign
		jsonObject.components[index] = newEntry;
	} else {
		jsonObject.components.push(newEntry);
	}
	return jsonObject;
};
exports.runDeploy = async () => {
	const options = parseArguments();
	const stats = await runBuild();
	if (!options.server) {
		console.log('- Deploying to the carbonio podman container...');
		execSync(
			`podman cp dist/. carbonio:opt/zextras/web/iris/${pkg.zapp.name}/${buildSetup.commitHash}`
		);
		console.log('- Updating components.json...');
		const components = JSON.stringify(
			updateJson(
				JSON.parse(
					execSync('podman exec carbonio cat /opt/zextras/web/iris/components.json').toString()
				),
				stats
			)
		).replace(/"/g, '\\"');
		execSync(
			`podman exec -i carbonio bash -c "echo '${components}' > /opt/zextras/web/iris/components.json"`
		);
		console.log(chalk.bgBlue.white.bold('Deploy Completed'));
	}
};
