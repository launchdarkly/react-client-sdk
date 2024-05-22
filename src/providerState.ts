import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';
import { LDFlagKeyMap } from './types';

interface ProviderState {
  error?: Error;
  flagKeyMap: LDFlagKeyMap;
  flags: LDFlagSet;
  ldClient?: LDClient;
  unproxiedFlags: LDFlagSet;
}

export default ProviderState;
