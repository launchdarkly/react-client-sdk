jest.mock('launchdarkly-js-client-sdk', () => {
  const actual = jest.requireActual('launchdarkly-js-client-sdk');

  return {
    ...actual,
    initialize: jest.fn(),
  };
});
jest.mock('../package.json', () => ({ version: 'mock.version' }));

import { initialize, LDClient, LDContext, LDOptions } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';

const ldClientInitialize = initialize as jest.Mock;

const clientSideID = 'deadbeef';
const options: LDOptions = { bootstrap: 'localStorage' };
const extraOptionsAddedBySdk: LDOptions = {
  wrapperName: 'react-client-sdk',
  wrapperVersion: 'mock.version',
  sendEventsOnlyForVariation: true,
};
const expectedOptions: LDOptions = { ...options, ...extraOptionsAddedBySdk };
const flags = { 'test-flag': false, 'another-test-flag': true };

describe('initLDClient', () => {
  let mockLDClient: Partial<LDClient>;

  beforeEach(() => {
    mockLDClient = {
      on: (e: string, cb: () => void) => {
        if (e === 'ready') {
          cb();
        }
      },
      off: jest.fn(),
      allFlags: () => flags,
      variation: jest.fn(() => true),
    };

    ldClientInitialize.mockImplementation(() => mockLDClient);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initialise with clientSideID only', async () => {
    const anonymousContext: LDContext = { anonymous: true, kind: 'user' };
    await initLDClient(clientSideID);

    expect(ldClientInitialize.mock.calls[0]).toEqual([clientSideID, anonymousContext, extraOptionsAddedBySdk]);
    expect(mockLDClient.variation).toHaveBeenCalledTimes(0);
  });

  test('initialise with deprecated user object', async () => {
    const user = { key: 'yus@reactjunkie.com' };
    await initLDClient(clientSideID, user, options);

    expect(ldClientInitialize.mock.calls[0]).toEqual([clientSideID, user, expectedOptions]);
    expect(mockLDClient.variation).toHaveBeenCalledTimes(0);
  });

  test('initialise with context user kind and options', async () => {
    const contextUser = { key: 'yus@reactjunkie.com', kind: 'user' };
    await initLDClient(clientSideID, contextUser, options);

    expect(ldClientInitialize.mock.calls[0]).toEqual([clientSideID, contextUser, expectedOptions]);
    expect(mockLDClient.variation).toHaveBeenCalledTimes(0);
  });

  test('set sendEventsOnlyForVariation to false', async () => {
    const anonymousContext: LDContext = { anonymous: true, kind: 'user' };
    await initLDClient(clientSideID, undefined, { ...options, sendEventsOnlyForVariation: false });

    expect(ldClientInitialize.mock.calls[0]).toEqual([
      clientSideID,
      anonymousContext,
      { ...expectedOptions, sendEventsOnlyForVariation: false },
    ]);
    expect(mockLDClient.variation).toHaveBeenCalledTimes(0);
  });

  test('returns an error', async () => {
    const error = new Error('Out of cheese');
    mockLDClient.on = (e: string, cb: (err: Error) => void) => {
      if (e === 'failed') {
        cb(error);
      }
    };

    const flagsClient = await initLDClient(clientSideID);

    expect(flagsClient).toEqual({ flags: {}, ldClient: mockLDClient, error });
  });
});
