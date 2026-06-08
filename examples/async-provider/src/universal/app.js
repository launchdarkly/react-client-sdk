import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SiteNav from './siteNav';
import Home from './home';
import HooksDemo from './hooksDemo';

const App = () => (
  <div>
    <SiteNav />
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/hooks" element={<HooksDemo />} />
      </Routes>
    </main>
  </div>
);

export default App;
