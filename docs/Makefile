
# This makefile can be run locally (cd docs && LD_RELEASE_VERSION=xxx make) but it will
# also be run automatically when doing a release via Releaser.

ifeq (,${LD_RELEASE_VERSION})
TITLE=LaunchDarkly React SDK
else
TITLE=LaunchDarkly React SDK (${LD_RELEASE_VERSION})
endif

html:
	cp ../package.json before-typedoc-package.json
	cp ../package-lock.json before-typedoc-package-lock.json
	cd .. && npm install "typedoc@<0.21.0"
	rm -rf build
	mkdir -p build/html
# For unknown reasons, TypeDoc doesn't seem to work reliably in this project when we put our
# configuration in typedoc.js (as we do in all our other JS projects). Therefore we'll just
# put all the options on the command line.
# Also for unknown reasons, TypeDoc does not like us to specify a source path of ./src even
# though that's what we do in our other projects, so we'll cd to the project root.
	cd .. && ./node_modules/.bin/typedoc src \
	  --out ./docs/build/html \
	  --name "${TITLE}" \
	  --exclude '**/*.test.ts*' \
	  --excludeExternals \
	  --externalPattern "**/node_modules/**" \
	  --readme none
	mv before-typedoc-package.json ../package.json
	mv before-typedoc-package-lock.json ../package-lock.json

.PHONY: html
