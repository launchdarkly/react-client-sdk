import React, { FunctionComponent } from 'react';
import { LDFlagSet } from 'launchdarkly-js-client-sdk';
import { Provider } from './context';

const MockProvider: FunctionComponent<{ flags: LDFlagSet }> = ({ flags, children }) => (
  <Provider value={{ flags }}>{children}</Provider>
);

export default MockProvider;
