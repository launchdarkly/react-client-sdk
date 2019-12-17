import { initialize as ldClientInitialize, LDClient, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import { AllFlagsLDClient, defaultReactOptions, LDReactOptions } from './types';
import { camelCaseKeys } from './utils';

/**
 * Internal function to initialize the `LDClient`.
 *
 * @param clientSideID Your project and environment specific client side ID
 * @param user A LaunchDarkly user object
 * @param options LaunchDarkly initialization options
 * @param targetFlags If specified, `launchdarkly-react-client-sdk` will only request and listen to these flags.
 *
 * @see `ProviderConfig` for more details about the parameters
 * @return An initialized client and flags
 */
const initLDClient = async (
  clientSideID: string,
  user: LDUser = { anonymous: true },
  reactOptions: LDReactOptions = defaultReactOptions,
  options?: LDOptions,
  targetFlags?: LDFlagSet,
): Promise<AllFlagsLDClient> => {
  const allOptions = { wrapperName: 'React', ...options };
  const ldClient = ldClientInitialize(clientSideID, user, allOptions);

  return new Promise<AllFlagsLDClient>(resolve => {
    ldClient.on('ready', () => {
      let rawFlags: LDFlagSet = {};

      if (targetFlags) {
        for (const flag in targetFlags) {
          rawFlags[flag] = ldClient.variation(flag, targetFlags[flag]);
        }
      } else {
        rawFlags = ldClient.allFlags();
      }

      const flags = reactOptions.useCamelCaseFlagKeys ? camelCaseKeys(rawFlags) : rawFlags;
      resolve({ flags, ldClient });
    });
  });
};

export default initLDClient;
