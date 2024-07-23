import wrapperOptions from './wrapperOptions';

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
jest.mock('./context', () => ({ Provider: 'Provider' }));

import * as React from 'react';
import { create } from 'react-test-renderer';
import { initialize, LDContext, LDFlagChangeset, LDOptions } from 'launchdarkly-js-client-sdk';
import withLDProvider from './withLDProvider';
import { EnhancedComponent } from './types';
import LDProvider from './provider';
import { fetchFlags } from './utils';
import ProviderState from './providerState';

const clientSideID = 'test-client-side-id';
const App = () => <div>My App</div>;
const mockInitialize = initialize as jest.Mock;
const mockFetchFlags = fetchFlags as jest.Mock;
const rawFlags = { 'test-flag': true, 'another-test-flag': true };
const mockLDClient = {
  on: jest.fn((_e: string, cb: () => void) => {
    cb();
  }),
  allFlags: jest.fn().mockReturnValue({}),
  variation: jest.fn(),
  waitForInitialization: jest.fn(),
};

describe('withLDProvider', () => {
  let options: LDOptions;
  let previousState: ProviderState;

  beforeEach(() => {
    mockInitialize.mockImplementation(() => mockLDClient);
    mockFetchFlags.mockImplementation(() => rawFlags);
    mockLDClient.variation.mockImplementation((_, v) => v);
    options = { bootstrap: {}, ...wrapperOptions };
    previousState = {
      unproxiedFlags: {},
      flags: {},
      flagKeyMap: {},
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render app', () => {
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const component = create(<LaunchDarklyApp />);
    expect(component).toMatchSnapshot();
  });

  test('ld client is initialised correctly', async () => {
    const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
    const LaunchDarklyApp = withLDProvider({ clientSideID, context, options })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
  });

  test('ld client is initialised correctly with target flags', async () => {
    mockFetchFlags.mockImplementation(() => ({ 'dev-test-flag': true, 'launch-doggly': true }));
    const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const LaunchDarklyApp = withLDProvider({ clientSideID, context, options, flags })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockInitialize).toHaveBeenCalledWith(clientSideID, context, options);
    expect(setStateFunction(previousState)).toEqual({
      flags: { devTestFlag: true, launchDoggly: true },
      unproxiedFlags: { 'dev-test-flag': true, 'launch-doggly': true },
      flagKeyMap: { devTestFlag: 'dev-test-flag', launchDoggly: 'launch-doggly' },
      ldClient: mockLDClient,
    });
  });

  test('flags and ldClient are saved in state on mount', async () => {
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(setStateFunction(previousState)).toEqual({
      flags: { testFlag: true, anotherTestFlag: true },
      unproxiedFlags: rawFlags,
      flagKeyMap: { testFlag: 'test-flag', anotherTestFlag: 'another-test-flag' },
      ldClient: mockLDClient,
    });
  });

  test('subscribeToChanges is called on mount', async () => {
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.subscribeToChanges = jest.fn();

    await instance.componentDidMount();
    expect(instance.subscribeToChanges).toHaveBeenCalled();
  });

  test('subscribe to changes with camelCase', async () => {
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(setStateFunction(previousState)).toEqual({
      flags: { anotherTestFlag: true, testFlag: false },
      unproxiedFlags: { 'test-flag': false, 'another-test-flag': true },
      flagKeyMap: { testFlag: 'test-flag', anotherTestFlag: 'another-test-flag' },
    });
  });

  test('subscribe to changes with kebab-case', async () => {
    mockLDClient.on.mockImplementation((_e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const LaunchDarklyApp = withLDProvider({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const setStateFunction = mockSetState.mock?.lastCall?.[0] as (p: ProviderState) => ProviderState;

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(setStateFunction(previousState)).toEqual({
      flags: { 'test-flag': false, 'another-test-flag': false },
      unproxiedFlags: { 'test-flag': false, 'another-test-flag': false },
      flagKeyMap: {},
    });
  });

  test('hoist non react statics', () => {
    interface ComponentWithStaticFn extends React.FC {
      getInitialProps(): void;
    }
    const WrappedComponent: ComponentWithStaticFn = () => <></>;
    WrappedComponent.getInitialProps = () => '';

    const LaunchDarklyApp = withLDProvider({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } })(
      WrappedComponent,
    ) as ComponentWithStaticFn;
    expect(LaunchDarklyApp.getInitialProps).toBeDefined();
  });
});
