import React, { useState, useEffect, FunctionComponent } from 'react';
import camelCase from 'lodash.camelcase';
import isEmpty from 'lodash.isempty';
import { LDFlagSet, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { defaultReactOptions, ProviderConfig } from './types';
import { Provider } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys } from './utils';

/**
 * This is an async function which initializes LaunchDarkly's JS SDK (`launchdarkly-js-client-sdk`)
 * and awaits it so all flags and the ldClient are ready before the consumer app is rendered.
 *
 * The difference between `withLDProvider` and `asyncWithLDProvider` is that `withLDProvider` initializes
 * `launchdarkly-js-client-sdk` at componentDidMount. This means your flags and the ldClient are only available after
 * your app has mounted. This can result in a flicker due to flag changes at startup time.
 *
 * `asyncWithLDProvider` initializes `launchdarkly-js-client-sdk` at the entry point of your app prior to render.
 * This means that your flags and the ldClient are ready at the beginning of your app. This ensures your app does not
 * flicker due to flag changes at startup time.
 *
 * `asyncWithLDProvider` accepts a config object which is used to initialize `launchdarkly-js-client-sdk`.
 * It returns a provider which is a React FunctionComponent which:
 * - saves all flags and the ldClient instance in the context API
 * - subscribes to flag changes and propagate them through the context API
 *
 * @param config - The configuration used to initialize LaunchDarkly's JS SDK
 */
export default async function asyncWithLDProvider(config: ProviderConfig) {
  const { clientSideID, user, flags, options, reactOptions: userReactOptions } = config;
  const reactOptions = { ...defaultReactOptions, ...userReactOptions };
  const { flags: fetchedFlags, ldClient } = await initLDClient(clientSideID, user, reactOptions, options, flags);

  const LDProvider: FunctionComponent = ({ children }) => {
    const [ldData, setLDData] = useState({
      flags: fetchedFlags,
      ldClient,
    });

    useEffect(() => {
      if (options) {
        const { bootstrap } = options;
        if (!isEmpty(bootstrap) && bootstrap !== 'localStorage') {
          const bootstrappedFlags = reactOptions.useCamelCaseFlagKeys ? camelCaseKeys(bootstrap!) : bootstrap;
          setLDData(prev => ({ ...prev, flags: bootstrappedFlags! }));
        }
      }

      ldClient.on('change', (changes: LDFlagChangeset) => {
        const flattened: LDFlagSet = {};
        for (const key in changes) {
          // tslint:disable-next-line:no-unsafe-any
          const flagKey = reactOptions.useCamelCaseFlagKeys ? camelCase(key) : key;
          flattened[flagKey] = changes[key].current;
        }

        setLDData(prev => ({ ...prev, flags: { ...prev.flags, ...flattened } }));
      });
    }, []);

    return <Provider value={ldData}>{children}</Provider>;
  };

  return LDProvider;
}
