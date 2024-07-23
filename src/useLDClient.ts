import { useContext } from 'react';
import context from './context';

/**
 * `useLDClient` is a custom hook which returns the underlying [LaunchDarkly JavaScript SDK client object](https://launchdarkly.github.io/js-client-sdk/interfaces/LDClient.html).
 * Like the `useFlags` custom hook, `useLDClient` also uses the `useContext` primitive to access the LaunchDarkly
 * context set up by `withLDProvider`. You will still need to use the `withLDProvider` HOC
 * to initialise the react sdk to use this custom hook.
 *
 * @return The `launchdarkly-js-client-sdk` `LDClient` object
 */
const useLDClient = () => {
  const { ldClient } = useContext(context);

  return ldClient;
};

export default useLDClient;
