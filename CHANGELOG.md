# Change log

All notable changes to the LaunchDarkly Client-side SDK for React will be documented in this file. For the source code for versions 2.12.4 and earlier, see the corresponding tags in the [js-client-sdk](https://github.com/launchdarkly/js-client-sdk) repository; this code was previously in a monorepo package there. See also the [JavaScript SDK changelog](https://github.com/launchdarkly/js-client-sdk/blob/master/CHANGELOG.md), since the React SDK inherits all of the underlying functionality of the JavaScript SDK; this file covers only changes that are specific to the React interface. This project adheres to [Semantic Versioning](http://semver.org).

## [2.12.4] - 2019-07-10
### Fixed:
- The `homepage` attribute in the `launchdarkly-react-client-sdk` and `launchdarkly-react-client-sdk-example` packages has been updated to the correct value.

## [2.11.0] - 2019-06-06
### Added:
- Added support for hooks to the React SDK.

## [2.10.3] - 2019-05-08 
### Changed:
- Changed the package name from `ldclient-react` to `launchdarkly-react-client-sdk`.
 
There are no other changes in this release. Substituting `ldclient-react` version 2.10.2 with `launchdarkly-react-client-sdk` version 2.10.3 will not affect functionality.

## [2.9.5] - 2019-03-12
### Fixed:
- In React, when using the `bootstrap` property to preload the SDK client with flag values, the client will now become ready immediately and make the flags available to other components as soon as it is initialized; previously this did not happen until after `componentDidMount`.

## [2.9.3] - 2019-02-12
### Fixed:
- The React SDK was pulling in the entire `lodash` package. This has been improved to only require the much smaller `camelcase` tool from `lodash`.
- The React SDK now lists React itself as a peer dependency rather than a regular dependency, so it will not included twice in an application that already requires React.

## [2.9.1] - 2019-02-08
### Fixed:
- The previous release of `ldclient-react` was broken: the package did not contain the actual files. The packaging script has been fixed. There are no other changes.

## [2.9.0] - 2019-02-01
### Added:
- The new `ldclient-react` package provides a convenient mechanism for using the LaunchDarkly SDK within the React framework.
