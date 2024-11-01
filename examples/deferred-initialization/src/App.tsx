import React, { useState } from 'react';
import logo from './logo.svg';
import Welcome from './welcome';
import { LDProvider, LDContext } from 'launchdarkly-react-client-sdk';

import './App.css';

const clientSideID = process.env.REACT_APP_LD_CLIENT_SIDE_ID ?? '';

function App() {
  const [context, setContext] = useState<LDContext>();

  function onClickLogin() {
    setContext({ kind: 'user', key: 'yus' });
  }

  return (
    <LDProvider clientSideID={clientSideID} deferInitialization={true} context={context}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Welcome />
          <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Learn React
          </a>
          <p>
            <button onClick={onClickLogin}>Login</button>
          </p>
        </header>
      </div>
    </LDProvider>
  );
}

export default App;
