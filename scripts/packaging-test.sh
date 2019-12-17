#!/bin/bash

set -e

npm pack
TARBALL=$(ls *.tgz)
trap "rm ${TARBALL}" EXIT

tar tfz ${TARBALL} | grep '^package/lib/.*\.js$' || (echo "tarball contained no .js files"; exit 1)
tar tfz ${TARBALL} | grep '^package/lib/.*\.d\.ts$' || (echo "tarball contained no .d.ts files"; exit 1)

echo "tarball contained .js and .d.ts files in package/lib/ - OK"
