import { motion } from 'framer-motion';

const Blog = () => {
    const posts = [
        {
            id: 1,
            title: "Getting Started with Web Development",
            excerpt: "My journey into the world of web development and what I've learned so far.",
            date: "October 15, 2023",
            readTime: "5 min read"
        },
        {
            id: 2,
            title: "Why I Love React",
            excerpt: "Exploring the features of React that make it my go-to library for building user interfaces.",
            date: "November 2, 2023",
            readTime: "4 min read"
        },
        {
            id: 3,
            title: "The Future of AI in Coding",
            excerpt: "Thoughts on how AI tools are reshaping the landscape of software engineering.",
            date: "November 20, 2023",
            readTime: "6 min read"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-4xl font-bold mb-12 text-center text-accent">My Blog</h2>
                <div className="grid gap-8">
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                            className="bg-secondary p-6 rounded-xl border border-gray-800 hover:border-accent transition-colors duration-300 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-bold text-white group-hover:text-accent transition-colors">{post.title}</h3>
                                <span className="text-sm text-gray-500">{post.date}</span>
                            </div>
                            <p className="text-gray-400 mb-4">{post.excerpt}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">{post.readTime}</span>
                                <button className="text-accent font-medium hover:underline">Read More →</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Blog;
