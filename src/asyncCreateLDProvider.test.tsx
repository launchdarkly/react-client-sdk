jest.mock('./initLDClient', () => jest.fn());

import React from 'react';
import { render } from '@testing-library/react';
import { LDFlagChangeset, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import { defaultReactOptions, LDReactOptions, ProviderConfig } from './types';
import { Consumer } from './context';
import asyncCreateLDProvider from './asyncCreateLDProvider';

const clientSideID = 'deadbeef';
const user: LDUser = { key: 'yus', name: 'yus ng' };
const App = () => <>My App</>;
const mockInitLDClient = initLDClient as jest.Mock;
const mockFlags = { testFlag: true, anotherTestFlag: true };
let mockLDClient: { on: jest.Mock };

const renderWithConfig = async (config: ProviderConfig) => {
  const LDProvider = await asyncCreateLDProvider(config);

  const { getByText } = render(
    <LDProvider>
      <Consumer>{value => <span>Received: {JSON.stringify(value.flags)}</span>}</Consumer>
    </LDProvider>,
  );

  return getByText(/^Received:/);
};

describe('asyncCreateLDProvider', () => {
  beforeEach(() => {
    mockLDClient = {
      on: jest.fn((e: string, cb: () => void) => {
        cb();
      }),
    };

    mockInitLDClient.mockImplementation(() => ({
      flags: mockFlags,
      ldClient: mockLDClient,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('provider renders app correctly', async () => {
    const LDProvider = await asyncCreateLDProvider({ clientSideID });
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
    await asyncCreateLDProvider({ clientSideID, user, options, reactOptions });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, reactOptions, options, undefined);
  });

  test('subscribe to changes on mount', async () => {
    const LDProvider = await asyncCreateLDProvider({ clientSideID });
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
    mockInitLDClient.mockImplementation(() => ({
      flags: { 'another-test-flag': true, 'test-flag': true },
      ldClient: mockLDClient,
    }));
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const receivedNode = await renderWithConfig({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"another-test-flag":false,"test-flag":false}');
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
    mockInitLDClient.mockImplementation(() => ({
      flags: { devTestFlag: true, launchDoggly: true },
      ldClient: mockLDClient,
    }));
    const options: LDOptions = { bootstrap: {} };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const receivedNode = await renderWithConfig({ clientSideID, user, options, flags });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, defaultReactOptions, options, flags);
    expect(receivedNode).toHaveTextContent('{"devTestFlag":true,"launchDoggly":true}');
  });
});
