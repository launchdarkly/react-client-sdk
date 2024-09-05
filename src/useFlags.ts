import { LDFlagSet } from 'launchdarkly-js-client-sdk';
import React, { useContext } from 'react';
import { defaultReactOptions, ReactSdkContext } from './types';

/**
 * `useFlags` is a custom hook which returns all feature flags. It uses the `useContext` primitive
 * to access the LaunchDarkly context set up by `withLDProvider`. As such you will still need to
 * use the `withLDProvider` HOC at the root of your app to initialize the React SDK and populate the
 * context with `ldClient` and your flags.
 *
 * @param reactContext If specified, the provided React context will be used.
 *
 * @return All the feature flags configured in your LaunchDarkly project
 */
const useFlags = <T extends LDFlagSet = LDFlagSet>(reactContext?: React.Context<ReactSdkContext>): T => {
  const { flags } = useContext<ReactSdkContext>(reactContext ?? defaultReactOptions.reactContext);

  return flags as T;
};
export default useFlags;
