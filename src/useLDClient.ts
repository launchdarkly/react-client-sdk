import React, { useContext } from 'react';
import { defaultReactOptions, ReactSdkContext } from './types';

// eslint:disable:max-line-length
/**
 * `useLDClient` is a custom hook which returns the underlying [LaunchDarkly JavaScript SDK client object](https://launchdarkly.github.io/js-client-sdk/interfaces/LDClient.html).
 * Like the `useFlags` custom hook, `useLDClient` also uses the `useContext` primitive to access the LaunchDarkly
 * context set up by `withLDProvider`. You will still need to use the `withLDProvider` HOC
 * to initialise the react sdk to use this custom hook.
 *
 * @param reactContext If specified, the custom React context will be used.
 *
 * @return The `launchdarkly-js-client-sdk` `LDClient` object
 */
const useLDClient = (reactContext?: React.Context<ReactSdkContext>) => {
  const { ldClient } = useContext(reactContext ?? defaultReactOptions.reactContext);

  return ldClient;
};

export default useLDClient;
