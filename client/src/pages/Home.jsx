import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';

const TooltipItem = ({ text, meaning }) => (
    <div className="relative group inline-block cursor-help font-mono tracking-wide">
        <span className="text-gray-500">&lt;</span>
        <span className="hover:text-accent transition-colors duration-300 group-hover:text-accent cursor-pointer text-gray-300">
            {text}
        </span>
        <span className="text-gray-500"> /&gt;</span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-secondary text-white text-sm font-sans rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none border border-gray-700 shadow-xl whitespace-nowrap z-50">
            {meaning}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-secondary"></div>
        </div>
    </div>
);

const Home = () => {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 opacity-20 pointer-events-none z-0">
                <img src="/circuit-bg.jpg" alt="Circuit Background" className="w-full h-full object-cover rounded-bl-full filter hue-rotate-[160deg] saturate-200" style={{ maskImage: 'linear-gradient(to bottom left, black, transparent)' }} />
            </div>

            <div className="text-center max-w-3xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-[#38bdf8] shadow-2xl">
                        <img
                            src="/profile.jpg"
                            alt="Samuel Adhikari"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div >
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-5xl md:text-7xl font-bold mb-6"
                >
                    Hi, I'm{' '}
                    <span className="text-accent inline-block">
                        <TypeAnimation
                            sequence={[
                                'Samuel',
                                3000,
                                'Student',
                                3000,
                                'Engineer',
                                3000,
                                'Tech Enthusiast',
                                3000,
                                'Problem Solver',
                                3000,
                            ]}
                            wrapper="span"
                            speed={30}
                            deletionSpeed={90}
                            repeat={Infinity}
                        />
                    </span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xl md:text-2xl text-gray-400 mb-10 flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center"
                >
                    <TooltipItem text="Engineer" meaning="Designing robust solutions for the real world." />
                    <span className="hidden md:block text-accent">|</span>
                    <TooltipItem text="Tech Enthusiast" meaning="Always exploring the cutting edge." />
                    <span className="hidden md:block text-accent">|</span>
                    <TooltipItem text="Problem Solver" meaning="Turning complex challenges into simple opportunities." />
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex flex-col sm:flex-row justify-center gap-4"
                >
                    <Link
                        to="/projects"
                        className="px-8 py-3 bg-accent text-primary font-bold rounded-full hover:bg-opacity-90 active:scale-95 md:hover:scale-105 transition-all transform"
                    >
                        View My Work
                    </Link>
                    <Link
                        to="/contact"
                        className="px-8 py-3 border-2 border-accent text-accent font-bold rounded-full hover:bg-accent hover:text-primary active:scale-95 md:hover:scale-105 transition-all transform"
                    >
                        Contact Me
                    </Link>
                </motion.div>
            </div >
        </div >
    );
};

export default Home;
