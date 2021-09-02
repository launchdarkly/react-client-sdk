import { initialize as ldClientInitialize, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import { AllFlagsLDClient, defaultReactOptions, LDReactOptions } from './types';
import { fetchFlags } from './utils';
import { version } from '../package.json';

/**
 * Internal function to initialize the `LDClient`.
 *
 * @param clientSideID Your project and environment specific client side ID
 * @param user A LaunchDarkly user object
 * @param reactOptions Initialization options for the LaunchDarkly React SDK
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
  const allOptions = { wrapperName: 'react-client-sdk', wrapperVersion: version, ...options };
  const ldClient = ldClientInitialize(clientSideID, user, allOptions);

  return new Promise<AllFlagsLDClient>(resolve => {
    ldClient.on('ready', () => {
      const flags = fetchFlags(ldClient, reactOptions, targetFlags);
      resolve({ flags, ldClient });
    });
  });
};

export default initLDClient;
