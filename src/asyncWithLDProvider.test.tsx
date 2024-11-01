import React from 'react';
import '@testing-library/dom';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { initialize, LDClient, LDContext, LDFlagChangeset, LDOptions } from 'launchdarkly-js-client-sdk';
import { AsyncProviderConfig, LDReactOptions } from './types';
import { Consumer, reactSdkContextFactory } from './context';
import asyncWithLDProvider from './asyncWithLDProvider';
import wrapperOptions from './wrapperOptions';
import { fetchFlags } from './utils';

jest.mock('launchdarkly-js-client-sdk', () => {
  const actual = jest.requireActual('launchdarkly-js-client-sdk');

  return {
    ...actual,
    initialize: jest.fn(),
  };
});
jest.mock('./utils', () => {
  const originalModule = jest.requireActual('./utils');

  return {
    ...originalModule,
    fetchFlags: jest.fn(),
  };
});

const clientSideID = 'test-client-side-id';
const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
const rawFlags = { 'test-flag': true, 'another-test-flag': true };

const App = () => <>My App</>;
const mockInitialize = initialize as jest.Mock;
const mockFetchFlags = fetchFlags as jest.Mock;
let mockLDClient: { on: jest.Mock; off: jest.Mock; variation: jest.Mock; waitForInitialization: jest.Mock };

const renderWithConfig = async (config: AsyncProviderConfig) => {
  const LDProvider = await asyncWithLDProvider(config);

  const { getByText } = render(
    <LDProvider>
      <Consumer>
        {(value) => (
          <span>
            Received:{' '}
            {`Flags: ${JSON.stringify(value.flags)}.
            Error: ${value.error?.message}.
            ldClient: ${value.ldClient ? 'initialized' : 'undefined'}.`}
          </span>
        )}
      </Consumer>
    </LDProvider>,
  );

  return getByText(/^Received:/);
};

describe('asyncWithLDProvider', () => {
  let options: LDOptions;
  let rejectWaitForInitialization: () => void;

  beforeEach(() => {
    mockLDClient = {
      on: jest.fn((_e: string, cb: () => void) => {
        cb();
      }),
      off: jest.fn(),
      variation: jest.fn((_: string, v) => v),
      waitForInitialization: jest.fn(),
    };
    mockInitialize.mockImplementation(() => mockLDClient);
    mockFetchFlags.mockImplementation(() => rawFlags);
    rejectWaitForInitialization = () => {
      const timeoutError = new Error('waitForInitialization timed out');
      timeoutError.name = 'TimeoutError';
      mockLDClient.waitForInitialization.mockRejectedValue(timeoutError);
    };
    options = { bootstrap: {}, ...wrapperOptions };
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

  test('provider unmounts and unsubscribes correctly', async () => {
    const LDProvider = await asyncWithLDProvider({ clientSideID });
    const { unmount } = render(
      <LDProvider>
        <App />
      </LDProvider>,
    );
    unmount();

    expect(mockLDClient.off).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockLDClient.off).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(mockLDClient.off).toHaveBeenCalledWith('ready', expect.any(Function));
  });

  test('timeout error; provider unmounts and unsubscribes correctly', async () => {
    rejectWaitForInitialization();
    const LDProvider = await asyncWithLDProvider({ clientSideID });
    const { unmount } = render(
      <LDProvider>
        <App />
      </LDProvider>,
    );
    unmount();

    expect(mockLDClient.off).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockLDClient.off).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(mockLDClient.off).toHaveBeenCalledWith('ready', expect.any(Function));
  });

  test('waitForInitialization error (not timeout)', async () => {
    mockLDClient.waitForInitialization.mockRejectedValue(new Error('TestError'));
    const receivedNode = await renderWithConfig({ clientSideID });

    expect(receivedNode).toHaveTextContent('TestError');
    expect(mockLDClient.on).not.toHaveBeenCalledWith('ready', expect.any(Function));
    expect(mockLDClient.on).not.toHaveBeenCalledWith('failed', expect.any(Function));
  });

  test('subscribe to ready and failed events if waitForInitialization timed out', async () => {
    rejectWaitForInitialization();
    const LDProvider = await asyncWithLDProvider({ clientSideID });
    render(
      <LDProvider>
        <App />
      </LDProvider>,
    );

    expect(mockLDClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(mockLDClient.on).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  test('ready handler should update flags', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: () => void) => {
      // focus only on the ready handler and ignore other change and failed.
      if (e === 'ready') {
        cb();
      }
    });
    rejectWaitForInitialization();
    const receivedNode = await renderWithConfig({ clientSideID });

    expect(mockLDClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"testFlag":true,"anotherTestFlag":true}');
  });

  test('failed handler should update error', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (e: Error) => void) => {
      // focus only on the ready handler and ignore other change and failed.
      if (e === 'failed') {
        cb(new Error('Test sdk failure'));
      }
    });
    rejectWaitForInitialization();
    const receivedNode = await renderWithConfig({ clientSideID });

    expect(mockLDClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{}');
    expect(receivedNode).toHaveTextContent('Error: Test sdk failure');
  });

  test('ldClient is initialised correctly', async () => {
    const reactOptions: LDReactOptions = { useCamelCaseFlagKeys: false };
    await asyncWithLDProvider({ clientSideID, context, options, reactOptions });

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
  });

  test('ld client is initialised correctly with deprecated user object', async () => {
    const user: LDContext = { key: 'deprecatedUser' };
    const reactOptions: LDReactOptions = { useCamelCaseFlagKeys: false };
    await asyncWithLDProvider({ clientSideID, user, options, reactOptions });

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, user, options);
  });

  test('use context ignore user at init if both are present', async () => {
    const user: LDContext = { key: 'deprecatedUser' };
    const reactOptions: LDReactOptions = { useCamelCaseFlagKeys: false };

    // this should not happen in real usage. Only one of context or user should be specified.
    // if both are specified, context will be used and user ignored.
    await asyncWithLDProvider({ clientSideID, context, user, options, reactOptions });

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
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
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });

    const receivedNode = await renderWithConfig({ clientSideID });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"testFlag":false,"anotherTestFlag":true}');
    expect(receivedNode).toHaveTextContent('Error: undefined');
  });

  test('subscribe to changes with kebab-case', async () => {
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const receivedNode = await renderWithConfig({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } });

    expect(mockLDClient.on).toHaveBeenNthCalledWith(1, 'change', expect.any(Function));
    expect(receivedNode).toHaveTextContent('{"test-flag":false,"another-test-flag":false}');
  });

  test('consecutive flag changes gets stored in context correctly', async () => {
    mockLDClient.on.mockImplementationOnce((_e: string, cb: (c: LDFlagChangeset) => void) => {
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
    mockLDClient.on.mockImplementation((_e: string, _cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    options = {
      bootstrap: {
        'another-test-flag': false,
        'test-flag': true,
      },
    };
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
    expect(receivedNode).toHaveTextContent('{"anotherTestFlag":false,"testFlag":true}');
  });

  test('undefined bootstrap', async () => {
    mockLDClient.on.mockImplementation((_e: string, _cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    options = { ...options, bootstrap: undefined };
    mockFetchFlags.mockReturnValueOnce({ aNewFlag: true });
    const receivedNode = await renderWithConfig({ clientSideID, context, options });

    expect(mockFetchFlags).toHaveBeenCalledTimes(1);
    expect(receivedNode).toHaveTextContent('{"aNewFlag":true}');
  });

  test('bootstrap used if there is a timeout', async () => {
    mockLDClient.on.mockImplementation((_e: string, _cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    rejectWaitForInitialization();
    options = { ...options, bootstrap: { myBootstrap: true } };
    const receivedNode = await renderWithConfig({ clientSideID, context, options });

    expect(mockFetchFlags).not.toHaveBeenCalled();
    expect(receivedNode).toHaveTextContent('{"myBootstrap":true}');
    expect(receivedNode).toHaveTextContent('timed out');
  });

  test('ldClient bootstraps with empty flags', async () => {
    // don't subscribe to changes to test bootstrap
    mockLDClient.on.mockImplementation((_e: string, _cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    options = {
      bootstrap: {},
    };
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
    expect(receivedNode).toHaveTextContent('{}');
  });

  test('ldClient bootstraps correctly with kebab-case', async () => {
    // don't subscribe to changes to test bootstrap
    mockLDClient.on.mockImplementation((_e: string, _cb: (c: LDFlagChangeset) => void) => {
      return;
    });
    options = {
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
    options = {
      bootstrap: 'localStorage',
    };
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
    expect(receivedNode).toHaveTextContent('{"testFlag":true,"anotherTestFlag":true}');
  });

  test('internal ldClient state should be initialised', async () => {
    const receivedNode = await renderWithConfig({ clientSideID, context, options });
    expect(receivedNode).toHaveTextContent('ldClient: initialized');
  });

  test('ldClient is initialised correctly with target flags', async () => {
    options = { ...wrapperOptions };
    const flags = { 'test-flag': false };
    const receivedNode = await renderWithConfig({ clientSideID, context, options, flags });

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
    expect(receivedNode).toHaveTextContent('{"testFlag":true}');
  });

  test('only updates to subscribed flags are pushed to the Provider', async () => {
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true }, 'another-test-flag': { current: false, previous: true } });
    });
    options = {};
    const subscribedFlags = { 'test-flag': true };
    const receivedNode = await renderWithConfig({ clientSideID, context, options, flags: subscribedFlags });

    expect(receivedNode).toHaveTextContent('{"testFlag":false}');
  });

  test('custom context is provided to consumer', async () => {
    const CustomContext = reactSdkContextFactory();
    const customLDClient = {
      on: jest.fn((_: string, cb: () => void) => {
        cb();
      }),
      off: jest.fn(),
      allFlags: jest.fn().mockReturnValue({ 'context-test-flag': true }),
      variation: jest.fn((_: string, v) => v),
      waitForInitialization: jest.fn(),
    };
    const config: AsyncProviderConfig = {
      clientSideID,
      ldClient: customLDClient as unknown as LDClient,
      reactOptions: {
        reactContext: CustomContext,
      },
    };
    const originalUtilsModule = jest.requireActual('./utils');
    mockFetchFlags.mockImplementation(originalUtilsModule.fetchFlags);

    const LDProvider = await asyncWithLDProvider(config);
    const LaunchDarklyApp = (
      <LDProvider>
        <CustomContext.Consumer>
          {({ flags }) => {
            return (
              <span>
                flag is {flags.contextTestFlag === undefined ? 'undefined' : JSON.stringify(flags.contextTestFlag)}
              </span>
            );
          }}
        </CustomContext.Consumer>
      </LDProvider>
    );

    const { findByText } = render(LaunchDarklyApp);
    expect(await findByText('flag is true')).not.toBeNull();

    const receivedNode = await renderWithConfig({ clientSideID });
    expect(receivedNode).not.toHaveTextContent('{"contextTestFlag":true}');
  });

  test('multiple providers', async () => {
    const customLDClient1 = {
      on: jest.fn((_: string, cb: () => void) => {
        cb();
      }),
      off: jest.fn(),
      allFlags: jest.fn().mockReturnValue({ 'context1-test-flag': true }),
      variation: jest.fn((_: string, v) => v),
      waitForInitialization: jest.fn(),
    };
    const customLDClient2 = {
      on: jest.fn((_: string, cb: () => void) => {
        cb();
      }),
      off: jest.fn(),
      allFlags: jest.fn().mockReturnValue({ 'context2-test-flag': true }),
      variation: jest.fn((_: string, v) => v),
      waitForInitialization: jest.fn(),
    };
    const originalUtilsModule = jest.requireActual('./utils');
    mockFetchFlags.mockImplementation(originalUtilsModule.fetchFlags);

    const CustomContext1 = reactSdkContextFactory();
    const LDProvider1 = await asyncWithLDProvider({
      clientSideID,
      ldClient: customLDClient1 as unknown as LDClient,
      reactOptions: {
        reactContext: CustomContext1,
      },
    });
    const CustomContext2 = reactSdkContextFactory();
    const LDProvider2 = await asyncWithLDProvider({
      clientSideID,
      ldClient: customLDClient2 as unknown as LDClient,
      reactOptions: {
        reactContext: CustomContext2,
      },
    });
    const safeValue = (val?: boolean) => (val === undefined ? 'undefined' : JSON.stringify(val));
    const LaunchDarklyApp = (
      <LDProvider1>
        <LDProvider2>
          <CustomContext1.Consumer>
            {({ flags }) => {
              return (
                <>
                  <span>consumer 1, flag 1 is {safeValue(flags.context1TestFlag)}</span>
                  <span>consumer 1, flag 2 is {safeValue(flags.context2TestFlag)}</span>
                </>
              );
            }}
          </CustomContext1.Consumer>
          <CustomContext2.Consumer>
            {({ flags }) => {
              return (
                <>
                  <span>consumer 2, flag 1 is {safeValue(flags.context1TestFlag)}</span>
                  <span>consumer 2, flag 2 is {safeValue(flags.context2TestFlag)}</span>
                </>
              );
            }}
          </CustomContext2.Consumer>
        </LDProvider2>
      </LDProvider1>
    );

    const { findByText } = render(LaunchDarklyApp);
    expect(await findByText('consumer 1, flag 1 is true')).not.toBeNull();
    expect(await findByText('consumer 1, flag 2 is undefined')).not.toBeNull();
    expect(await findByText('consumer 2, flag 1 is undefined')).not.toBeNull();
    expect(await findByText('consumer 2, flag 2 is true')).not.toBeNull();
  });
});
