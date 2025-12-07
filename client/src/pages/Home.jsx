import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <div className="text-center max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-accent shadow-2xl">
                        <img
                            src="/profile.jpg"
                            alt="Samuel Adhikari"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-5xl md:text-7xl font-bold mb-6"
                >
                    Hi, I'm <span className="text-accent">Samuel Adhikari</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xl md:text-2xl text-gray-400 mb-10"
                >
                    Full Stack Developer | Tech Enthusiast | Problem Solver
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex flex-col sm:flex-row justify-center gap-4"
                >
                    <Link
                        to="/projects"
                        className="px-8 py-3 bg-accent text-primary font-bold rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105"
                    >
                        View My Work
                    </Link>
                    <Link
                        to="/contact"
                        className="px-8 py-3 border-2 border-accent text-accent font-bold rounded-full hover:bg-accent hover:text-primary transition-all transform hover:scale-105"
                    >
                        Contact Me
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Home;
