import './utils/monacoWorkers';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sandbox from './Sandbox';
import './styles/index.css';

const root = createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/sandbox/:pkg?" element={<Sandbox />} />
            <Route path="*" element={<Navigate to="/sandbox/contains-emoji" replace />} />
        </Routes>
    </BrowserRouter>
);
