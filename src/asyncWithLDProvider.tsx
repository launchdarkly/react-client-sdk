import React, { useState, useEffect, FunctionComponent } from 'react';
import { LDFlagSet, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { AsyncProviderConfig, defaultReactOptions } from './types';
import { Provider } from './context';
import initLDClient from './initLDClient';
import { camelCaseKeys, fetchFlags, getFlattenedFlagsFromChangeset } from './utils';

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
 *
 * `asyncWithLDProvider` does not support the `deferInitialization` config option because `asyncWithLDProvider` needs
 * to be initialized at the entry point prior to render to ensure your flags and the ldClient are ready at the beginning
 * of your app.
 *
 * It returns a provider which is a React FunctionComponent which:
 * - saves all flags and the ldClient instance in the context API
 * - subscribes to flag changes and propagate them through the context API
 *
 * @param config - The configuration used to initialize LaunchDarkly's JS SDK
 */
export default async function asyncWithLDProvider(config: AsyncProviderConfig) {
  const { clientSideID, user, flags: targetFlags, options, reactOptions: userReactOptions } = config;
  const reactOptions = { ...defaultReactOptions, ...userReactOptions };
  const { ldClient } = await initLDClient(clientSideID, user, reactOptions, options, targetFlags);

  const LDProvider: FunctionComponent = ({ children }) => {
    const [ldData, setLDData] = useState({
      flags: fetchFlags(ldClient, reactOptions, targetFlags),
      ldClient,
    });

    useEffect(() => {
      if (options) {
        const { bootstrap } = options;
        if (bootstrap && bootstrap !== 'localStorage') {
          const bootstrappedFlags = reactOptions.useCamelCaseFlagKeys ? camelCaseKeys(bootstrap) : bootstrap;
          setLDData(prev => ({ ...prev, flags: bootstrappedFlags }));
        }
      }

      ldClient.on('change', (changes: LDFlagChangeset) => {
        const flattened: LDFlagSet = getFlattenedFlagsFromChangeset(changes, targetFlags, reactOptions);
        if (Object.keys(flattened).length > 0) {
          setLDData(prev => ({ ...prev, flags: { ...prev.flags, ...flattened } }));
        }
      });
    }, []);

    return <Provider value={ldData}>{children}</Provider>;
  };

  return LDProvider;
}
