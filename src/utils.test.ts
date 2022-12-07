import { camelCaseKeys, fetchFlags, getContextOrUser, getFlattenedFlagsFromChangeset } from './utils';
import { LDClient, LDContext, LDFlagChangeset, LDFlagSet } from 'launchdarkly-js-client-sdk';

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

    test('should return only the target flags', () => {
      const targetFlags = { 'target-one': true, 'target-two': true, 'target-three': false };
      const flagSet = fetchFlags(mockLDClient as LDClient, targetFlags);

      expect(flagSet).toEqual({ 'target-one': true, 'target-three': false, 'target-two': true });
    });

    test('should return all flags when target flags is not defined', () => {
      const flagSet = fetchFlags(mockLDClient as LDClient, undefined);

      expect(mockLDClient.allFlags).toBeCalledTimes(1);
      expect(flagSet).toEqual({ 'example-flag': true, 'test-example': false });
    });
  });

  describe('getContextOrUser', () => {
    test('returns context if both context and user are provided', () => {
      const clientSideID = 'test-id';
      const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
      const user: LDContext = { key: 'deprecatedUser' };
      const result = getContextOrUser({ clientSideID, context, user });
      expect(result).toEqual(context);
    });

    test('returns user if no context is provided', () => {
      const clientSideID = 'test-id';
      const user: LDContext = { key: 'deprecatedUser' };
      const result = getContextOrUser({ clientSideID, user });
      expect(result).toEqual(user);
    });

    test('returns context if only context is provided', () => {
      const clientSideID = 'test-id';
      const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
      const result = getContextOrUser({ clientSideID, context });
      expect(result).toEqual(context);
    });

    test('returns undefined if no context or user is provided', () => {
      const clientSideID = 'test-id';
      const result = getContextOrUser({ clientSideID });
      expect(result).toBeUndefined();
    });
  });
});
