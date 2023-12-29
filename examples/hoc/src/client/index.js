import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '../universal/app';

createRoot(document.getElementById('reactDiv')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
