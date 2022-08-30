import { useContext } from 'react';
import context from './context';

/**
 * Provides the LaunchDarkly client initialization error, if there was one.
 *
 * @return The `launchdarkly-js-client-sdk` `LDClient` initialization error
 */
export default function useLDClientError() {
  const { error } = useContext(context);

  return error;
}
