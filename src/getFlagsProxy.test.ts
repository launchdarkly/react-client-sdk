import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';
import getFlagsProxy from './getFlagsProxy';
import { defaultReactOptions } from './types';

// tslint:disable-next-line: no-unsafe-any
const variation = jest.fn((k: string): string | undefined => rawFlags[k]);

const ldClient = ({ variation } as unknown) as LDClient;

const rawFlags: LDFlagSet = {
  'foo-bar': 'foobar',
  'baz-qux': 'bazqux',
};

const camelizedFlags: LDFlagSet = {
  fooBar: 'foobar',
  bazQux: 'bazqux',
};

beforeEach(jest.clearAllMocks);

test('camel cases keys', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags);

  expect(flags).toEqual(camelizedFlags);
});

test('does not camel cases keys', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags, { useCamelCaseFlagKeys: false });

  expect(flags).toEqual(rawFlags);
});

test('proxy calls variation on flag read', () => {
  const { flags } = getFlagsProxy(ldClient, rawFlags);

  expect(flags.fooBar).toBe('foobar');

  expect(variation).toHaveBeenCalledWith('foo-bar', 'foobar');
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

  expect(variation).not.toHaveBeenCalled();
});
