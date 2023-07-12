import { LDClient, LDContext, LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';
import { ProviderConfig } from './types';

/**
 * Helper function to get the context or fallback to classic user.
 * Safe to remove when the user property is deprecated.
 */
export const getContextOrUser = (config: ProviderConfig): LDContext | undefined => config.context ?? config.user;

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
 * @return an `LDFlagSet` with the current flag values from the LDFlagChangeset filtered by `targetFlags`. The returned
 * object may be empty `{}` if none of the targetFlags were changed.
 */
export const getFlattenedFlagsFromChangeset = (
  changes: LDFlagChangeset,
  targetFlags: LDFlagSet | undefined,
): LDFlagSet => {
  const flattened: LDFlagSet = {};
  for (const key in changes) {
    if (!targetFlags || targetFlags[key] !== undefined) {
      flattened[key] = changes[key].current;
    }
  }

  return flattened;
};

/**
 * Retrieves flag values.
 *
 * @param ldClient LaunchDarkly client
 * @param targetFlags If specified, `launchdarkly-react-client-sdk` will only listen for changes to these flags.
 * Flag keys must be in their original form as known to LaunchDarkly rather than in their camel-cased form.
 *
 * @returns an `LDFlagSet` with the current flag values from LaunchDarkly filtered by `targetFlags`.
 */
export const fetchFlags = (ldClient: LDClient, targetFlags?: LDFlagSet) => {
  const allFlags = ldClient.allFlags();
  if (!targetFlags) {
    return allFlags;
  }

  return Object.keys(targetFlags).reduce<LDFlagSet>((acc, key) => {
    acc[key] = Object.prototype.hasOwnProperty.call(allFlags, key) ? allFlags[key] : targetFlags[key];

    return acc;
  }, {});
};

/**
 * @deprecated The `camelCaseKeys.camelCaseKeys` property will be removed in a future version,
 * please update your code to use the `camelCaseKeys` function directly.
 */
// tslint:disable-next-line deprecation
camelCaseKeys.camelCaseKeys = camelCaseKeys;

export default { camelCaseKeys, getFlattenedFlagsFromChangeset, fetchFlags };
