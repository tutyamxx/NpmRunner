import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sandbox from './Sandbox';

const App = () => {
    return (
        <Router basename='/'>
            <Routes>
                <Route path="/sandbox/:pkg?" element={<Sandbox />} />
            </Routes>
        </Router>
    );
};

export default App;
