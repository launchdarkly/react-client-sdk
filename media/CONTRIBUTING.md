# Contributing to the LaunchDarkly Client-side SDK for React

LaunchDarkly has published an [SDK contributor's guide](https://docs.launchdarkly.com/sdk/concepts/contributors-guide) that provides a detailed explanation of how our SDKs work. See below for additional information on how to contribute to this SDK.
 
## Submitting bug reports and feature requests

The LaunchDarkly SDK team monitors the [issue tracker](https://github.com/launchdarkly/react-client-sdk/issues) in the SDK repository. Bug reports and feature requests specific to this SDK should be filed in this issue tracker. The SDK team will respond to all newly filed issues within two business days.

## Submitting pull requests

We encourage pull requests and other contributions from the community. Before submitting pull requests, ensure that all temporary or unintended code is removed. Don't worry about adding reviewers to the pull request; the LaunchDarkly SDK team will add themselves. The SDK team will acknowledge all pull requests within two business days.

## Build instructions

Note that this repository contains only the React SDK code that provides a convenient way for React code to interact with the LaunchDarkly JavaScript SDK. The JavaScript SDK functionality is in the [`launchdarkly-js-client-sdk`](https://www.npmjs.com/package/launchdarkly-js-client-sdk) package whose source code is in [js-client-sdk](https://github.com/launchdarkly/js-client-sdk), and also the core package `launchdarkly-js-sdk-common` in [js-sdk-common](https://github.com/launchdarkly/js-sdk-common).

### Installing dependencies

```
npm install
```

### Building

```
npm run build
```

### Testing

```
npm test
```
