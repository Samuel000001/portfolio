const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Contact = require('../models/Contact');

// Get all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a project (Protected route logic would go here, simplified for now)
router.post('/projects', async (req, res) => {
    const project = new Project({
        title: req.body.title,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        projectUrl: req.body.projectUrl,
        githubUrl: req.body.githubUrl,
        tags: req.body.tags
    });

    try {
        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Contact Form Submission
router.post('/contact', async (req, res) => {
    const contact = new Contact({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        message: req.body.message
    });

    try {
        const newContact = await contact.save();
        res.status(201).json({ message: 'Message sent successfully!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
