import { LDFlagSet, LDClient } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';
import { defaultReactOptions, LDFlagKeyMap, LDReactOptions } from './types';

export default function getFlagsProxy(
  ldClient: LDClient,
  rawFlags: LDFlagSet,
  reactOptions: LDReactOptions = defaultReactOptions,
  targetFlags?: LDFlagSet,
): { flags: LDFlagSet; _flags: LDFlagSet; flagKeyMap: LDFlagKeyMap } {
  const filteredFlags = filterFlags(rawFlags, targetFlags);
  const flags: LDFlagSet = {};
  const flagKeyMap: LDFlagKeyMap = {};
  if (!reactOptions.useCamelCaseFlagKeys) {
    Object.assign(flags, filteredFlags);
  } else {
    for (const rawFlag in filteredFlags) {
      // Exclude system keys
      if (rawFlag.indexOf('$') === 0) {
        continue;
      }
      const camelKey = camelCase(rawFlag);
      flags[camelKey] = filteredFlags[rawFlag];
      flagKeyMap[camelKey] = rawFlag;
    }
  }

  return {
    flags: toFlagsProxy(ldClient, flags, flagKeyMap),
    _flags: filteredFlags,
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

function hasFlag(flags: LDFlagSet, flagKey: string) {
  return Object.prototype.hasOwnProperty.call(flags, flagKey);
}

function toFlagsProxy(ldClient: LDClient, flags: LDFlagSet, flagKeyMap: LDFlagKeyMap): LDFlagSet {
  return new Proxy(flags, {
    // trap for reading a flag value that refreshes its value with `LDClient#variation` to trigger an evaluation event
    get(target, flagKey: string, reciever) {
      const currentValue = Reflect.get(target, flagKey, reciever);
      if (currentValue === undefined) {
        return;
      }
      const originalFlagKey = hasFlag(flagKeyMap, flagKey) ? flagKeyMap[flagKey] : flagKey;
      const nextValue = ldClient.variation(originalFlagKey, currentValue);
      Reflect.set(target, flagKey, nextValue, reciever);

      return nextValue;
    },
    // disable all mutation functions to make proxy readonly
    setPrototypeOf: () => false,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
    preventExtensions: () => false,
  });
}
