import { LDClient, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import * as React from 'react';

/**
 * Initialization options for the LaunchDarkly React SDK. These are in addition to the options exposed
 * by [[LDOptions]] which are common to both the JavaScript and React SDKs.
 */
export interface LDReactOptions {
  /**
   * Whether the React SDK should transform flag keys into camel-cased format.
   * Using camel-cased flag keys allow for easier use as prop values, however,
   * these keys won't directly match the flag keys as known to LaunchDarkly.
   * Consequently, flag key collisions may be possible and the Code References feature
   * will not function properly.
   *
   * This is true by default, meaning that keys will automatically be converted to camel-case.
   *
   * For more information, see the React SDK Reference Guide on
   * [flag keys](https://docs.launchdarkly.com/sdk/client-side/react/react-web#flag-keys).
   *
   * @see https://docs.launchdarkly.com/sdk/client-side/react/react-web#flag-keys
   */
  useCamelCaseFlagKeys?: boolean;
}

/**
 * Contains default values for the `reactOptions` object.
 */
export const defaultReactOptions = { useCamelCaseFlagKeys: true };

/**
 * Configuration object used to initialise LaunchDarkly's JS client.
 */
export interface ProviderConfig {
  /**
   * Your project and environment specific client side ID. You can find
   * this in your LaunchDarkly portal under Account settings. This is
   * the only mandatory property required to use the React SDK.
   */
  clientSideID: string;

  /**
   * A LaunchDarkly user object. If unspecified, a new user with a
   * random key will be created and used. This user's key will remain constant across browser sessions.
   *
   * @see https://docs.launchdarkly.com/sdk/features/user-config#javascript
   */
  user?: LDUser;

  /**
   * If set to true, the ldClient will not be initialized until the user prop has been defined.
   */
  deferInitialization?: boolean;

  /**
   * LaunchDarkly initialization options. These options are common between LaunchDarkly's JavaScript and React SDKs.
   *
   * @see https://docs.launchdarkly.com/sdk/features/config#javascript
   */
  options?: LDOptions;

  /**
   * Additional initialization options specific to the React SDK.
   *
   * @see options
   */
  reactOptions?: LDReactOptions;

  /**
   * If specified, `launchdarkly-react-client-sdk` will only request and listen to these flags.
   * Otherwise, all flags will be requested and listened to.
   */
  flags?: LDFlagSet;

  /**
   * Optionally, the ldClient can be initialised outside of the provider
   * and passed in, instead of being initialised by the provider.
   * Note: it should only be passed in when it has emitted the 'ready'
   * event, to ensure that the flags are properly set.
   */
  ldClient?: LDClient | Promise<LDClient | undefined>;
}

/**
 * Configuration object used to initialize LaunchDarkly's JS client asynchronously.
 */
export type AsyncProviderConfig = Omit<ProviderConfig, 'deferInitialization'> & {
  /**
   * @deprecated - `asyncWithLDProvider` does not support the `deferInitialization` config option because
   * `asyncWithLDProvider` needs to be initialized at the app entry point prior to render to ensure flags and the
   * ldClient are ready at the beginning of the app.
   */
  deferInitialization?: boolean;
};

/**
 * The return type of withLDProvider HOC. Exported for testing purposes only.
 *
 * @ignore
 */
export interface EnhancedComponent extends React.Component {
  subscribeToChanges(ldClient: LDClient): void;
  // tslint:disable-next-line:invalid-void
  componentDidMount(): Promise<void>;
  // tslint:disable-next-line:invalid-void
  componentDidUpdate(prevProps: ProviderConfig): Promise<void>;
}

/**
 * Return type of `initLDClient`.
 */
export interface AllFlagsLDClient {
  /**
   * Contains all flags from LaunchDarkly.
   */
  flags: LDFlagSet;

  /**
   * An instance of `LDClient` from the LaunchDarkly JS SDK (`launchdarkly-js-client-sdk`).
   *
   * @see https://docs.launchdarkly.com/sdk/client-side/javascript
   */
  ldClient: LDClient;
}
