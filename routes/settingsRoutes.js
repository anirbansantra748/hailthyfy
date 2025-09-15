const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/isLoggedIn');

// Settings page route
router.get('/settings', isLoggedIn, (req, res) => {
  res.render('settings/index', {
    user: req.user,
    title: 'Account Settings - Healthfy'
  });
});

// Help Center routes
router.get('/help', (req, res) => {
  res.render('help/index', {
    user: req.user,
    title: 'Help Center - Healthfy'
  });
});

// Notifications routes
router.get('/notifications', isLoggedIn, (req, res) => {
  res.render('notifications/index', {
    user: req.user,
    title: 'Notifications - Healthfy',
    notifications: [
      {
        id: 1,
        title: 'AI Health Report Ready',
        message: 'Your latest health analysis is complete.',
        time: '5 minutes ago',
        read: false,
        type: 'ai'
      },
      {
        id: 2,
        title: 'Dr. Smith accepted your appointment',
        message: 'Your appointment for tomorrow has been confirmed.',
        time: '2 hours ago',
        read: false,
        type: 'appointment'
      },
      {
        id: 3,
        title: 'Weekly Health Challenge Started',
        message: 'Join the new 7-day mindfulness challenge.',
        time: '1 day ago',
        read: true,
        type: 'challenge'
      }
    ]
  });
});

// Privacy Policy route
router.get('/privacy', (req, res) => {
  res.render('legal/privacy', {
    user: req.user,
    title: 'Privacy Policy - Healthfy'
  });
});

// Terms of Service route
router.get('/terms', (req, res) => {
  res.render('legal/terms', {
    user: req.user,
    title: 'Terms of Service - Healthfy'
  });
});

// FAQs route
router.get('/faqs', (req, res) => {
  res.render('help/faqs', {
    user: req.user,
    title: 'Frequently Asked Questions - Healthfy'
  });
});

// About Us route
router.get('/about', (req, res) => {
  res.render('about/index', {
    user: req.user,
    title: 'About Healthfy - Your Healthcare Partner'
  });
});

// Contact Us route
router.get('/contact', (req, res) => {
  res.render('contact/index', {
    user: req.user,
    title: 'Contact Us - Healthfy'
  });
});

// Security page route
router.get('/security', (req, res) => {
  res.render('security/index', {
    user: req.user,
    title: 'Security & Compliance - Healthfy'
  });
});

// Emergency access route
router.get('/emergency', (req, res) => {
  res.render('emergency/index', {
    user: req.user,
    title: 'Emergency Services - Healthfy'
  });
});

// Blog route
router.get('/blog', (req, res) => {
  res.render('blog/index', {
    user: req.user,
    title: 'Health Blog - Healthfy',
    posts: [
      {
        title: 'The Future of AI in Healthcare',
        excerpt: 'How artificial intelligence is revolutionizing medical diagnosis and treatment.',
        author: 'Dr. Sarah Johnson',
        date: '2023-12-01',
        image: 'https://via.placeholder.com/400x200',
        slug: 'future-ai-healthcare'
      },
      {
        title: '10 Tips for Better Sleep Hygiene',
        excerpt: 'Simple changes to improve your sleep quality and overall health.',
        author: 'Dr. Michael Chen',
        date: '2023-11-28',
        image: 'https://via.placeholder.com/400x200',
        slug: 'better-sleep-hygiene'
      }
    ]
  });
});

// Careers route
router.get('/careers', (req, res) => {
  res.render('careers/index', {
    user: req.user,
    title: 'Careers - Join Our Healthcare Mission',
    positions: [
      {
        title: 'Senior Healthcare AI Engineer',
        department: 'Engineering',
        location: 'Remote / Kolkata',
        type: 'Full-time'
      },
      {
        title: 'Medical Content Specialist',
        department: 'Medical Affairs',
        location: 'Kolkata',
        type: 'Full-time'
      },
      {
        title: 'UX Designer - Healthcare',
        department: 'Design',
        location: 'Remote',
        type: 'Contract'
      }
    ]
  });
});

module.exports = router;