import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sandbox from './Sandbox';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/sandbox/:pkg" element={<Sandbox />} />
        </Routes>
    </BrowserRouter>
);
