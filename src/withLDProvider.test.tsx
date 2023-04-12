jest.mock('./initLDClient', () => jest.fn());
jest.mock('./context', () => ({ Provider: 'Provider' }));

import * as React from 'react';
import { create } from 'react-test-renderer';
import { LDContext, LDFlagChangeset, LDOptions } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import withLDProvider from './withLDProvider';
import { EnhancedComponent } from './types';
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

describe('withLDProvider', () => {
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
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const component = create(<LaunchDarklyApp />);
    expect(component).toMatchSnapshot();
  });

  test('ld client is initialised correctly', async () => {
    const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const LaunchDarklyApp = withLDProvider({ clientSideID, context, options })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, context, options, undefined);
  });

  test('ld client is initialised correctly with target flags', async () => {
    mockInitLDClient.mockImplementation(() => ({
      flags: { 'dev-test-flag': true, 'launch-doggly': true },
      ldClient: mockLDClient,
    }));
    const context: LDContext = { key: 'yus', kind: 'user', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const LaunchDarklyApp = withLDProvider({ clientSideID, context, options, flags })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, context, options, flags);
    expect(instance.setState).toHaveBeenCalledWith({
      flags: { devTestFlag: true, launchDoggly: true },
      unproxiedFlags: { 'dev-test-flag': true, 'launch-doggly': true },
      flagKeyMap: { devTestFlag: 'dev-test-flag', launchDoggly: 'launch-doggly' },
      ldClient: mockLDClient,
    });
  });

  test('flags and ldClient are saved in state on mount', async () => {
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();
    expect(instance.setState).toHaveBeenCalledWith({
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
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });
    const LaunchDarklyApp = withLDProvider({ clientSideID })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockSetState).toHaveBeenLastCalledWith({
      flags: { anotherTestFlag: true, testFlag: false },
      unproxiedFlags: { 'test-flag': false, 'another-test-flag': true },
      flagKeyMap: { testFlag: 'test-flag', anotherTestFlag: 'another-test-flag' },
    });
  });

  test('subscribe to changes with kebab-case', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'another-test-flag': { current: false, previous: true }, 'test-flag': { current: false, previous: true } });
    });
    const LaunchDarklyApp = withLDProvider({ clientSideID, reactOptions: { useCamelCaseFlagKeys: false } })(App);
    const instance = create(<LaunchDarklyApp />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockSetState).toHaveBeenLastCalledWith({
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
