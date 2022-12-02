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
import { LDContext, LDFlagChangeset, LDOptions } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import { AsyncProviderConfig, LDReactOptions } from './types';
import { Consumer } from './context';
import asyncWithLDProvider from './asyncWithLDProvider';

const clientSideID = 'deadbeef';
const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
const App = () => <>My App</>;
const mockInitLDClient = initLDClient as jest.Mock;
const rawFlags = { 'test-flag': true, 'another-test-flag': true };
let mockLDClient: { on: jest.Mock; off: jest.Mock; variation: jest.Mock };

const renderWithConfig = async (config: AsyncProviderConfig) => {
  const LDProvider = await asyncWithLDProvider(config);

  const { getByText } = render(
    <LDProvider>
      <Consumer>{(value) => <span>Received: {JSON.stringify(value.flags)}</span>}</Consumer>
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
      off: jest.fn(),
      // tslint:disable-next-line: no-unsafe-any
      variation: jest.fn((_: string, v) => v),
    };

    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
      flags: rawFlags,
    }));
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
    await asyncWithLDProvider({ clientSideID, context, options, reactOptions });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, context, options, undefined);
  });

  test('ld client is initialised correctly with deprecated user object', async () => {
    const user: LDContext = { key: 'deprecatedUser' };
    const options: LDOptions = { bootstrap: {} };
    const reactOptions: LDReactOptions = { useCamelCaseFlagKeys: false };
    await asyncWithLDProvider({ clientSideID, user, options, reactOptions });
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, options, undefined);
  });

  test('use context ignore user at init if both are present', async () => {
    const user: LDContext = { key: 'deprecatedUser' };
    const options: LDOptions = { bootstrap: {} };
    const reactOptions: LDReactOptions = { useCamelCaseFlagKeys: false };

    // this should not happen in real usage. Only one of context or user should be specified.
    // if both are specified, context will be used and user ignored.
    await asyncWithLDProvider({ clientSideID, context, user, options, reactOptions });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, context, options, undefined);
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
    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
      flags: rawFlags,
    }));
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const receivedNode = await renderWithConfig({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"test-flag":false,"another-test-flag":false}');
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
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
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
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
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
      context,
      options,
      reactOptions: { useCamelCaseFlagKeys: false },
    });
    expect(receivedNode).toHaveTextContent('{"another-test-flag":false,"test-flag":true}');
  });

  test('internal flags state should be initialised to all flags', async () => {
    const options: LDOptions = {
      bootstrap: 'localStorage',
    };
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
    expect(receivedNode).toHaveTextContent('{"testFlag":true,"anotherTestFlag":true}');
  });

  test('ldClient is initialised correctly with target flags', async () => {
    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
      flags: rawFlags,
    }));

    const options: LDOptions = {};
    const flags = { 'test-flag': false };
    const receivedNode = await renderWithConfig({ clientSideID, context, options, flags });

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, context, options, flags);
    expect(receivedNode).toHaveTextContent('{"testFlag":true}');
  });

  test('only updates to subscribed flags are pushed to the Provider', async () => {
    mockInitLDClient.mockImplementation(() => ({
      ldClient: mockLDClient,
      flags: rawFlags,
    }));
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true }, 'another-test-flag': { current: false, previous: true } });
    });
    const options: LDOptions = {};
    const subscribedFlags = { 'test-flag': true };
    const receivedNode = await renderWithConfig({ clientSideID, context, options, flags: subscribedFlags });

    expect(receivedNode).toHaveTextContent('{"testFlag":false}');
  });
});
