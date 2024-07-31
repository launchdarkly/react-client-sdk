import { useContext } from 'react';
import LDReactContext from './context';

/**
 * Provides the LaunchDarkly client initialization error, if there was one.
 *
 * @return The `launchdarkly-js-client-sdk` `LDClient` initialization error
 */
export default function useLDClientError() {
  const { error } = useContext(LDReactContext);

  return error;
}
