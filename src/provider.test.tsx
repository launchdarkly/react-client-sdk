jest.mock('./initLDClient', () => jest.fn());
jest.mock('./context', () => ({ Provider: 'Provider' }));

import React, { Component } from 'react';
import { create } from 'react-test-renderer';
import { LDClient, LDFlagChangeset, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import { LDReactOptions, EnhancedComponent, ProviderConfig } from './types';
import { LDContext as HocState } from './context';
import LDProvider from './provider';

const clientSideID = 'deadbeef';
const App = () => <div>My App</div>;
const mockInitLDClient = initLDClient as jest.Mock;
const rawFlags = { 'test-flag': true, 'another-test-flag': true };
const mockLDClient = {
  on: jest.fn((e: string, cb: () => void) => {
    cb();
  }),
  allFlags: jest.fn().mockReturnValue({}),
  variation: jest.fn(),
};

describe('LDProvider', () => {
  beforeEach(() => {
    mockInitLDClient.mockImplementation(() => ({
      flags: rawFlags,
      ldClient: mockLDClient,
    }));
    // tslint:disable-next-line: no-unsafe-any
    mockLDClient.variation.mockImplementation((_, v) => v);
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

  test('ld client is initialised correctly', async () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const props: ProviderConfig = { clientSideID, user, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, options, undefined);
  });

  test('ld client is used if passed in', async () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const ldClient = (await initLDClient(clientSideID, user, options, undefined)).ldClient;
    mockInitLDClient.mockClear();
    const props: ProviderConfig = { clientSideID, ldClient };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).not.toHaveBeenCalled();
  });

  test('ld client is used if passed in as promise', async () => {
    const user1: LDUser = { key: 'yus', name: 'yus ng' };
    const user2: LDUser = { key: 'launch', name: 'darkly' };
    const options: LDOptions = { bootstrap: {} };
    const ldClient: Promise<LDClient> = new Promise(async (resolve) => {
      resolve((await initLDClient(clientSideID, user1, options, undefined)).ldClient);

      return;
    });
    const props: ProviderConfig = { clientSideID, ldClient, user: user2 };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).toBeCalledTimes(1);
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user1, options, undefined);
  });

  test('ld client is created if passed in promise resolves as undefined', async () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const ldClient: Promise<undefined> = new Promise(async (resolve) => {
      resolve(undefined);

      return;
    });
    const props: ProviderConfig = { clientSideID, ldClient, user, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, options, undefined);
  });

  test('ldClient bootstraps with empty flags', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: {},
    };
    const props: ProviderConfig = { clientSideID, user, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(initialState.flags).toEqual({});
  });

  test('ld client is bootstrapped correctly and transforms keys to camel case', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
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
    const props: ProviderConfig = { clientSideID, user, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('ld client should not transform keys to camel case if option is disabled', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
      },
    };
    const reactOptions: LDReactOptions = {
      useCamelCaseFlagKeys: false,
    };
    const props: ProviderConfig = { clientSideID, user, options, reactOptions };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ 'test-flag': true, 'another-test-flag': false });
  });

  test('ld client should transform keys to camel case if transform option is absent', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
      },
    };
    const reactOptions: LDReactOptions = {};
    const props: ProviderConfig = { clientSideID, user, options, reactOptions };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('ld client should transform keys to camel case if react options object is absent', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: {
        'test-flag': true,
        'another-test-flag': false,
      },
    };
    const props: ProviderConfig = { clientSideID, user, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('state.flags should be initialised to empty when bootstrapping from localStorage', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: 'localStorage',
    };
    const props: ProviderConfig = { clientSideID, user, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const component = create(LaunchDarklyApp).toTree()?.instance as Component;
    const initialState = component.state as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({});
  });

  test('ld client is initialised correctly with target flags', async () => {
    mockInitLDClient.mockImplementation(() => ({
      flags: { 'dev-test-flag': false, 'launch-doggly': false },
      ldClient: mockLDClient,
    }));
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const props: ProviderConfig = { clientSideID, user, options, flags };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, options, flags);
    expect(instance.setState).toHaveBeenCalledWith({
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
    instance.setState = jest.fn();

    await instance.componentDidMount();
    expect(instance.setState).toHaveBeenCalledWith({
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
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
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

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockSetState).toHaveBeenLastCalledWith({
      flags: { anotherTestFlag: true, testFlag: false },
      unproxiedFlags: { 'another-test-flag': true, 'test-flag': false },
      flagKeyMap: { anotherTestFlag: 'another-test-flag', testFlag: 'test-flag' },
    });
  });

  test('subscribe to changes with kebab-case', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
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

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockSetState).toHaveBeenLastCalledWith({
      flagKeyMap: {},
      unproxiedFlags: { 'another-test-flag': false, 'test-flag': false },
      flags: { 'another-test-flag': false, 'test-flag': false },
    });
  });

  test(`if props.deferInitialization is true, ld client will only initialize once props.user is defined`, async () => {
    const options: LDOptions = { bootstrap: {} };
    const props: ProviderConfig = { clientSideID, deferInitialization: true, options };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const renderer = create(LaunchDarklyApp);
    const instance = renderer.root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();

    expect(mockInitLDClient).toHaveBeenCalledTimes(0);

    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const newProps = { ...props, user };
    const UpdatedLaunchDarklyApp = (
      <LDProvider {...newProps}>
        <App />
      </LDProvider>
    );
    renderer.update(UpdatedLaunchDarklyApp);
    if (instance.componentDidUpdate) {
      await instance.componentDidUpdate(props);
    }

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, options, undefined);
  });

  test('only updates to subscribed flags are pushed to the Provider', async () => {
    mockInitLDClient.mockImplementation(() => ({
      flags: { 'test-flag': 2 },
      ldClient: mockLDClient,
    }));
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: 3, previous: 2 }, 'another-test-flag': { current: false, previous: true } });
    });
    const options: LDOptions = {};
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const subscribedFlags = { 'test-flag': 1 };
    const props: ProviderConfig = { clientSideID, user, options, flags: subscribedFlags };
    const LaunchDarklyApp = (
      <LDProvider {...props}>
        <App />
      </LDProvider>
    );
    const instance = create(LaunchDarklyApp).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();

    expect(mockSetState).toHaveBeenLastCalledWith({
      flags: { testFlag: 3 },
      unproxiedFlags: { 'test-flag': 3 },
      flagKeyMap: { testFlag: 'test-flag' },
    });
  });
});
