import * as React from 'react';
import camelCase from 'lodash.camelcase';
import { LDClient, LDFlagSet, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { defaultReactOptions, ProviderConfig, EnhancedComponent } from './types';
import { Provider, LDContext as HocState } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys } from './utils';

/**
 * `withLDProvider` is a function which accepts a config object which is used to
 * initialize `launchdarkly-js-client-sdk`.
 *
 * This HOC does three things:
 * - It initializes the ldClient instance by calling `launchdarkly-js-client-sdk` initialize on `componentDidMount`
 * - It saves all flags and the ldClient instance in the context API
 * - It subscribes to flag changes and propagate them through the context API
 *
 * The difference between `withLDProvider` and `asyncCreateLDProvider` is that `withLDProvider` initializes
 * `launchdarkly-js-client-sdk` at `componentDidMount`. This means your flags and the ldClient are only available after
 * your app has mounted. This can result in a flicker due to flag changes at startup time.
 *
 * `asyncCreateLDProvider` initializes `launchdarkly-js-client-sdk` at the entry point of your app prior to render.
 * This means that your flags and the ldClient are ready at the beginning of your app. This ensures your app does not
 * flicker due to flag changes at startup time.
 *
 * @param config - The configuration used to initialize LaunchDarkly's JS SDK
 * @return A function which accepts your root React component and returns a HOC
 */
export function withLDProvider(config: ProviderConfig) {
  return function withLDPoviderHoc<P>(WrappedComponent: React.ComponentType<P>) {
    const { options, reactOptions: userReactOptions } = config;
    const reactOptions = { ...defaultReactOptions, ...userReactOptions };

    return class extends React.Component<P, HocState> implements EnhancedComponent {
      readonly state: Readonly<HocState>;

      constructor(props: P) {
        super(props);

        this.state = {
          flags: {},
          ldClient: undefined,
        };

        if (options) {
          const { bootstrap } = options;
          if (bootstrap && bootstrap !== 'localStorage') {
            const flags = reactOptions.useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap;
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
          for (const key in changes) {
            // tslint:disable-next-line:no-unsafe-any
            const flagKey = reactOptions.useCamelCaseFlagKeys ? camelCase(key) : key;
            flattened[flagKey] = changes[key].current;
          }
          this.setState(({ flags }) => ({ flags: { ...flags, ...flattened } }));
        });
      };

      async componentDidMount() {
        const { clientSideID, user, flags } = config;
        const { flags: fetchedFlags, ldClient } = await initLDClient(clientSideID, user, reactOptions, options, flags);
        this.setState({ flags: fetchedFlags, ldClient });
        this.subscribeToChanges(ldClient);
      }

      render() {
        return (
          <Provider value={this.state}>
            <WrappedComponent {...this.props} />
          </Provider>
        );
      }
    };
  };
}

export default withLDProvider;
