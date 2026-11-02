import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portada from './routes/portada/Portada.jsx';
import OlibiaDashboard from './routes/olibia/OlibiaDashboard.jsx';
import BiaDashboard from './routes/bia/BiaDashboard.jsx';
import '@fontsource-variable/inter';
import './tokens.css';
import './styles.css';
import './routes/bia/bia.css';
import './routes/portada/portada.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/olibia" element={<OlibiaDashboard />} />
        <Route path="/bia" element={<BiaDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
