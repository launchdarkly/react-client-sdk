import React, { Component, PropsWithChildren } from 'react';
import { initialize, LDClient, LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';
import { EnhancedComponent, ProviderConfig, defaultReactOptions, LDReactOptions } from './types';
import { camelCaseKeys, fetchFlags, getContextOrUser, getFlattenedFlagsFromChangeset } from './utils';
import getFlagsProxy from './getFlagsProxy';
import wrapperOptions from './wrapperOptions';
import ProviderState from './providerState';

/**
 * The `LDProvider` is a component which accepts a config object which is used to
 * initialize `launchdarkly-js-client-sdk`.
 *
 * This Provider does three things:
 * - It initializes the ldClient instance by calling `launchdarkly-js-client-sdk` initialize on `componentDidMount`
 * - It saves all flags and the ldClient instance in the context API
 * - It subscribes to flag changes and propagate them through the context API
 *
 * Because the `launchdarkly-js-client-sdk` in only initialized on `componentDidMount`, your flags and the
 * ldClient are only available after your app has mounted. This can result in a flicker due to flag changes at
 * startup time.
 *
 * This component can be used as a standalone provider. However, be mindful to only include the component once
 * within your application. This provider is used inside the `withLDProviderHOC` and can be used instead to initialize
 * the `launchdarkly-js-client-sdk`. For async initialization, check out the `asyncWithLDProvider` function
 */
class LDProvider extends Component<PropsWithChildren<ProviderConfig>, ProviderState> implements EnhancedComponent {
  readonly state: Readonly<ProviderState>;

  constructor(props: ProviderConfig) {
    super(props);

    const { options } = props;

    this.state = {
      flags: {},
      unproxiedFlags: {},
      flagKeyMap: {},
    };

    if (options) {
      const { bootstrap } = options;
      if (bootstrap && bootstrap !== 'localStorage') {
        const { useCamelCaseFlagKeys } = this.getReactOptions();
        this.state = {
          flags: useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap,
          unproxiedFlags: bootstrap,
          flagKeyMap: {},
        };
      }
    }
  }

  getReactOptions = () => ({ ...defaultReactOptions, ...this.props.reactOptions });

  subscribeToChanges = (ldClient: LDClient) => {
    const { flags: targetFlags } = this.props;
    ldClient.on('change', (changes: LDFlagChangeset) => {
      const reactOptions = this.getReactOptions();
      const updates = getFlattenedFlagsFromChangeset(changes, targetFlags);
      const unproxiedFlags = {
        ...this.state.unproxiedFlags,
        ...updates,
      };
      if (Object.keys(updates).length > 0) {
        this.setState((prevState) => ({
          ...prevState,
          unproxiedFlags,
          ...getFlagsProxy(ldClient, unproxiedFlags, reactOptions, targetFlags),
        }));
      }
    });
  };

  onFailed = (_ldClient: LDClient, e: Error) => {
    this.setState((prevState) => ({ ...prevState, error: e }));
  };

  onReady = (ldClient: LDClient, reactOptions: LDReactOptions, targetFlags?: LDFlagSet) => {
    const unproxiedFlags = fetchFlags(ldClient, targetFlags);
    this.setState((prevState) => ({
      ...prevState,
      unproxiedFlags,
      ...getFlagsProxy(ldClient, unproxiedFlags, reactOptions, targetFlags),
    }));
  };

  prepareLDClient = async () => {
    const { clientSideID, flags: targetFlags, options } = this.props;
    let ldClient = await this.props.ldClient;
    const reactOptions = this.getReactOptions();
    let unproxiedFlags = this.state.unproxiedFlags;
    let error: Error;

    if (ldClient) {
      unproxiedFlags = fetchFlags(ldClient, targetFlags);
    } else {
      const context = getContextOrUser(this.props) ?? { anonymous: true, kind: 'user' };
      ldClient = initialize(clientSideID, context, { ...wrapperOptions, ...options });

      try {
        await ldClient.waitForInitialization(this.props.timeout);
        unproxiedFlags = fetchFlags(ldClient, targetFlags);
      } catch (e) {
        error = e as Error;

        if (error?.name.toLowerCase().includes('timeout')) {
          ldClient.on('failed', this.onFailed);
          ldClient.on('ready', () => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.onReady(ldClient!, reactOptions, targetFlags);
          });
        }
      }
    }
    this.setState((prevState) => ({
      ...prevState,
      unproxiedFlags,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...getFlagsProxy(ldClient!, unproxiedFlags, reactOptions, targetFlags),
      ldClient,
      error,
    }));
    this.subscribeToChanges(ldClient);
  };

  async componentDidMount() {
    const { deferInitialization } = this.props;
    if (deferInitialization && !getContextOrUser(this.props)) {
      return;
    }

    await this.prepareLDClient();
  }

  async componentDidUpdate(prevProps: ProviderConfig) {
    const { deferInitialization } = this.props;
    const contextJustLoaded = !getContextOrUser(prevProps) && getContextOrUser(this.props);
    if (deferInitialization && contextJustLoaded) {
      await this.prepareLDClient();
    }
  }

  render() {
    const { flags, flagKeyMap, ldClient, error } = this.state;

    const { reactContext } = this.getReactOptions();

    return (
      <reactContext.Provider value={{ flags, flagKeyMap, ldClient, error }}>
        {this.props.children}
      </reactContext.Provider>
    );
  }
}

export default LDProvider;
