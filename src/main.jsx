import './utils/monacoWorkers';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sandbox from './components/Sandbox';
import { defaultPkg } from './hooks/useRunnerEffects';
import './styles/index.css';

const root = createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/sandbox/:pkg?" element={<Sandbox />} />
            <Route path="*" element={<Navigate to={`/sandbox/${defaultPkg}`} replace />} />
        </Routes>
    </BrowserRouter>
);
