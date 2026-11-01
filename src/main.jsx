import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OlibiaDashboard from './routes/olibia/OlibiaDashboard.jsx';
import BiaDashboard from './routes/bia/BiaDashboard.jsx';
import '@fontsource-variable/inter';
import './tokens.css';
import './styles.css';
import './routes/bia/bia.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/olibia" replace />} />
        <Route path="/olibia" element={<OlibiaDashboard />} />
        <Route path="/bia" element={<BiaDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
