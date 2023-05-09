import React, { Component, PropsWithChildren } from 'react';
import { LDClient, LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';
import { EnhancedComponent, ProviderConfig, defaultReactOptions } from './types';
import { Provider, ReactSdkContext } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys, fetchFlags, getContextOrUser, getFlattenedFlagsFromChangeset } from './utils';
import getFlagsProxy from './getFlagsProxy';

interface LDHocState extends ReactSdkContext {
  unproxiedFlags: LDFlagSet;
}

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
class LDProvider extends Component<PropsWithChildren<ProviderConfig>, LDHocState> implements EnhancedComponent {
  readonly state: Readonly<LDHocState>;

  constructor(props: ProviderConfig) {
    super(props);

    const { options } = props;

    this.state = {
      flags: {},
      unproxiedFlags: {},
      flagKeyMap: {},
      ldClient: undefined,
    };

    if (options) {
      const { bootstrap } = options;
      if (bootstrap && bootstrap !== 'localStorage') {
        const { useCamelCaseFlagKeys } = this.getReactOptions();
        this.state = {
          flags: useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap,
          unproxiedFlags: bootstrap,
          flagKeyMap: {},
          ldClient: undefined,
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
        this.setState({ unproxiedFlags, ...getFlagsProxy(ldClient, unproxiedFlags, reactOptions, targetFlags) });
      }
    });
  };

  initLDClient = async () => {
    const { clientSideID, flags, options } = this.props;
    let ldClient = await this.props.ldClient;
    const reactOptions = this.getReactOptions();
    let unproxiedFlags = this.state.unproxiedFlags;
    let error: Error | undefined;
    if (ldClient) {
      unproxiedFlags = fetchFlags(ldClient, flags);
    } else {
      const initialisedOutput = await initLDClient(clientSideID, getContextOrUser(this.props), options, flags);
      error = initialisedOutput.error;
      if (!error) {
        unproxiedFlags = initialisedOutput.flags;
      }
      ldClient = initialisedOutput.ldClient;
    }
    this.setState({ unproxiedFlags, ...getFlagsProxy(ldClient, unproxiedFlags, reactOptions, flags), ldClient, error });
    this.subscribeToChanges(ldClient);
  };

  async componentDidMount() {
    const { deferInitialization } = this.props;
    if (deferInitialization && !getContextOrUser(this.props)) {
      return;
    }

    await this.initLDClient();
  }

  async componentDidUpdate(prevProps: ProviderConfig) {
    const { deferInitialization } = this.props;
    const contextJustLoaded = !getContextOrUser(prevProps) && getContextOrUser(this.props);
    if (deferInitialization && contextJustLoaded) {
      await this.initLDClient();
    }
  }

  render() {
    const { flags, flagKeyMap, ldClient, error } = this.state;

    return <Provider value={{ flags, flagKeyMap, ldClient, error }}>{this.props.children}</Provider>;
  }
}

export default LDProvider;
