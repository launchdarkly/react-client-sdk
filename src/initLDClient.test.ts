jest.mock('launchdarkly-js-client-sdk', () => {
  const actual = jest.requireActual('launchdarkly-js-client-sdk');

  return {
    ...actual,
    initialize: jest.fn(),
  };
});
jest.mock('../package.json', () => ({ version: 'mock.version' }));

import { initialize, LDClient, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
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
    const anonUser: LDUser = { anonymous: true };
    await initLDClient(clientSideID);

    expect(ldClientInitialize.mock.calls[0]).toEqual([clientSideID, anonUser, extraOptionsAddedBySdk]);
    expect(mockLDClient.variation).toHaveBeenCalledTimes(0);
  });

  test('initialise with custom user and options', async () => {
    const customUser = { key: 'yus@reactjunkie.com' };
    await initLDClient(clientSideID, customUser, options);

    expect(ldClientInitialize.mock.calls[0]).toEqual([clientSideID, customUser, expectedOptions]);
    expect(mockLDClient.variation).toHaveBeenCalledTimes(0);
  });

  test('may explicity set sendEventsOnlyForVariation to false', async () => {
    const anonUser: LDUser = { anonymous: true };
    await initLDClient(clientSideID, undefined, { ...options, sendEventsOnlyForVariation: false });

    expect(ldClientInitialize.mock.calls[0]).toEqual([
      clientSideID,
      anonUser,
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
