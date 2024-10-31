import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import './App.css';

function Welcome() {
  const { devTestFlag } = useFlags();

  return <p>{devTestFlag ? <b>Flag on</b> : <b>Flag off</b>}</p>;
}

export default Welcome;
