import ProviderState from './providerState';

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
jest.mock('./context', () => {
  const originalModule = jest.requireActual('./context');

  return {
    ...originalModule,
    Provider: 'Provider',
  };
});

import React, { Component } from 'react';
import { render } from '@testing-library/react';
import { create } from 'react-test-renderer';
import { initialize, LDClient, LDContext, LDFlagChangeset, LDOptions } from 'launchdarkly-js-client-sdk';
import { LDReactOptions, EnhancedComponent, ProviderConfig } from './types';
import { ReactSdkContext as HocState, reactSdkContextFactory } from './context';
import LDProvider from './provider';
import { fetchFlags } from './utils';
import wrapperOptions from './wrapperOptions';

const clientSideID = 'test-client-side-id';
const App = () => <div>My App</div>;
const mockInitialize = initialize as jest.Mock;
const mockFetchFlags = fetchFlags as jest.Mock;
const rawFlags = { 'test-flag': true, 'another-test-flag': true };
const mockLDClient = {
  on: jest.fn((_e: string, cb: () => void) => {
    cb();
  }),
  off: jest.fn(),
  allFlags: jest.fn().mockReturnValue({}),
  variation: jest.fn(),
  waitForInitialization: jest.fn(),
};

describe('LDProvider', () => {
  let context: LDContext;
  let options: LDOptions;
  let previousState: ProviderState;
  let timeoutError: Error;

  beforeEach(() => {
    mockInitialize.mockImplementation(() => mockLDClient);
    mockFetchFlags.mockImplementation(() => rawFlags);

    mockLDClient.variation.mockImplementation((_, v) => v);
    options = { ...wrapperOptions };
    previousState = {
      unproxiedFlags: {},
      flags: {},
      flagKeyMap: {},
    };
    context = { key: 'yus', kind: 'user', name: 'yus ng' };
    timeoutError = new Error('waitForInitialization timed out');
    timeoutError.name = 'TimeoutError';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render app', () => {
    const props: ProviderConfig = { clientSideID };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp);
    expect(component).toMatchSnapshot();
  });

  test('ld client is initialised correctly with deprecated user object', async () => {
    const user: LDContext = { key: 'yus' };
    const props: ProviderConfig = { clientSideID, user };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, user, options);
  });

  test('use context ignore user at init if both are present', async () => {
    const user: LDContext = { key: 'deprecatedUser' };

    // this should not happen in real usage. Only one of context or user should be specified.
    // if both are specified, context will be used and user ignored.
    const props: ProviderConfig = { clientSideID, context, user };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
  });

  test('ld client is initialised correctly', async () => {
    options = { ...options, bootstrap: {} };
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
  });

  test('ld client is used if passed in', async () => {
    options = { ...options, bootstrap: {} };
    const ldClient = mockLDClient as unknown as LDClient;
    mockInitialize.mockClear();
    const props: ProviderConfig = { clientSideID, ldClient };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  test('ld client is used if passed in as promise', async () => {
    const context2: LDContext = { key: 'launch', kind: 'user', name: 'darkly' };
    options = { ...options, bootstrap: {} };
    const ldClient = new Promise<LDClient>((resolve) => {
      resolve(mockLDClient as unknown as LDClient);

      return;
    });
    const props: ProviderConfig = { clientSideID, ldClient, context: context2 };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  test('ld client is created if passed in promise resolves as undefined', async () => {
    options = { ...options, bootstrap: {} };
    const ldClient = new Promise<undefined>((resolve) => {
      resolve(undefined);

      return;
    });
    const props: ProviderConfig = { clientSideID, ldClient, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
  });

  test('ldClient bootstraps with empty flags', () => {
    options = {
      bootstrap: {},
    };
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(initialState.flags).toEqual({});
  });

  test('ld client keeps bootstrapped flags, even when it failed to initialize', async () => {
    mockLDClient.waitForInitialization.mockRejectedValue(new Error('TestError'));
    options = {
      ...options,
      bootstrap: {
        'test-flag': true,
      },
    };
    const props: ProviderConfig = { clientSideID, context, options };

    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance?.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
    expect(setStateFunction(previousState)).toEqual({
      error: new Error('TestError'),
      flags: { testFlag: true },
      unproxiedFlags: { 'test-flag': true },
      flagKeyMap: { testFlag: 'test-flag' },
      ldClient: mockLDClient,
    });
  });

  test('waitForInitialization timed out', async () => {
    mockLDClient.waitForInitialization.mockRejectedValue(timeoutError);
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance?.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockLDClient.on).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(mockLDClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(setStateFunction(previousState)).toMatchObject({
      error: timeoutError,
    });
  });

  test('waitForInitialization succeeds', async () => {
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance?.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockLDClient.on).not.toHaveBeenCalledWith('failed', expect.any(Function));
    expect(mockLDClient.on).not.toHaveBeenCalledWith('ready', expect.any(Function));
    expect(setStateFunction(previousState)).toMatchObject({
      error: undefined,
    });
  });

  test('ld client is bootstrapped correctly and transforms keys to camel case', () => {
    options = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
        $flagsState: {
          'test-flag': { version: 125, variation: 0, trackEvents: true },
          'another-test-flag': { version: 18, variation: 1 },
        },
        $valid: true,
      },
    };
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('ld client should not transform keys to camel case if option is disabled', () => {
    options = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
      },
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: false,
    };
    const props: ProviderConfig = { clientSideID, context, options, reactOptions };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ 'test-flag': true, 'another-test-flag': false });
  });

  test('ld client should transform keys to camel case if transform option is absent', () => {
    options = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
      },
    };
    const reactOptions: LDReactOptions = {};
    const props: ProviderConfig = { clientSideID, context, options, reactOptions };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('ld client should transform keys to camel case if react options object is absent', () => {
    options = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
      },
    };
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('state.flags should be initialised to empty when bootstrapping from localStorage', () => {
    options = {
      bootstrap: 'localStorage',
    };
    const props: ProviderConfig = { clientSideID, context, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({});
  });

  test('ld client is initialised correctly with target flags', async () => {
    mockFetchFlags.mockImplementation(() => ({ 'dev-test-flag': false, 'launch-doggly': false }));

    options = { ...options, bootstrap: {} };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const props: ProviderConfig = { clientSideID, context, options, flags };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
    expect(setStateFunction(previousState)).toEqual({
      flags: { devTestFlag: false, launchDoggly: false },
      unproxiedFlags: { 'dev-test-flag': false, 'launch-doggly': false },
      flagKeyMap: { devTestFlag: 'dev-test-flag', launchDoggly: 'launch-doggly' },
      ldClient: mockLDClient,
    });
  });

  test('state is saved on mount', async () => {
    const props: ProviderConfig = { clientSideID };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(setStateFunction(previousState)).toEqual({
      flags: { testFlag: true, anotherTestFlag: true },
      unproxiedFlags: { 'test-flag': true, 'another-test-flag': true },
      flagKeyMap: { testFlag: 'test-flag', anotherTestFlag: 'another-test-flag' },
      ldClient: mockLDClient,
    });
  });

  test('subscribeToChanges is called on mount', async () => {
    const props: ProviderConfig = { clientSideID };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.subscribeToChanges = jest.fn();

    await instance.componentDidMount();
    expect(instance.subscribeToChanges).toHaveBeenCalled();
  });

  test('subscribe to changes with camelCase', async () => {
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });
    const props: ProviderConfig = { clientSideID };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(setStateFunction(previousState)).toEqual({
      flags: { anotherTestFlag: true, testFlag: false },
      unproxiedFlags: { 'another-test-flag': true, 'test-flag': false },
      flagKeyMap: { anotherTestFlag: 'another-test-flag', testFlag: 'test-flag' },
    });
  });

  test('subscribe to changes with kebab-case', async () => {
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const props: ProviderConfig = { clientSideID, reactOptions: { useCamelCaseFlagKeys: false } };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(setStateFunction(previousState)).toEqual({
      flagKeyMap: {},
      unproxiedFlags: { 'another-test-flag': false, 'test-flag': false },
      flags: { 'another-test-flag': false, 'test-flag': false },
    });
  });

  test(`if props.deferInitialization is true, ld client will only initialize once props.user is defined`, async () => {
    options = { ...options, bootstrap: {} };
    const props: ProviderConfig = { clientSideID, deferInitialization: true, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const renderer = create(LaunchDarklyApp);
    const instance = renderer.root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();

    expect(mockInitialize).toHaveBeenCalledTimes(0);

    const newProps = { ...props, context };
    const UpdatedLaunchDarklyApp = (
      <LDProvider {...newProps}>
        <App />
      </LDProvider>
    );
    renderer.update(UpdatedLaunchDarklyApp);
    if (instance.componentDidUpdate) {
      await instance.componentDidUpdate(props);
    }

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
  });

  test('only updates to subscribed flags are pushed to the Provider', async () => {
    mockFetchFlags.mockImplementation(() => ({ 'test-flag': 2 }));
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: 3, previous: 2 }, 'another-test-flag': { current: false, previous: true } });
    });
    options = {};

    const subscribedFlags = { 'test-flag': 1 };
    const props: ProviderConfig = { clientSideID, context, options, flags: subscribedFlags };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(setStateFunction(previousState)).toEqual({
      flags: { testFlag: 3 },
      unproxiedFlags: { 'test-flag': 3 },
      flagKeyMap: { testFlag: 'test-flag' },
    });
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
    const props: ProviderConfig = {
      clientSideID,
      ldClient: customLDClient as unknown as LDClient,
      reactOptions: {
        reactContext: CustomContext,
      },
    };
    const originalUtilsModule = jest.requireActual('./utils');
    mockFetchFlags.mockImplementation(originalUtilsModule.fetchFlags);

    const LaunchDarklyApp = (
      <LDProvider {...props}>
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
  });
});
