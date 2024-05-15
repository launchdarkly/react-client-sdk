#!/bin/bash

echo "===== Installing all dependencies..."
npm install --force

echo "===== Building react sdk"
npm run build

echo "===== Install prod dependencies"
rm -rf node_modules
npm install --force --omit=dev

echo "===== Linking to examples"
declare -a examples=(async-provider hoc typescript deferred-initialization)

for example in "${examples[@]}"
do
  echo "===== Linking to $example example"
  mkdir -p examples/${example}/node_modules
  rm -rf examples/${example}/node_modules/launchdarkly-react-client-sdk
  mkdir -p examples/${example}/node_modules/launchdarkly-react-client-sdk/node_modules
  mkdir -p examples/${example}/node_modules/launchdarkly-react-client-sdk/lib
  cp package.json examples/${example}/node_modules/launchdarkly-react-client-sdk/package.json
  cp -r node_modules/* examples/${example}/node_modules/launchdarkly-react-client-sdk/node_modules/
  cp -r lib/* examples/${example}/node_modules/launchdarkly-react-client-sdk/lib/
done
