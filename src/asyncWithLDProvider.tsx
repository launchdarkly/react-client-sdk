import React, { useState, useEffect, ReactNode } from 'react';
import { LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { AsyncProviderConfig, defaultReactOptions } from './types';
import { Provider } from './context';
import initLDClient from './initLDClient';
import { getFlattenedFlagsFromChangeset } from './utils';
import getFlagsProxy from './getFlagsProxy';

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
  const { ldClient, flags: fetchedFlags } = await initLDClient(clientSideID, user, options, targetFlags);

  const LDProvider = ({ children }: { children: ReactNode }) => {
    const [ldData, setLDData] = useState({
      flags: {},
      _flags: {},
      flagKeyMap: {},
    });

    useEffect(() => {
      if (options?.bootstrap && options.bootstrap !== 'localStorage') {
        setLDData(getFlagsProxy(ldClient, options.bootstrap, reactOptions, targetFlags));
      } else {
        setLDData(getFlagsProxy(ldClient, fetchedFlags, reactOptions, targetFlags));
      }

      function onChange(changes: LDFlagChangeset) {
        const updates = getFlattenedFlagsFromChangeset(changes, targetFlags);
        if (Object.keys(updates).length > 0) {
          setLDData(({ _flags }) => getFlagsProxy(ldClient, { ..._flags, ...updates }, reactOptions, targetFlags));
        }
      }
      ldClient.on('change', onChange);

      return function cleanup() {
        ldClient.off('change', onChange);
      };
    }, []);

    return <Provider value={{ ...ldData, ldClient }}>{children}</Provider>;
  };

  return LDProvider;
}
