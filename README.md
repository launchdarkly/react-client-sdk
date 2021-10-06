# LaunchDarkly Client-side SDK for React

[![Circle CI](https://circleci.com/gh/launchdarkly/react-client-sdk/tree/master.svg?style=svg)](https://circleci.com/gh/launchdarkly/react-client-sdk/tree/master)

## LaunchDarkly overview

[LaunchDarkly](https://www.launchdarkly.com) is a feature management platform that serves over 100 billion feature flags daily to help teams build better software, faster. [Get started](https://docs.launchdarkly.com/home/getting-started) using LaunchDarkly today!

[![Twitter Follow](https://img.shields.io/twitter/follow/launchdarkly.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/intent/follow?screen_name=launchdarkly)

## Supported React versions

This version of the LaunchDarkly SDK is compatible with versions 16.3.0 and later of React because it uses React's Context API. However, if you are using the SDK's Hooks API or `asyncWithLDProvider`, then you must use React version 16.8.0 or later.

Additionally, refer to the [JavaScript SDK README](https://github.com/launchdarkly/js-client-sdk#browser-compatibility) to learn more about browser compatibility.

## Getting started

Refer to the [SDK documentation](https://docs.launchdarkly.com/sdk/client-side/react/react-web#getting-started) for instructions on getting started with using the SDK.

Please note that the React SDK has two special requirements in terms of your LaunchDarkly environment. First, in terms of the credentials for your environment that appear on your [Account Settings](https://app.launchdarkly.com/settings/projects) dashboard, the React SDK uses the "Client-side ID"-- not the "SDK key" or the "Mobile key". Second, for any feature flag that you will be using in React code, you must check the "Make this flag available to client-side SDKs" box on that flag's Settings page.

## Learn more

Check out our [documentation](https://docs.launchdarkly.com) for in-depth instructions on configuring and using LaunchDarkly. You can also head straight to the [complete reference guide for this SDK](https://docs.launchdarkly.com/docs/react-sdk-reference) or our [code-generated API documentation](https://launchdarkly.github.io/react-client-sdk/).

This SDK builds upon the [JavaScript SDK](https://github.com/launchdarkly/js-client-sdk), supporting all of the same functionality, but using React's Context API to provide additional conveniences. While using this SDK you may need to directly interact with the underlying JavaScript SDK. For more information on how to use the JavaScript SDK and its characteristics, see the [SDK's README](https://github.com/launchdarkly/js-client-sdk/blob/master/README.md).

## Testing

We run integration tests for all our SDKs using a centralized test harness. This approach gives us the ability to test for consistency across SDKs, as well as test networking behavior in a long-running application. These tests cover each method in the SDK, and verify that event sending, flag evaluation, stream reconnection, and other aspects of the SDK all behave correctly.

## Contributing

We encourage pull requests and other contributions from the community. Check out our [contributing guidelines](CONTRIBUTING.md) for instructions on how to contribute to this SDK.

## About LaunchDarkly

* LaunchDarkly is a continuous delivery platform that provides feature flags as a service and allows developers to iterate quickly and safely. We allow you to easily flag your features and manage them from the LaunchDarkly dashboard.  With LaunchDarkly, you can:
    * Roll out a new feature to a subset of your users (like a group of users who opt-in to a beta tester group), gathering feedback and bug reports from real-world use cases.
    * Gradually roll out a feature to an increasing percentage of users, and track the effect that the feature has on key metrics (for instance, how likely is a user to complete a purchase if they have feature A versus feature B?).
    * Turn off a feature that you realize is causing performance problems in production, without needing to re-deploy, or even restart the application with a changed configuration file.
    * Grant access to certain features based on user attributes, like payment plan (eg: users on the ‘gold’ plan get access to more features than users in the ‘silver’ plan). Disable parts of your application to facilitate maintenance, without taking everything offline.
* LaunchDarkly provides feature flag SDKs for a wide variety of languages and technologies. Read [our documentation](https://docs.launchdarkly.com/sdk) for a complete list.
* Explore LaunchDarkly
    * [launchdarkly.com](https://www.launchdarkly.com/ "LaunchDarkly Main Website") for more information
    * [docs.launchdarkly.com](https://docs.launchdarkly.com/  "LaunchDarkly Documentation") for our documentation and SDK reference guides
    * [apidocs.launchdarkly.com](https://apidocs.launchdarkly.com/  "LaunchDarkly API Documentation") for our API documentation
    * [blog.launchdarkly.com](https://blog.launchdarkly.com/  "LaunchDarkly Blog Documentation") for the latest product updates
