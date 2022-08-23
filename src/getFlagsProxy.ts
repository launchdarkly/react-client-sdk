import { LDFlagSet, LDClient } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';
import { defaultReactOptions, LDFlagKeyMap, LDReactOptions } from './types';

export default function getFlagsProxy(
  ldClient: LDClient,
  rawFlags: LDFlagSet,
  reactOptions: LDReactOptions = defaultReactOptions,
): { flags: LDFlagSet; _flags: LDFlagSet; flagKeyMap: LDFlagKeyMap } {
  const flags: LDFlagSet = {};
  const flagKeyMap: LDFlagKeyMap = {};
  if (!reactOptions.useCamelCaseFlagKeys) {
    Object.assign(flags, rawFlags);
  } else {
    for (const rawFlag in rawFlags) {
      // Exclude system keys
      if (rawFlag.indexOf('$') === 0) {
        continue;
      }
      const camelKey = camelCase(rawFlag);
      flags[camelKey] = rawFlags[rawFlag];
      flagKeyMap[camelKey] = rawFlag;
    }
  }

  return {
    flags: toFlagsProxy(ldClient, flags, flagKeyMap),
    _flags: flags,
    flagKeyMap,
  };
}

function hasFlag(flags: LDFlagSet, flagKey: string) {
  return Object.prototype.hasOwnProperty.call(flags, flagKey);
}

function toFlagsProxy(ldClient: LDClient, flags: LDFlagSet, flagKeyMap: LDFlagKeyMap): LDFlagSet {
  return new Proxy(flags, {
    // trap for reading a flag value that refreshes its value with `LDClient#variation` to trigger an evaluation event
    get(target, prop) {
      const flagKey = prop.toString();
      const currentValue = Reflect.get(target, flagKey);
      if (currentValue === undefined) {
        return;
      }
      const originalFlagKey = hasFlag(flagKeyMap, flagKey) ? flagKeyMap[flagKey] : flagKey;
      const nextValue = ldClient.variation(originalFlagKey, currentValue);
      Reflect.set(target, flagKey, nextValue);

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
