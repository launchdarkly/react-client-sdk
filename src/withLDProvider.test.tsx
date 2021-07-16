jest.mock('./initLDClient', () => jest.fn());
jest.mock('./context', () => ({ Provider: 'Provider' }));

import * as React from 'react';
import { create } from 'react-test-renderer';
import { LDFlagChangeset, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import withLDProvider from './withLDProvider';
import { EnhancedComponent, defaultReactOptions } from './types';
import LDProvider from './provider';

const clientSideID = 'deadbeef';
const App = () => <div>My App</div>;
const mockInitLDClient = initLDClient as jest.Mock;
const mockFlags = { testFlag: true, anotherTestFlag: true };
const mockLDClient = {
  on: jest.fn((e: string, cb: () => void) => {
    cb();
  }),
};

describe('withLDProvider', () => {
  beforeEach(() => {
    mockInitLDClient.mockImplementation(() => ({
      flags: mockFlags,
      ldClient: mockLDClient,
    }));
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
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const LaunchDarklyApp = withLDProvider({ clientSideID, user, options })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, defaultReactOptions, options, undefined);
  });

  test('ld client is initialised correctly with target flags', async () => {
    mockInitLDClient.mockImplementation(() => ({
      flags: { devTestFlag: true, launchDoggly: true },
      ldClient: mockLDClient,
    }));
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const LaunchDarklyApp = withLDProvider({ clientSideID, user, options, flags })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, defaultReactOptions, options, flags);
    expect(instance.setState).toHaveBeenCalledWith({
      flags: { devTestFlag: true, launchDoggly: true },
      ldClient: mockLDClient,
    });
  });

  test('flags and ldClient are saved in state on mount', async () => {
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();
    expect(instance.setState).toHaveBeenCalledWith({ flags: mockFlags, ldClient: mockLDClient });
  });

  test('subscribeToChanges is called on mount', async () => {
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.subscribeToChanges = jest.fn();

    await instance.componentDidMount();
    expect(instance.subscribeToChanges).toHaveBeenCalled();
  });

  test('subscribe to changes with camelCase', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const callback = mockSetState.mock.calls[1][0] as (flags: LDFlagSet) => LDFlagSet;
    const newState = callback({ flags: mockFlags });

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(newState).toEqual({ flags: { anotherTestFlag: true, testFlag: false } });
  });

  test('subscribe to changes with kebab-case', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const LaunchDarklyApp = withLDProvider({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const callback = mockSetState.mock.calls[1][0] as (flags: LDFlagSet) => LDFlagSet;
    const newState = callback({});

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(newState).toEqual({ flags: { 'another-test-flag': false, 'test-flag': false } });
  });

  test('hoist non react statics', async () => {
    interface ComponentWithStaticFn extends React.FC {
      getInitialProps: () => void;
    }
    const WrappedComponent: ComponentWithStaticFn = () => null;
    WrappedComponent.getInitialProps = function() {};

    const LaunchDarklyApp = withLDProvider({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } })(WrappedComponent) as ComponentWithStaticFn;
    expect(LaunchDarklyApp.getInitialProps).toBeDefined();
  });
});
