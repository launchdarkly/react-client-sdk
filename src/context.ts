import { createContext } from 'react';
import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';
import { LDFlagKeyMap } from './types';

/**
 * The LaunchDarkly context stored in the Provider state and passed to consumers.
 */
interface LDContext {
  /**
   * JavaScript proxy that will trigger a LDClient#variation call on flag read in order
   * to register a flag evaluation event in LaunchDarkly. Empty {} initially
   * until flags are fetched from the LaunchDarkly servers.
   */
  flags: LDFlagSet;

  /**
   * Map of camelized flag keys to their original unmodified form. Empty if useCamelCaseFlagKeys option is false.
   */
  flagKeyMap: LDFlagKeyMap;

  /**
   * An instance of `LDClient` from the LaunchDarkly JS SDK (`launchdarkly-js-client-sdk`).
   * This will be be undefined initially until initialization is complete.
   *
   * @see https://docs.launchdarkly.com/sdk/client-side/javascript
   */
  ldClient?: LDClient;

  /**
   * LaunchDarkly client initialization error, if there was one.
   */
  error?: Error;
}

/**
 * @ignore
 */
const context = createContext<LDContext>({ flags: {}, flagKeyMap: {}, ldClient: undefined });
const {
  /**
   * @ignore
   */
  Provider,
  /**
   * @ignore
   */
  Consumer,
} = context;

export { Provider, Consumer, LDContext };
export default context;
