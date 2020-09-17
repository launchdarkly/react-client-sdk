import React, { FunctionComponent } from 'react';
import { create } from 'react-test-renderer';
import MockProvider from './mockProvider';
import { useFlags } from './index';

const MockApp: FunctionComponent = () => {
  const flags = useFlags();

  return <div>Value: {`${flags.testFlag}`}</div>;
};

describe('MockProvider', () => {
  it('allows the usage of `useFlags` with the given mocked flags', () => {
    const LaunchDarklyApp = (
      <MockProvider flags={{ testFlag: 'my-test' }}>
        <MockApp />
      </MockProvider>
    );
    const component = create(LaunchDarklyApp);
    expect(component).toMatchSnapshot();
  });
});
