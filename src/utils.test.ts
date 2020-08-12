import {camelCaseKeys, getFlattenedFlagsFromChangeset} from './utils';
import {LDFlagChangeset, LDFlagSet} from 'launchdarkly-js-client-sdk';
import {LDReactOptions} from './types';

describe('Utils', () => {
  test('camelCaseKeys should ignore system keys', () => {
    const bootstrap = {
      'test-flag': true,
      'another-test-flag': false,
      $flagsState: {
        'test-flag': { version: 125, variation: 0, trackEvents: true },
        'another-test-flag': { version: 18, variation: 1 },
      },
      $valid: true,
    };

    const result = camelCaseKeys(bootstrap);
    expect(result).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('getFlattenedFlagsFromChangeset should return current values of all flags when no targetFlags specified', () => {
    const targetFlags: LDFlagSet | undefined = undefined;
    const flagChanges: LDFlagChangeset = {
      'test-flag': {current: true, previous: false},
      'another-test-flag': {current: false, previous: true}
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: true,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toEqual({anotherTestFlag: false, testFlag: true});
  })

  test('getFlattenedFlagsFromChangeset should return current values only of targetFlags when targetFlags specified', () => {
    const targetFlags: LDFlagSet | undefined = {'test-flag': false};
    const flagChanges: LDFlagChangeset = {
      'test-flag': {current: true, previous: false},
      'another-test-flag': {current: false, previous: true}
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: true,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toEqual({testFlag: true});
  })

  test('getFlattenedFlagsFromChangeset should return null when no targetFlags are changed ', () => {
    const targetFlags: LDFlagSet | undefined = {'test-flag': false};
    const flagChanges: LDFlagChangeset = {
      'another-test-flag': {current: false, previous: true}
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: true,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toBeNull;
  })

  test('getFlattenedFlagsFromChangeset should not change flags to camelCase when reactOptions.useCamelCaseFlagKeys is false ', () => {
    const targetFlags: LDFlagSet | undefined = undefined;
    const flagChanges: LDFlagChangeset = {
      'test-flag': {current: true, previous: false},
      'another-test-flag': {current: false, previous: true}
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: false,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toEqual({'another-test-flag': false, 'test-flag': true});
  })
});
