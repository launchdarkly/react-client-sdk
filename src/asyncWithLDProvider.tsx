import React, { useState, useEffect, ReactNode } from 'react';
import { LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { AsyncProviderConfig, defaultReactOptions } from './types';
import { Provider } from './context';
import initLDClient from './initLDClient';
import { getContextOrUser, getFlattenedFlagsFromChangeset } from './utils';
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
  const { clientSideID, flags: targetFlags, options, reactOptions: userReactOptions } = config;
  const reactOptions = { ...defaultReactOptions, ...userReactOptions };
  const { ldClient, flags: fetchedFlags, error } = await initLDClient(
    clientSideID,
    getContextOrUser(config),
    options,
    targetFlags,
  );

  const initialFlags = options?.bootstrap && options.bootstrap !== 'localStorage' ? options.bootstrap : fetchedFlags;

  const LDProvider = ({ children }: { children: ReactNode }) => {
    const [ldData, setLDData] = useState(() => ({
      unproxiedFlags: initialFlags,
      ...getFlagsProxy(ldClient, initialFlags, reactOptions, targetFlags),
    }));

    useEffect(() => {
      function onChange(changes: LDFlagChangeset) {
        const updates = getFlattenedFlagsFromChangeset(changes, targetFlags);
        if (Object.keys(updates).length > 0) {
          setLDData(({ unproxiedFlags }) => {
            const updatedUnproxiedFlags = { ...unproxiedFlags, ...updates };

            return {
              unproxiedFlags: updatedUnproxiedFlags,
              ...getFlagsProxy(ldClient, updatedUnproxiedFlags, reactOptions, targetFlags),
            };
          });
        }
      }
      ldClient.on('change', onChange);

      return function cleanup() {
        ldClient.off('change', onChange);
      };
    }, []);

    const { flags, flagKeyMap } = ldData;

    return <Provider value={{ flags, flagKeyMap, ldClient, error }}>{children}</Provider>;
  };

  return LDProvider;
}
