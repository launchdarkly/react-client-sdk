import * as React from 'react';
import camelCase from 'lodash.camelcase';
import { LDClient, LDFlagSet, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { EnhancedComponent, ProviderConfig, defaultReactOptions } from './types';
import { Provider, LDContext as HocState } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys } from './utils';

class LDProvider extends React.Component<ProviderConfig, HocState> implements EnhancedComponent {
  readonly state: Readonly<HocState>;

  constructor(props: ProviderConfig) {
    super(props);

    const { options, reactOptions } = props;

    this.state = {
      flags: {},
      ldClient: undefined,
    };

    if (options) {
      const { bootstrap } = options;
      if (bootstrap && bootstrap !== 'localStorage') {
        const { useCamelCaseFlagKeys = defaultReactOptions.useCamelCaseFlagKeys } = reactOptions || {};
        const flags = useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap;
        this.state = {
          flags,
          ldClient: undefined,
        };
      }
    }
  }

  subscribeToChanges = (ldClient: LDClient) => {
    ldClient.on('change', (changes: LDFlagChangeset) => {
      const flattened: LDFlagSet = {};
      const { reactOptions } = this.props;
      for (const key in changes) {
        // tslint:disable-next-line:no-unsafe-any
        const { useCamelCaseFlagKeys = defaultReactOptions.useCamelCaseFlagKeys } = reactOptions || {};
        const flagKey = useCamelCaseFlagKeys ? camelCase(key) : key;
        flattened[flagKey] = changes[key].current;
      }
      this.setState(({ flags }) => ({ flags: { ...flags, ...flattened } }));
    });
  };

  async componentDidMount() {
    const { clientSideID, user, flags, reactOptions: userReactOptions, options } = this.props;
    const reactOptions = { ...defaultReactOptions, ...userReactOptions };
    const { flags: fetchedFlags, ldClient } = await initLDClient(clientSideID, user, reactOptions, options, flags);
    this.setState({ flags: fetchedFlags, ldClient });
    this.subscribeToChanges(ldClient);
  }

  render() {
    return <Provider value={this.state}>{this.props.children}</Provider>;
  }
}

export default LDProvider;
