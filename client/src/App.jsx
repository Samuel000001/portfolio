import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Sim8085 from './pages/Sim8085';
import Contact from './pages/Contact';

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/simulator" element={<Sim8085 />} />
                        <Route path="/contact" element={<Contact />} />
                    </Routes>
                </main>
                <footer className="bg-secondary py-6 text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Samuel Adhikari. All rights reserved.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
