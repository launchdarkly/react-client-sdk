import React from "react";
import "./App.css";
import {
  useFlags
} from "launchdarkly-react-client-sdk";

function Welcome() {
  const { devTestFlag } = useFlags();
  return (
    <p>{devTestFlag ? <b>Flag on</b> : <b>Flag off</b>}</p>
  );
}

export default Welcome;
