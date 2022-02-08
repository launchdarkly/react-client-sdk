# Change log

All notable changes to the LaunchDarkly Client-side SDK for React will be documented in this file. For the source code for versions 2.13.0 and earlier, see the corresponding tags in the [js-client-sdk](https://github.com/launchdarkly/js-client-sdk) repository; this code was previously in a monorepo package there. See also the [JavaScript SDK changelog](https://github.com/launchdarkly/js-client-sdk/blob/master/CHANGELOG.md), since the React SDK inherits all of the underlying functionality of the JavaScript SDK; this file covers only changes that are specific to the React interface. This project adheres to [Semantic Versioning](http://semver.org).

## [2.25.0] - 2022-02-08
Updated to version 2.20.1 of the JavaScript SDK, incorporating improvements from the [2.19.4](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.19.4), [2.20.0](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.20.0), and [2.20.1](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.20.1) releases.

### Added:
- Added exports of the types `LDReactOptions`, `ProviderConfig`, `AsyncProviderConfig`, and `AllFlagsLDClient`. These were referenced in exported functions, but were not previously importable from the main module.
- New property `LDOptions.requestHeaderTransform` allows custom headers to be added to all HTTP requests. This may be necessary if you have an Internet gateway that uses a custom header for authentication. Note that custom headers may cause cross-origin browser requests to be rejected unless you have a way to ensure that the header name also appears in `Access-Control-Allow-Headers` for CORS preflight responses; if you are connecting to the LaunchDarkly Relay Proxy, it has a way to configure this.

### Fixed:
- If the browser local storage mechanism throws an exception (for instance, if it is disabled or if storage is full), the SDK now correctly catches the exception and logs a message about the failure. It will only log this message once during the lifetime of the SDK client. ([#109](https://github.com/launchdarkly/react-client-sdk/issues/109))
- Removed an obsolete warning that would appear in the browser console after calling `track`: `Custom event "_____" does not exist`. Originally, the SDK had an expectation that `track` would be used only for event keys that had been previously defined as custom goals in the LaunchDarkly dashboard. That is still often the case, but it is not required and LaunchDarkly no longer sends custom goal names to the SDK, so the warning was happening even if such a goal did exist.

## [2.24.0] - 2021-12-09
### Added:
- When initializing the SDK, consumers can now optionally pass in a previously-initialized `ldClient` instance (thanks, [TimboTambo](https://github.com/launchdarkly/react-client-sdk/pull/105)!)
- Introduced missing typedoc annotations for `AsyncProviderConfig`.

## [2.23.3] - 2021-11-02
### Added:
- The `AsyncProviderConfig` type was added. This type is a clone of `ProviderConfig` except that `deferInitialization` is marked as deprecated; see the "Deprecated" section below for more information.

### Fixed:
- Fixed a bug where sourcemaps did not point to released files. ([#66](https://github.com/launchdarkly/react-client-sdk/issues/66))

### Deprecated:
- Deprecated the ability to specify `deferInitialization` in the `config` object parameter for `asyncWithLDProvider`. The `asyncWithLDProvider` function needs to be initialized at the app entry point prior to render to ensure flags and the `ldClient` are ready at the beginning of the app. As a result, initialization cannot be deferred when using `asyncWithLDProvider`. ([#99](https://github.com/launchdarkly/react-client-sdk/issues/99))

## [2.23.2] - 2021-10-06
### Changed:
- Improved `withLDProvider` so that prop types can be provided (thanks, [dsifford](https://github.com/launchdarkly/react-client-sdk/pull/97)!)

## [2.23.1] - 2021-09-03
### Fixed:
- When using `asyncWithLDProvider`, components added to the DOM after client initialization now use the latest known flag values instead of the bootstrapped values.

## [2.23.0] - 2021-07-16
### Added:
- HOC now hoists statics (thanks, [NathanWaddell121107](https://github.com/launchdarkly/react-client-sdk/pull/71)!)

## [2.22.3] - 2021-06-09
### Fixed:
- Events for the [LaunchDarkly debugger](https://docs.launchdarkly.com/home/flags/debugger) are now properly pre-processed to omit private user attributes, as well as enforce only expected top level attributes are sent.
- Events for the [LaunchDarkly debugger](https://docs.launchdarkly.com/home/flags/debugger) now include the index of the variation responsible for the evaluation result.


## [2.22.2] - 2021-04-06
### Changed:
- Updated the SDK&#39;s peer dependencies so that it can run in an application with React 17 (thanks, [maclockard](https://github.com/launchdarkly/react-client-sdk/pull/61)!)

## [2.22.1] - 2021-04-02
### Fixed:
- The property `LDOptions.inlineUsersInEvents` was not included in the TypeScript definitions for the JavaScript SDK.

## [2.22.0] - 2021-01-27
### Added:
- Added the `alias` method to `LDClient`. This method can be used to associate two user objects for analytics purposes. When invoked, this method will queue a new alias event to be sent to LaunchDarkly.
- Added the `autoAliasingOptOut` configuration option. This can be used to control the new automatic aliasing behavior of the `identify` method; by passing `autoAliasingOptOut: true`, `identify` will not automatically generate alias events.

### Changed:
- `LDClient`&#39;s `identify` method will now automatically generate an alias event when switching from an anonymous to a known user. This event associates the two users for analytics purposes as they most likely represent a single person.

## [2.21.0] - 2020-11-17
### Fixed:
- The `camelCaseKeys` utility function is now exported as a function instead of as an object containing a `camelCaseKeys` function. `camelCaseKeys.camelCaseKeys` remains for backwards compatibility.
- Updated the `LDEvaluationDetail.reason` type definition to be nullable. This value will be `null` when `LDOptions.evaluationReasons` is `false`.

### Deprecated:
- `camelCaseKeys.camelCaseKeys` is now deprecated-- see the note above.

## [2.20.2] - 2020-09-14
### Fixed:
- In streaming mode, when connecting to the Relay Proxy rather than directly to the LaunchDarkly streaming service, if the current user was changed twice within a short time it was possible for the SDK to revert to flag values from the previous user. (Fixed in JS SDK 2.18.1)

## [2.20.1] - 2020-08-19
### Fixed:
- Fixed an issue where change listeners would update the component state when any flag was modified, even if the client instance was configured such that it was not subscribed for the modified flag. (Thanks, [clayembry](https://github.com/launchdarkly/react-client-sdk/pull/46)!)

## [2.20.0] - 2020-07-17
### Changed:
- Updated `launchdarkly-js-client-sdk` version to 2.18.0, which adds the [`disable-sync-event-post`](https://launchdarkly.github.io/js-client-sdk/interfaces/_launchdarkly_js_client_sdk_.ldoptions.html#disablesynceventpost) option.

## [2.19.0] - 2020-07-15
### Added:
- Exposed `LDProvider` as a standalone component. (Thanks, [nimi and morton](https://github.com/launchdarkly/react-client-sdk/pull/31)!)
- A new configuration option, `deferInitialization`, allows `LDClient` initialization to be deferred until the user object is defined. (Thanks, [bezreyhan](https://github.com/launchdarkly/react-client-sdk/pull/40)!)

### Fixed:
- Removed uses of `String.startsWith` that caused errors in Internet Explorer unless a polyfill for that function was present.


## [2.18.2] - 2020-05-27
### Fixed:
- Fixed a TypeError where TypeScript attempted to redefine the `default` property on `withLDProvider`. This issue was introduced in version 2.18.1 of this SDK. ([#36](https://github.com/launchdarkly/react-client-sdk/issues/36))

## [2.18.1] - 2020-05-19
### Fixed:
- Updated JS SDK version to 2.17.5, to pick up bug fixes in [2.17.5](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.17.5), [2.17.4](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.17.4), [2.17.3](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.17.3), [2.17.2](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.17.2), and [2.17.1](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.17.1). The intended practice is to release a new React SDK patch every time there is a JS SDK patch (unless several JS SDK patches are released very close together), but this had fallen behind.

## [2.18.0] - 2020-02-19
Note: if you are using the LaunchDarkly Relay Proxy to forward events, update the Relay to version 5.10.0 or later before updating to this React SDK version.

### Added:
- The SDK now periodically sends diagnostic data to LaunchDarkly, describing the version and configuration of the SDK, the architecture and version of the runtime platform, and performance statistics. No credentials, hostnames, or other identifiable values are included. This behavior can be disabled with the `diagnosticOptOut` option, or configured with `diagnosticRecordingInterval`.

### Fixed:
- Updated JS SDK dependency version to 2.17.0, which includes a fix for streaming mode failing when used with secure mode. See release notes for JS SDK [2.17.0](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.17.0) fror details.


## [2.17.1] - 2020-02-11
### Fixed:
- Updated JS SDK dependency version from 2.16.0 to 2.16.3 for several recent fixes. See release notes for [2.16.1](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.16.1), [2.16.2](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.16.2), [2.16.3](https://github.com/launchdarkly/js-client-sdk/releases/tag/2.16.3).

Note that while some transitive dependencies have been changed from exact versions to &#34;best compatible&#34; versions, the dependency on `js-client-sdk` is still an exact version dependency so that each release of `react-client-sdk` has well-defined behavior.

## [2.17.0] - 2019-12-18
### Added:
- The `camelCaseKeys` utility function is now exposed as part of the SDK API. This function can be called from customers' code to work around the fact that `ldClient` functionality does not automatically camel-case keys in the same manner as the React SDK's props and hooks features.

## [2.16.2] - 2019-12-17
### Fixed:
- Turned off the default setting of the `wrapperName` property because the LaunchDarkly service does not support it yet; it was causing CORS errors.

## [2.16.1] - 2019-12-17
***The 2.16.0 release was unpublished due to a packaging error. This is a rerelease containing the same changes but fixing the packaging.***

### Added:
- Configuration property `eventCapacity`: the maximum number of analytics events (not counting evaluation counters) that can be held at once, to prevent the SDK from consuming unexpected amounts of memory in case an application generates events unusually rapidly. In JavaScript code this would not normally be an issue, since the SDK flushes events every two seconds by default, but you may wish to increase this value if you will intentionally be generating a high volume of custom or identify events. The default value is 100.
- Configuration properties `wrapperName` and `wrapperVersion`: used by the React SDK to identify a JS SDK instance that is being used with a wrapper API.

### Changed:
- The SDK now logs a warning if any configuration property has an inappropriate type, such as `baseUri:3` or `sendEvents:"no"` (normally not possible in TypeScript, but could happen if an arbitrary object is cast to `LDOptions`). For boolean properties, the SDK will still interpret the value in terms of truthiness, which was the previous behavior. For all other types, since there's no such commonly accepted way to coerce the type, it will fall back to the default setting for that property; previously, the behavior was undefined but most such mistakes would have caused the SDK to throw an exception at some later point.

### Fixed:
- When calling `identify`, the current user (as reported by `getUser()`) was being updated before the SDK had received the new flag values for that user, causing the client to be temporarily in an inconsistent state where flag evaluations would be associated with the wrong user in analytics events. Now, the current-user state will stay in sync with the flags and change only when they have finished changing. (Thanks, [edvinerikson](https://github.com/launchdarkly/js-sdk-common/pull/3)!)

### Deprecated:
- The `samplingInterval` configuration property was deprecated in the code in the previous minor version release, and in the changelog, but the deprecation notice was accidentally omitted from the documentation comments. It is hereby deprecated again.

## [2.16.0] - 2019-12-16
***This release was broken and has been removed.***

## [2.15.1] - 2019-11-14
### Fixed:
- Fixed a bug where, when bootstrapping flag data, subsequent flag changes were incorrectly applied to the original bootstrapped data instead of the latest known flag data.
- Fixed browser warnings and errors in the sample application.

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
