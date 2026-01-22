import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sandbox from './Sandbox';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            {/* Sandbox route with optional package param */}
            <Route path="/sandbox/:pkg?" element={<Sandbox />} />

            {/* Catch-all: redirect unknown routes to sandbox */}
            <Route path="*" element={<Navigate to="/sandbox/orc-me" replace />} />
        </Routes>
    </BrowserRouter>
);
