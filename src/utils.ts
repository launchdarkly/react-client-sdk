import { LDFlagSet } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';

/**
 * Transforms a set of flags so that their keys are camelCased. This function ignores
 * flag keys which start with `$`.
 *
 * @param rawFlags A mapping of flag keys and their values
 * @return A transformed `LDFlagSet` with camelCased flag keys
 */
export const camelCaseKeys = (rawFlags: LDFlagSet) => {
  const flags: LDFlagSet = {};
  for (const rawFlag in rawFlags) {
    // Exclude system keys
    if (rawFlag.indexOf('$') !== 0) {
      flags[camelCase(rawFlag)] = rawFlags[rawFlag]; // tslint:disable-line:no-unsafe-any
    }
  }

  return flags;
};

export default { camelCaseKeys };
