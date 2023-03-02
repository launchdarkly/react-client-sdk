import { LDFlagSet, LDClient } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';
import { defaultReactOptions, LDFlagKeyMap, LDReactOptions } from './types';

export default function getFlagsProxy(
  ldClient: LDClient,
  rawFlags: LDFlagSet,
  reactOptions: LDReactOptions = defaultReactOptions,
  targetFlags?: LDFlagSet,
): { flags: LDFlagSet; flagKeyMap: LDFlagKeyMap } {
  const filteredFlags = filterFlags(rawFlags, targetFlags);
  const { useCamelCaseFlagKeys = true } = reactOptions;
  const [flags, flagKeyMap = {}] = useCamelCaseFlagKeys ? getCamelizedKeysAndFlagMap(filteredFlags) : [filteredFlags];

  return {
    flags: reactOptions.sendEventsOnFlagRead ? toFlagsProxy(ldClient, flags, flagKeyMap, useCamelCaseFlagKeys) : flags,
    flagKeyMap,
  };
}

function filterFlags(flags: LDFlagSet, targetFlags?: LDFlagSet): LDFlagSet {
  if (targetFlags === undefined) {
    return flags;
  }

  return Object.keys(targetFlags).reduce<LDFlagSet>((acc, key) => {
    if (hasFlag(flags, key)) {
      acc[key] = flags[key];
    }

    return acc;
  }, {});
}

function getCamelizedKeysAndFlagMap(rawFlags: LDFlagSet) {
  const flags: LDFlagSet = {};
  const flagKeyMap: LDFlagKeyMap = {};
  for (const rawFlag in rawFlags) {
    // Exclude system keys
    if (rawFlag.indexOf('$') === 0) {
      continue;
    }
    const camelKey = camelCase(rawFlag);
    flags[camelKey] = rawFlags[rawFlag];
    flagKeyMap[camelKey] = rawFlag;
  }

  return [flags, flagKeyMap];
}

function hasFlag(flags: LDFlagSet, flagKey: string) {
  return Object.prototype.hasOwnProperty.call(flags, flagKey);
}

function toFlagsProxy(
  ldClient: LDClient,
  flags: LDFlagSet,
  flagKeyMap: LDFlagKeyMap,
  useCamelCaseFlagKeys: boolean,
): LDFlagSet {
  return new Proxy(flags, {
    // trap for reading a flag value using `LDClient#variation` to trigger an evaluation event
    get(target, prop, receiver) {
      const currentValue = Reflect.get(target, prop, receiver);

      // check if flag key exists as camelCase or original case
      const validFlagKey =
        (useCamelCaseFlagKeys && hasFlag(flagKeyMap, prop as string)) || hasFlag(target, prop as string);

      // only process flag keys and ignore symbols and native Object functions
      if (typeof prop === 'symbol' || !validFlagKey) {
        return currentValue;
      }

      if (currentValue === undefined) {
        return;
      }

      const pristineFlagKey = useCamelCaseFlagKeys ? flagKeyMap[prop] : prop;

      return ldClient.variation(pristineFlagKey, currentValue);
    },
  });
}
