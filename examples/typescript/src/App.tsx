import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import Welcome from "./welcome";
import { LDProvider } from "launchdarkly-react-client-sdk";
import { LDContext } from "launchdarkly-js-client-sdk";

function App() {
  const [context, setContext] = useState<LDContext>();

  function onClickLogin() {
    setContext({ kind: "user", key: "yus" });
  }

  return (
    <LDProvider clientSideID={"client-side-id"} deferInitialization={true} context={context}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Welcome />
          <a className="App-link" href="https://reactjs.org" target="_blank"
             rel="noopener noreferrer">
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
