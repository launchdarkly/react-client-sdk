let version = process.env.VERSION;
if (!version) {
  const package = require('../package.json');
  version = package.version;
}

module.exports = {
  out: '/tmp/project-releaser/project/docs/build/html',
  exclude: [
    '**/node_modules/**',
    'test-types.ts'
  ],
  name: `LaunchDarkly React SDK (${version})`,
  readme: 'none',                // don't add a home page with a copy of README.md
  entryPoints: "/tmp/project-releaser/project/src/index.ts",
  entryPointStrategy: "expand"
};
