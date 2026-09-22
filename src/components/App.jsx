import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Sandbox from './Sandbox';

/**
 * Renders the application routes.
 *
 * @returns The application router.
 */
const App = () => (
    <Router basename='/'>
        <Routes>
            <Route path="/sandbox/:pkg?" element={<Sandbox />} />
        </Routes>
    </Router>
);

export default App;
