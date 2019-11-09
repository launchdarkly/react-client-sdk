import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import App from '../universal/app';

(async () => {
  const LDProvider = await asyncWithLDProvider({ clientSideID: '59b2b2596d1a250b1c78baa4' });

  render(
    <BrowserRouter>
      <LDProvider>
        <App />
      </LDProvider>
    </BrowserRouter>,
    document.getElementById('reactDiv'),
  );
})();
