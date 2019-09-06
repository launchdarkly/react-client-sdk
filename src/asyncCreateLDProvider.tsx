import React, { useState, useEffect, FunctionComponent } from 'react';
import camelCase from 'lodash.camelcase';
import { LDFlagSet, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { defaultReactOptions, ProviderConfig } from './types';
import { Provider } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys } from './utils';

/**
 * This is an async function which initialises LaunchDarkly's js client and awaits it so
 * all flags and the ldClient are ready before the consumer app is rendered.
 *
 * It accepts a config object which is used to initialise launchdarkly-js-client-sdk.
 * It returns a provider which is a React FunctionComponent which:
 * - saves all flags and the ldClient instance in the context api
 * - subscribes to flag changes and propagate them through the context api
 *
 * @param config - The configuration used to initialize LaunchDarkly's js client
 */
export default async function asyncCreateLDProvider(config: ProviderConfig) {
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
        if (bootstrap && bootstrap !== 'localStorage') {
          const bootstrappedFlags = reactOptions.useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap;
          setLDData({ flags: bootstrappedFlags, ldClient });
        }
      }

      ldClient.on('change', (changes: LDFlagChangeset) => {
        const flattened: LDFlagSet = {};
        for (const key in changes) {
          // tslint:disable-next-line:no-unsafe-any
          const flagKey = reactOptions.useCamelCaseFlagKeys ? camelCase(key) : key;
          flattened[flagKey] = changes[key].current;
        }
        setLDData({ flags: { ...ldData.flags, ...flattened }, ldClient });
      });
    }, []);

    return <Provider value={ldData}>{children}</Provider>;
  };

  return LDProvider;
}
