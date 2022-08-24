import { initialize as ldClientInitialize, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import { AllFlagsLDClient } from './types';
import { fetchFlags } from './utils';
import * as packageInfo from '../package.json';

const wrapperOptions: LDOptions = {
  wrapperName: 'react-client-sdk',
  wrapperVersion: packageInfo.version,
  sendEventsOnlyForVariation: true,
};

/**
 * Internal function to initialize the `LDClient`.
 *
 * @param clientSideID Your project and environment specific client side ID
 * @param user A LaunchDarkly user object
 * @param options LaunchDarkly initialization options
 * @param targetFlags If specified, `launchdarkly-react-client-sdk` will only request and listen to these flags.
 * Flag keys must be in their original form as known to LaunchDarkly rather than in their camel-cased form.
 *
 * @see `ProviderConfig` for more details about the parameters
 * @return An initialized client and flags
 */
const initLDClient = async (
  clientSideID: string,
  user: LDUser = { anonymous: true },
  options?: LDOptions,
  targetFlags?: LDFlagSet,
): Promise<AllFlagsLDClient> => {
  const ldClient = ldClientInitialize(clientSideID, user, { ...wrapperOptions, ...options });

  return new Promise<AllFlagsLDClient>((resolve) => {
    ldClient.on('ready', () => {
      const flags = fetchFlags(ldClient, targetFlags);
      resolve({ flags, ldClient });
    });
  });
};

export default initLDClient;
