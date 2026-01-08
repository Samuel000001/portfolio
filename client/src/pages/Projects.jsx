import { motion } from 'framer-motion';
import { FaGithub, FaExternalLinkAlt, FaMicrochip } from 'react-icons/fa';

// Static projects data - loads instantly without API call
const projects = [
    {
        _id: '1',
        title: 'E-Commerce Platform',
        description: 'A full-featured online store with cart, checkout, and admin dashboard.',
        tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        githubUrl: '#',
        projectUrl: '#'
    },
    {
        _id: '2',
        title: 'Task Management App',
        description: 'Collaborative task manager with real-time updates using Socket.io.',
        tags: ['Vue.js', 'Firebase', 'Tailwind'],
        githubUrl: '#',
        projectUrl: '#'
    },
    {
        _id: '3',
        title: 'Portfolio Website',
        description: 'The website you are looking at right now!',
        tags: ['React', 'Vite', 'Tailwind'],
        githubUrl: 'https://github.com/Samuel000001/portfolio',
        projectUrl: 'https://portfolio-indol-beta-26.vercel.app'
    },
    {
        _id: '4',
        title: 'Sim8085 Simulator',
        description: 'A modern, web-based Intel 8085 Microprocessor simulator with real-time register monitoring.',
        tags: ['React', 'Assembly', 'Framer Motion'],
        githubUrl: '#',
        projectUrl: '/simulator'
    }
];

const Projects = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-4xl font-bold mb-12 text-center text-accent">My Projects</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                    <motion.div
                        key={project._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-secondary rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-800"
                    >
                        <div className="p-6">
                            <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                            <p className="text-gray-400 mb-4 line-clamp-3">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {project.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-primary text-xs rounded-full text-accent border border-gray-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                    <FaGithub /> Code
                                </a>
                                <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:text-white transition-colors">
                                    <FaExternalLinkAlt /> Live Demo
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Projects;
