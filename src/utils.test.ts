import { camelCaseKeys, fetchFlags, getFlattenedFlagsFromChangeset } from './utils';
import { LDClient, LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';
import { defaultReactOptions, LDReactOptions } from './types';

const caseTestCases = [
  ['camelCase', 'camelCase'],
  ['PascalCase', 'pascalCase'],
  ['kebab-case', 'kebabCase'],
  ['SCREAMING-KEBAB-CASE', 'screamingKebabCase'],
  ['snake_case', 'snakeCase'],
  ['SCREAMING_SNAKE_CASE', 'screamingSnakeCase'],
  ['camel_Snake_Case', 'camelSnakeCase'],
  ['Pascal_Snake_Case', 'pascalSnakeCase'],
  ['Train-Case', 'trainCase'],
  // we can possibly drop support for these as they are unlikely used in practice
  ['snake_kebab-case', 'snakeKebabCase'],
  ['dragon.case', 'dragonCase'],
  ['SCREAMING.DRAGON.CASE', 'screamingDragonCase'],
  ['PascalDragon.Snake_Kebab-Case', 'pascalDragonSnakeKebabCase'],
  ['SCREAMING.DRAGON_SNAKE_KEBAB-CASE', 'screamingDragonSnakeKebabCase'],
];

describe('Utils', () => {
  describe('camelCaseKeys', () => {
    test('should ignore system keys', () => {
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

    test.each(caseTestCases)('should handle %s', (key, camelKey) => {
      expect(camelCaseKeys({ [key]: false })).toEqual({ [camelKey]: false });
    });
  });

  test('getFlattenedFlagsFromChangeset should return current values of all flags when no targetFlags specified', () => {
    const targetFlags: LDFlagSet | undefined = undefined;
    const flagChanges: LDFlagChangeset = {
      'test-flag': { current: true, previous: false },
      'another-test-flag': { current: false, previous: true },
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: true,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toEqual({ anotherTestFlag: false, testFlag: true });
  });

  test('getFlattenedFlagsFromChangeset should return current values only of targetFlags when specified', () => {
    const targetFlags: LDFlagSet | undefined = { 'test-flag': false };
    const flagChanges: LDFlagChangeset = {
      'test-flag': { current: true, previous: false },
      'another-test-flag': { current: false, previous: true },
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: true,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toEqual({ testFlag: true });
  });

  test('getFlattenedFlagsFromChangeset should return empty LDFlagSet when no targetFlags are changed ', () => {
    const targetFlags: LDFlagSet | undefined = { 'test-flag': false };
    const flagChanges: LDFlagChangeset = {
      'another-test-flag': { current: false, previous: true },
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: true,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(Object.keys(flattened)).toHaveLength(0);
  });

  test('getFlattenedFlagsFromChangeset should not change flags to camelCase when reactOptions.useCamelCaseFlagKeys is false ', () => {
    const targetFlags: LDFlagSet | undefined = undefined;
    const flagChanges: LDFlagChangeset = {
      'test-flag': { current: true, previous: false },
      'another-test-flag': { current: false, previous: true },
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: false,
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags, reactOptions);

    expect(flattened).toEqual({ 'another-test-flag': false, 'test-flag': true });
  });

  describe('fetchFlags', () => {
    const allFlags: LDFlagSet = { 'example-flag': true, 'test-example': false };
    const reactOptions: LDReactOptions = { ...defaultReactOptions };

    let mockLDClient: jest.Mocked<Partial<LDClient>>;

    beforeEach(() => {
      mockLDClient = {
        allFlags: jest.fn().mockReturnValue(allFlags),
        variation: jest.fn((_, defaultVal: boolean | string | number) => defaultVal),
      };
    });

    test('should return variations for the target flags', () => {
      const targetFlags = { 'target-one': true, 'target-two': true, 'target-three': false };
      const flagSet = fetchFlags(mockLDClient as LDClient, reactOptions, targetFlags);

      expect(mockLDClient.allFlags).toBeCalledTimes(0);
      expect(mockLDClient.variation).toBeCalledTimes(3);
      expect(flagSet).toEqual({ targetOne: true, targetThree: false, targetTwo: true });
    });

    test('should return all flags when target flags is not defined', () => {
      const flagSet = fetchFlags(mockLDClient as LDClient, reactOptions, undefined);

      expect(mockLDClient.allFlags).toBeCalledTimes(1);
      expect(mockLDClient.variation).toBeCalledTimes(0);
      expect(flagSet).toEqual({ exampleFlag: true, testExample: false });
    });

    test('should not return camelCase flag keys when useCamelCaseFlagKeys is set to false', () => {
      const flagSet = fetchFlags(mockLDClient as LDClient, { useCamelCaseFlagKeys: false }, undefined);

      expect(mockLDClient.allFlags).toBeCalledTimes(1);
      expect(mockLDClient.variation).toBeCalledTimes(0);
      expect(flagSet).toEqual(allFlags);
    });
  });
});
