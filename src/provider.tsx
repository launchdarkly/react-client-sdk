import * as React from 'react';
import { LDClient, LDFlagSet, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { EnhancedComponent, ProviderConfig, defaultReactOptions } from './types';
import { Provider, LDContext as HocState } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys, fetchFlags, getFlattenedFlagsFromChangeset } from './utils';

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
class LDProvider extends React.Component<ProviderConfig, HocState> implements EnhancedComponent {
  readonly state: Readonly<HocState>;

  constructor(props: ProviderConfig) {
    super(props);

    const { options } = props;

    this.state = {
      flags: {},
      ldClient: undefined,
    };

    if (options) {
      const { bootstrap } = options;
      if (bootstrap && bootstrap !== 'localStorage') {
        const { useCamelCaseFlagKeys } = this.getReactOptions();
        const flags = useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap;
        this.state = {
          flags,
          ldClient: undefined,
        };
      }
    }
  }

  getReactOptions = () => ({ ...defaultReactOptions, ...this.props.reactOptions });

  subscribeToChanges = (ldClient: LDClient) => {
    const { flags: targetFlags } = this.props;
    ldClient.on('change', (changes: LDFlagChangeset) => {
      const flattened: LDFlagSet = getFlattenedFlagsFromChangeset(changes, targetFlags, this.getReactOptions());
      if (Object.keys(flattened).length > 0) {
        this.setState(({ flags }) => ({ flags: { ...flags, ...flattened } }));
      }
    });
  };

  initLDClient = async () => {
    const { clientSideID, flags, options, user } = this.props;
    let ldClient = await this.props.ldClient;
    const reactOptions = this.getReactOptions();
    let fetchedFlags;
    if (ldClient) {
      fetchedFlags = fetchFlags(ldClient, reactOptions, flags);
    } else {
      const initialisedOutput = await initLDClient(clientSideID, user, reactOptions, options, flags);
      fetchedFlags = initialisedOutput.flags;
      ldClient = initialisedOutput.ldClient;
    }
    this.setState({ flags: fetchedFlags, ldClient });
    this.subscribeToChanges(ldClient);
  };

  async componentDidMount() {
    const { user, deferInitialization } = this.props;
    if (deferInitialization && !user) {
      return;
    }

    await this.initLDClient();
  }

  async componentDidUpdate(prevProps: ProviderConfig) {
    const { user, deferInitialization } = this.props;
    const userJustLoaded = !prevProps.user && user;
    if (deferInitialization && userJustLoaded) {
      await this.initLDClient();
    }
  }

  render() {
    return <Provider value={this.state}>{this.props.children}</Provider>;
  }
}

export default LDProvider;
