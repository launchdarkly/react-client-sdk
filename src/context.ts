import { createContext } from 'react';
import { LDClient, LDFlagSet, LDUser } from 'launchdarkly-js-client-sdk';

/**
 * The LaunchDarkly context stored in the Provider state and passed to consumers.
 */
interface LDContext {
  /**
   * Contains all flags from LaunchDarkly. This object will always exist but will be empty {} initially
   * until flags are fetched from the LaunchDarkly servers.
   */
  flags: LDFlagSet;

  /**
   * A function to initialize the ldClient.
   *
   * Normally, the ldClient is automatically initialized for you, but if you set reactOptions.manualyInitializeLDClient
   * to true, then you will have to manually call initLDClient.
   *
   * initLDClient will not execute if the ldClient has already been initialized.
   *
   * initLDClient will not execute if you are using asyncWithLDProvider since the ldClient is initialized for you.
   */
  initLDClient(user?: LDUser): void;

  /**
   * An instance of `LDClient` from the LaunchDarkly JS SDK (`launchdarkly-js-client-sdk`).
   * This will be be undefined initially until initialization is complete.
   *
   * @see http://docs.launchdarkly.com/docs/js-sdk-reference
   */
  ldClient?: LDClient;
}

/**
 * @ignore
 */
const context = createContext<LDContext>({ flags: {}, initLDClient: () => undefined, ldClient: undefined });
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
