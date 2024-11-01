import React, { useContext } from 'react';
import { defaultReactOptions, ReactSdkContext } from './types';

/**
 * Provides the LaunchDarkly client initialization error, if there was one.
 *
 * @param reactContext If specified, the custom React context will be used.
 *
 * @return The `launchdarkly-js-client-sdk` `LDClient` initialization error
 */
export default function useLDClientError(reactContext?: React.Context<ReactSdkContext>) {
  const { error } = useContext(reactContext ?? defaultReactOptions.reactContext);

  return error;
}
