import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';

function App() {
  const { devTestFlag } = useFlags();
  const ldClient = useLDClient();
  const context = ldClient?.getContext();

  if (context && 'kind' in context) {
    if (context.kind === 'multi') {
      console.log(`=== multi context`);
    } else {
      console.log(`=== single context: ${context.kind}`);
    }
  } else {
    console.log('=== Legacy LDUser');
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{devTestFlag ? <b>Flag on</b> : <b>Flag off</b>}</p>
        <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
