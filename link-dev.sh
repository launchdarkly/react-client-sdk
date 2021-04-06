#!/bin/bash

echo "===== Installing all dependencies..."
npm install

echo "===== Building react sdk"
npm run build

echo "===== Install prod dependencies"
rm -rf node_modules
npm install --production

echo "===== Linking to async-provider"
mkdir -p examples/async-provider/node_modules
rm -rf examples/async-provider/node_modules/launchdarkly-react-client-sdk
mkdir -p examples/async-provider/node_modules/launchdarkly-react-client-sdk/node_modules
mkdir -p examples/async-provider/node_modules/launchdarkly-react-client-sdk/lib
cp package.json examples/async-provider/node_modules/launchdarkly-react-client-sdk/package.json
cp -r node_modules/ examples/async-provider/node_modules/launchdarkly-react-client-sdk/node_modules/
cp -r lib/ examples/async-provider/node_modules/launchdarkly-react-client-sdk/lib/

echo "===== Linking to hoc"
mkdir -p examples/hoc/node_modules
rm -rf examples/hoc/node_modules/launchdarkly-react-client-sdk
mkdir -p examples/hoc/node_modules/launchdarkly-react-client-sdk/node_modules
mkdir -p examples/hoc/node_modules/launchdarkly-react-client-sdk/lib
cp package.json examples/hoc/node_modules/launchdarkly-react-client-sdk/package.json
cp -r node_modules/ examples/hoc/node_modules/launchdarkly-react-client-sdk/node_modules/
cp -r lib/ examples/hoc/node_modules/launchdarkly-react-client-sdk/lib/
