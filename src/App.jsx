import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Sandbox from './Sandbox';

const App = () => {
    const [count, setCount] = useState(0);

    return (
        <Router>
            <Routes>
                {/* Home page */}
                <Route
                    path="/"
                    element={
                        <>
                            <div>
                                <a href="https://vite.dev" target="_blank">
                                    <img src={viteLogo} className="logo" alt="Vite logo" />
                                </a>
                                <a href="https://react.dev" target="_blank">
                                    <img src={reactLogo} className="logo react" alt="React logo" />
                                </a>
                            </div>

                            <h1>Vite + React</h1>
                            <div className="card">
                                <button onClick={() => setCount((c) => (c ?? 0) + 1)}>
                                    count is {count ?? 0}
                                </button>
                                <p>
                                    Edit <code>src/App.jsx</code> and save to test HMR
                                </p>
                            </div>
                            <p className="read-the-docs">
                                Click on the Vite and React logos to learn more
                            </p>
                        </>
                    }
                />

                {/* Sandbox routes */}
                <Route path="/sandbox" element={<Sandbox />} />
                <Route path="/sandbox/:pkg" element={<Sandbox />} />
            </Routes>
        </Router>
    );
};

export default App;
