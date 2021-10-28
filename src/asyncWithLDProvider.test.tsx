jest.mock('./initLDClient', () => jest.fn());
jest.mock('./utils', () => {
  const originalModule = jest.requireActual('./utils');

  return {
    ...originalModule,
    fetchFlags: jest.fn(),
  };
});

import React from 'react';
import { render } from '@testing-library/react';
import { LDFlagChangeset, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import { fetchFlags } from './utils';
import { AsyncProviderConfig, defaultReactOptions, LDReactOptions } from './types';
import { Consumer } from './context';
import asyncWithLDProvider from './asyncWithLDProvider';

const clientSideID = 'deadbeef';
const user: LDUser = { key: 'yus', name: 'yus ng' };
const App = () => <>My App</>;
const mockInitLDClient = initLDClient as jest.Mock;
const mockFetchFlags = fetchFlags as jest.Mock;
const mockFlags = { testFlag: true, anotherTestFlag: true };
let mockLDClient: { on: jest.Mock };

const renderWithConfig = async (config: AsyncProviderConfig) => {
  const LDProvider = await asyncWithLDProvider(config);

  const { getByText } = render(
    <LDProvider>
      <Consumer>{value => <span>Received: {JSON.stringify(value.flags)}</span>}</Consumer>
    </LDProvider>,
  );

  return getByText(/^Received:/);
};

describe('asyncWithLDProvider', () => {
  beforeEach(() => {
    mockLDClient = {
      on: jest.fn((e: string, cb: () => void) => {
        cb();
      }),
    };

    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
    }));

    mockFetchFlags.mockReturnValue(mockFlags);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('provider renders app correctly', async () => {
    const LDProvider = await asyncWithLDProvider({ clientSideID });
    const { container } = render(
      <LDProvider>
        <App />
      </LDProvider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('ldClient is initialised correctly', async () => {
    const options: LDOptions = { bootstrap: {} };
    const reactOptions: LDReactOptions = { useCamelCaseFlagKeys: false };
    await asyncWithLDProvider({ clientSideID, user, options, reactOptions });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, reactOptions, options, undefined);
  });

  test('subscribe to changes on mount', async () => {
    const LDProvider = await asyncWithLDProvider({ clientSideID });
    render(
      <LDProvider>
        <App />
      </LDProvider>,
    );
    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
  });

  test('subscribe to changes with camelCase', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });

    const receivedNode = await renderWithConfig({ clientSideID });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"testFlag":false,"anotherTestFlag":true}');
  });

  test('subscribe to changes with kebab-case', async () => {
    mockFetchFlags.mockReturnValue({ 'another-test-flag': true, 'test-flag': true });
    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
    }));
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const receivedNode = await renderWithConfig({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"another-test-flag":false,"test-flag":false}');
  });

  test('consecutive flag changes gets stored in context correctly', async () => {
    mockLDClient.on.mockImplementationOnce((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true } });

      // simulate second update
      cb({ 'test-flag': { current: false, previous: true } });
    });

    const receivedNode = await renderWithConfig({ clientSideID });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"testFlag":false,"anotherTestFlag":false}');
  });

  test('ldClient bootstraps correctly', async () => {
    // don't subscribe to changes to test bootstrap
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    const options: LDOptions = {
      bootstrap: {
        'another-test-flag': false,
        'test-flag': true,
      },
    };
    const receivedNode = await renderWithConfig({ clientSideID, user, options });
    expect(receivedNode).toHaveTextContent('{"anotherTestFlag":false,"testFlag":true}');
  });

  test('ldClient bootstraps with empty flags', async () => {
    // don't subscribe to changes to test bootstrap
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    const options: LDOptions = {
      bootstrap: {},
    };
    const receivedNode = await renderWithConfig({ clientSideID, user, options });
    expect(receivedNode).toHaveTextContent('{}');
  });

  test('ldClient bootstraps correctly with kebab-case', async () => {
    // don't subscribe to changes to test bootstrap
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    const options: LDOptions = {
      bootstrap: {
        'another-test-flag': false,
        'test-flag': true,
      },
    };
    const receivedNode = await renderWithConfig({
      clientSideID,
      user,
      options,
      reactOptions: { useCamelCaseFlagKeys: false },
    });
    expect(receivedNode).toHaveTextContent('{"another-test-flag":false,"test-flag":true}');
  });

  test('internal flags state should be initialised to all flags', async () => {
    const options: LDOptions = {
      bootstrap: 'localStorage',
    };
    const receivedNode = await renderWithConfig({ clientSideID, user, options });
    expect(receivedNode).toHaveTextContent('{"testFlag":true,"anotherTestFlag":true}');
  });

  test('ldClient is initialised correctly with target flags', async () => {
    mockFetchFlags.mockReturnValue({ devTestFlag: true, launchDoggly: true });
    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
    }));

    const options: LDOptions = {};
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const receivedNode = await renderWithConfig({ clientSideID, user, options, flags });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, defaultReactOptions, options, flags);
    expect(receivedNode).toHaveTextContent('{"devTestFlag":true,"launchDoggly":true}');
  });

  test('only updates to subscribed flags are pushed to the Provider', async () => {
    mockFetchFlags.mockReturnValue({ testFlag: 2 });
    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
    }));
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: 3, previous: 2 }, 'another-test-flag': { current: false, previous: true } });
    });
    const options: LDOptions = {};
    const subscribedFlags = { 'test-flag': 1 };
    const receivedNode = await renderWithConfig({ clientSideID, user, options, flags: subscribedFlags });

    expect(receivedNode).toHaveTextContent('{"testFlag":3}');
  });
});
