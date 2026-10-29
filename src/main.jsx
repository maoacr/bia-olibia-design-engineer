import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OlibiaDashboard from './routes/olibia/OlibiaDashboard';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/olibia" replace />} />
        <Route path="/olibia" element={<OlibiaDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
