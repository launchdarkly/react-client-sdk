import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';
import getFlagsProxy from './getFlagsProxy';

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
  const { _flags } = getFlagsProxy(ldClient, rawFlags);

  expect(_flags).toEqual(camelizedFlags);
});

test('does not camel cases keys', () => {
  const { _flags } = getFlagsProxy(ldClient, rawFlags, { useCamelCaseFlagKeys: false });

  expect(_flags).toEqual(rawFlags);
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
