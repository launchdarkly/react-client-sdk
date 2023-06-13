import { initialize as ldClientInitialize, LDContext, LDFlagSet, LDOptions } from 'launchdarkly-js-client-sdk';
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
 * @param context A LaunchDarkly context object
 * @param options LaunchDarkly initialization options
 * @param targetFlags If specified, `launchdarkly-react-client-sdk` will only listen for changes to these flags.
 * Flag keys must be in their original form as known to LaunchDarkly rather than in their camel-cased form.
 *
 * @see `ProviderConfig` for more details about the parameters
 * @return An initialized client and flags
 */
const initLDClient = async (
  clientSideID: string,
  context: LDContext = { anonymous: true, kind: 'user' },
  options?: LDOptions,
  targetFlags?: LDFlagSet,
): Promise<AllFlagsLDClient> => {
  const ldClient = ldClientInitialize(clientSideID, context, { ...wrapperOptions, ...options });

  return new Promise<AllFlagsLDClient>((resolve) => {
    function cleanup() {
      ldClient.off('ready', handleReady);
      ldClient.off('failed', handleFailure);
    }
    function handleFailure(error: Error) {
      cleanup();
      resolve({ flags: {}, ldClient, error });
    }
    function handleReady() {
      cleanup();
      const flags = fetchFlags(ldClient, targetFlags);
      resolve({ flags, ldClient });
    }
    ldClient.on('failed', handleFailure);
    ldClient.on('ready', handleReady);
  });
};

export default initLDClient;
