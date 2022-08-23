import { camelCaseKeys, fetchFlags, getFlattenedFlagsFromChangeset } from './utils';
import { LDClient, LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';

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
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags);

    expect(flattened).toEqual({ 'another-test-flag': false, 'test-flag': true });
  });

  test('getFlattenedFlagsFromChangeset should return current values only of targetFlags when specified', () => {
    const targetFlags: LDFlagSet | undefined = { 'test-flag': false };
    const flagChanges: LDFlagChangeset = {
      'test-flag': { current: true, previous: false },
      'another-test-flag': { current: false, previous: true },
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags);

    expect(flattened).toEqual({ 'test-flag': true });
  });

  test('getFlattenedFlagsFromChangeset should return empty LDFlagSet when no targetFlags are changed ', () => {
    const targetFlags: LDFlagSet | undefined = { 'test-flag': false };
    const flagChanges: LDFlagChangeset = {
      'another-test-flag': { current: false, previous: true },
    };
    const flattened = getFlattenedFlagsFromChangeset(flagChanges, targetFlags);

    expect(Object.keys(flattened)).toHaveLength(0);
  });

  describe('fetchFlags', () => {
    const allFlags: LDFlagSet = { 'example-flag': true, 'test-example': false };

    let mockLDClient: jest.Mocked<Partial<LDClient>>;

    beforeEach(() => {
      mockLDClient = {
        allFlags: jest.fn().mockReturnValue(allFlags),
        variation: jest.fn((_, defaultVal: boolean | string | number) => defaultVal),
      };
    });

    test('should return variations for the target flags', () => {
      const targetFlags = { 'target-one': true, 'target-two': true, 'target-three': false };
      const flagSet = fetchFlags(mockLDClient as LDClient, targetFlags);

      expect(mockLDClient.allFlags).toBeCalledTimes(0);
      expect(mockLDClient.variation).toBeCalledTimes(3);
      expect(flagSet).toEqual({ 'target-one': true, 'target-three': false, 'target-two': true });
    });

    test('should return all flags when target flags is not defined', () => {
      const flagSet = fetchFlags(mockLDClient as LDClient, undefined);

      expect(mockLDClient.allFlags).toBeCalledTimes(1);
      expect(mockLDClient.variation).toBeCalledTimes(0);
      expect(flagSet).toEqual({ 'example-flag': true, 'test-example': false });
    });
  });
});
