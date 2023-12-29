import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import App from '../universal/app';

(async () => {
  // Set clientSideID to your own Client-side ID. You can find this in
  // your LaunchDarkly portal under Account settings / Projects
  const LDProvider = await asyncWithLDProvider({ clientSideID: '' });

  const root = createRoot(document.getElementById('reactDiv'));
  root.render(
    <BrowserRouter>
      <LDProvider>
        <App />
      </LDProvider>
    </BrowserRouter>);
})();
