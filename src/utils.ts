import { LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';
import { LDReactOptions } from './types';

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

/**
 * Gets the flags to pass to the provider from the changeset.
 *
 * @param changes the `LDFlagChangeset` from the ldClient onchange handler.
 * @param targetFlags if targetFlags are specified, changes to other flags are ignored and not returned in the
 * flattened `LDFlagSet`
 * @param reactOptions reactOptions.useCamelCaseFlagKeys determines whether to change the flag keys to camelCase
 * @return an `LDFlagSet` with the current flag values from the LDFlagChangeset filtered by `targetFlags`. The returned
 * object may be empty `{}` if none of the targetFlags were changed.
 */
export const getFlattenedFlagsFromChangeset = (
  changes: LDFlagChangeset,
  targetFlags: LDFlagSet | undefined,
  reactOptions: LDReactOptions,
): LDFlagSet => {
  const flattened: LDFlagSet = {};
  for (const key in changes) {
    if (!targetFlags || targetFlags[key] !== undefined) {
      // tslint:disable-next-line:no-unsafe-any
      const flagKey = reactOptions.useCamelCaseFlagKeys ? camelCase(key) : key;
      flattened[flagKey] = changes[key].current;
    }
  }

  return flattened;
};

// TODO: Remove this for the next major version. This was added to maintain backwards compatibility.
camelCaseKeys.camelCaseKeys = camelCaseKeys;

export default { camelCaseKeys, getFlattenedFlagsFromChangeset };
