import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';
import getFlagsProxy from './getFlagsProxy';
import { defaultReactOptions } from './types';

const rawFlags: LDFlagSet = {
  'foo-bar': 'foobar',
  'baz-qux': 'bazqux',
};

const camelizedFlags: LDFlagSet = {
  fooBar: 'foobar',
  bazQux: 'bazqux',
};

// cast as unknown first to be able to partially mock ldClient
const ldClient = ({ variation: jest.fn((flagKey) => rawFlags[flagKey] as string) } as unknown) as LDClient;

beforeEach(jest.clearAllMocks);

test('native Object functions should be ignored', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags);
  flags.hasOwnProperty('fooBar');
  flags.propertyIsEnumerable('bazQux');
  expect(ldClient.variation).not.toHaveBeenCalled();
});

test('camel cases keys', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags);

  expect(flags).toEqual(camelizedFlags);
});

test('does not camel cases keys', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags, { useCamelCaseFlagKeys: false });

  expect(flags).toEqual(rawFlags);
});

test('proxy calls ldClient.variation on flag read', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags);

  expect(flags.fooBar).toBe('foobar');

  expect(ldClient.variation).toHaveBeenCalledWith('foo-bar', 'foobar');
});

test('proxy calls ldClient.variation on flag read when not using camel case keys', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags, { useCamelCaseFlagKeys: false });

  expect(flags.fooBar).toBe('foobar');

  expect(ldClient.variation).toHaveBeenCalledWith('foo-bar', 'foobar');
});


test('returns flag key map', () => {
  const { flagKeyMap } = getFlagsProxy(ldClient, rawFlags);

  expect(flagKeyMap).toEqual({ fooBar: 'foo-bar', bazQux: 'baz-qux' });
});

test('filters to target flags', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags, defaultReactOptions, { 'foo-bar': 'mr-toot' });

  expect(flags).toEqual({ fooBar: 'foobar' });
});

test('does not use proxy if option is false', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags, { sendEventsOnFlagRead: false });

  expect(flags['foo-bar']).toBe('foobar');

  expect(ldClient.variation).not.toHaveBeenCalled();
});
