import { useState } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            await api.post('/contact', formData);
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', message: '' });
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-secondary p-8 rounded-2xl shadow-2xl border border-gray-800"
            >
                <h2 className="text-3xl font-bold mb-8 text-center text-accent">Get In Touch</h2>

                {status === 'success' && (
                    <div className="mb-6 p-4 bg-green-900/50 text-green-200 rounded-lg text-center border border-green-800">
                        Message sent successfully! I'll get back to you soon.
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg text-center border border-red-800">
                        Failed to send message. Please try again later.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-white transition-all"
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-white transition-all"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-white transition-all"
                            placeholder="+977 9800000000"
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="5"
                            className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-white transition-all resize-none"
                            placeholder="Your message here..."
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="w-full py-4 bg-accent text-primary font-bold rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'sending' ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Contact;
