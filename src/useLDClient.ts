import { useContext } from 'react';
import context from './context';

// tslint:disable:max-line-length
/**
 * `useLDClient` is a custom hook which returns the underlying [LaunchDarkly JavaScript SDK client object](https://launchdarkly.github.io/js-client-sdk/interfaces/_launchdarkly_js_client_sdk_.ldclient.html).
 * Like the `useFlags` custom hook, `useLDClient` also uses the `useContext` primitive to access the LaunchDarkly
 * context set up by `withLDProvider`. You will still need to use the `withLDProvider` HOC
 * to initialise the react sdk to use this custom hook.
 *
 * @return The `launchdarkly-js-client-sdk` `LDClient` object
 */
// tslint:enable:max-line-length
const useLDClient = () => {
  const { ldClient } = useContext(context);

  return ldClient;
};

export default useLDClient;
