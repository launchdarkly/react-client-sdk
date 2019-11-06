# Change log

All notable changes to the LaunchDarkly Client-side SDK for React will be documented in this file. For the source code for versions 2.13.0 and earlier, see the corresponding tags in the [js-client-sdk](https://github.com/launchdarkly/js-client-sdk) repository; this code was previously in a monorepo package there. See also the [JavaScript SDK changelog](https://github.com/launchdarkly/js-client-sdk/blob/master/CHANGELOG.md), since the React SDK inherits all of the underlying functionality of the JavaScript SDK; this file covers only changes that are specific to the React interface. This project adheres to [Semantic Versioning](http://semver.org).

## [2.15.0] - 2019-11-06
### Changed:
- Changed the behavior of the warning message that is logged on failing to establish a streaming connection. Rather than the current behavior where the warning message appears upon each failed attempt, it will now only appear on the first failure in each series of attempts. Also, the message has been changed to mention that retries will occur. ([#182](https://github.com/launchdarkly/js-client-sdk/issues/182))

### Fixed:
- The `beforeunload` event handler no longer calls `close` on the client, which was causing the SDK to become unusable if the page did not actually close after this event fired (for instance if the browser navigated to a URL that launched an external application, or if another `beforeunload` handler cancelled leaving the page). Instead, it now only flushes events. There is also an `unload` handler that flushes any additional events that might have been created by any code that ran during the `beforeunload` stage. ([#181](https://github.com/launchdarkly/js-client-sdk/issues/181))
- Removed uses of `Object.assign` that caused errors in Internet Explorer unless a polyfill for that function was present. These were removed earlier in the 2.1.1 release, but had been mistakenly added again.
- Removed development dependency on `typedoc` which caused some vulnerability warnings.

### Deprecated:
- The `samplingInterval` configuration property is deprecated and will be removed in a future version. The intended use case for the `samplingInterval` feature was to reduce analytics event network usage in high-traffic applications. This feature is being deprecated in favor of summary counters, which are meant to track all events.


## [2.14.0] - 2019-09-12
### Added:
- TypeDoc-generated documentation for all public types and methods is now [online](https://launchdarkly.github.io/react-client-sdk/).
- The `asyncWithLDProvider` function to allow for your flags and the `LDClient` to be ready for use at the beginning of your app's lifecycle.

### Changed:
- The `launchdarkly-react-client-sdk` package has been moved from the [`js-client-sdk`](https://github.com/launchdarkly/js-client-sdk) monorepo into its [own repository](https://github.com/launchdarkly/react-client-sdk). All subsequent releases will be made from this new repository.

## [2.13.0] - 2019-08-15
### Added:
- In the React SDK, the new `reactOptions` parameter to `withLDProvider` provides React-specific options that do not affect the underlying JavaScript SDK. Currently, the only such option is `useCamelCaseFlagKeys`, which is true by default but can be set to false to disable the automatic camel-casing of flag keys.
 
### Changed:
- In the React SDK, when omitting the `user` parameter to `withLDProvider`, an anonymous user will be created. This user will remain constant across browser sessions. Previously a new user was generated on each page load.

## [2.12.5] - 2019-07-29 
### Fixed:
- The React SDK was incompatible with Internet Explorer 11 due to using `String.startsWith()`. (Thanks, [cvetanov](https://github.com/launchdarkly/js-client-sdk/pull/169)!)

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
