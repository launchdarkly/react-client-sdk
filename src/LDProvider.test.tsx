jest.mock('./initLDClient', () => jest.fn());
jest.mock('./context', () => ({ Provider: 'Provider' }));

import * as React from 'react';
import { create } from 'react-test-renderer';
import { shallow } from 'enzyme';
import { LDFlagChangeset, LDFlagSet, LDOptions, LDUser } from 'launchdarkly-js-client-sdk';
import initLDClient from './initLDClient';
import { LDReactOptions, EnhancedComponent, defaultReactOptions, ProviderConfig } from './types';
import { LDContext as HocState } from './context';
import LDProvider from './LDProvider';

const clientSideID = 'deadbeef';
const LaunchDarklyApp = (props: ProviderConfig) => (
  <LDProvider {...props}>
    <div>My App</div>
  </LDProvider>
);
const mockInitLDClient = initLDClient as jest.Mock;
const mockFlags = { testFlag: true, anotherTestFlag: true };
const mockLDClient = {
  on: jest.fn((e: string, cb: () => void) => {
    cb();
  }),
};

describe('LDProvider', () => {
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
    const props = { clientSideID };
    const component = create(<LaunchDarklyApp {...props} />);
    expect(component).toMatchSnapshot();
  });

  test.only('ld client is initialised correctly', async () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const props = { clientSideID, user, options };
    const instance = create(<LaunchDarklyApp {...props} />).root.findByType(LDProvider).instance as EnhancedComponent;

    await instance.componentDidMount();
    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, defaultReactOptions, options, undefined);
  });

  test('ldClient bootstraps with empty flags', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: {},
    };
    const props = { clientSideID, suser, options };
    const component = shallow(<LaunchDarklyApp {...props} />, { disableLifecycleMethods: true });
    const initialState = component.state() as HocState;

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
    const props = { clientSideID, user, options };
    const component = shallow(<LaunchDarklyApp {...props} />, { disableLifecycleMethods: true });
    const initialState = component.state() as HocState;

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
    const props = { clientSideID, user, options, reactOptions };
    const component = shallow(<LaunchDarklyApp {...props} />, { disableLifecycleMethods: true });
    const initialState = component.state() as HocState;

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
    const props = { clientSideID, user, options, reactOptions };
    const component = shallow(<LaunchDarklyApp {...props} />, { disableLifecycleMethods: true });
    const initialState = component.state() as HocState;

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
    const props = { clientSideID, user, options };
    const component = shallow(<LaunchDarklyApp {...props} />, { disableLifecycleMethods: true });
    const initialState = component.state() as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({ testFlag: true, anotherTestFlag: false });
  });

  test('state.flags should be initialised to empty when bootstrapping from localStorage', () => {
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = {
      bootstrap: 'localStorage',
    };
    const props = { clientSideID, user, options };
    const component = shallow(<LaunchDarklyApp {...props} />, { disableLifecycleMethods: true });
    const initialState = component.state() as HocState;

    expect(mockInitLDClient).not.toHaveBeenCalled();
    expect(initialState.flags).toEqual({});
  });

  test('ld client is initialised correctly with target flags', async () => {
    mockInitLDClient.mockImplementation(() => ({
      flags: { devTestFlag: true, launchDoggly: true },
      ldClient: mockLDClient,
    }));
    const user: LDUser = { key: 'yus', name: 'yus ng' };
    const options: LDOptions = { bootstrap: {} };
    const flags = { 'dev-test-flag': false, 'launch-doggly': false };
    const props = { clientSideID, user, options, flags };
    const instance = create(<LaunchDarklyApp {...props} />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();

    expect(mockInitLDClient).toHaveBeenCalledWith(clientSideID, user, defaultReactOptions, options, flags);
    expect(instance.setState).toHaveBeenCalledWith({
      flags: { devTestFlag: true, launchDoggly: true },
      ldClient: mockLDClient,
    });
  });

  test('flags and ldClient are saved in state on mount', async () => {
    const props = { clientSideID };
    const instance = create(<LaunchDarklyApp {...props} />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.setState = jest.fn();

    await instance.componentDidMount();
    expect(instance.setState).toHaveBeenCalledWith({ flags: mockFlags, ldClient: mockLDClient });
  });

  test('subscribeToChanges is called on mount', async () => {
    const props = { clientSideID };
    const instance = create(<LaunchDarklyApp {...props} />).root.findByType(LDProvider).instance as EnhancedComponent;
    instance.subscribeToChanges = jest.fn();

    await instance.componentDidMount();
    expect(instance.subscribeToChanges).toHaveBeenCalled();
  });

  test('subscribe to changes with camelCase', async () => {
    mockLDClient.on.mockImplementation((e: string, cb: (c: LDFlagChangeset) => void) => {
      cb({ 'test-flag': { current: false, previous: true } });
    });
    const props = { clientSideID };
    const instance = create(<LaunchDarklyApp {...props} />).root.findByType(LDProvider).instance as EnhancedComponent;
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
    const props = { clientSideID, reactOptions: { useCamelCaseFlagKeys: false } };
    const instance = create(<LaunchDarklyApp {...props} />).root.findByType(LDProvider).instance as EnhancedComponent;
    const mockSetState = jest.spyOn(instance, 'setState');

    await instance.componentDidMount();
    const callback = mockSetState.mock.calls[1][0] as (flags: LDFlagSet) => LDFlagSet;
    const newState = callback({});

    expect(mockLDClient.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(newState).toEqual({ flags: { 'another-test-flag': false, 'test-flag': false } });
  });
});
