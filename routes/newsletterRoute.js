import express from 'express';
import Newsletter from '../models/Newsletter.js';
import { sendNewsletterConfirmation } from '../services/emailService.js';

const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({ success: false, message: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.json({ success: false, message: 'Email already subscribed to newsletter' });
    }

    // Create new subscriber
    const subscriber = new Newsletter({ email });
    await subscriber.save();

    // Send newsletter confirmation email (non-blocking)
    try {
      await sendNewsletterConfirmation(email);
    } catch (emailError) {
      console.error('Failed to send newsletter confirmation email:', emailError);
      // Don't fail subscription if email fails
    }

    res.json({ success: true, message: 'Successfully subscribed to newsletter' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.json({ success: false, message: 'Failed to subscribe to newsletter' });
  }
});

// Get all subscribers (for admin use)
router.get('/subscribers', async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort({ subscribedAt: -1 });
    res.json({ success: true, subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.json({ success: false, message: 'Failed to fetch subscribers' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({ success: false, message: 'Email is required' });
    }

    await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    res.json({ success: true, message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.json({ success: false, message: 'Failed to unsubscribe from newsletter' });
  }
});

// Send newsletter to all subscribers (admin only)
router.post('/send', async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!title || !body) {
      return res.json({ success: false, message: 'Title and body are required' });
    }

    // Get all active subscribers
    const subscribers = await Newsletter.find({ isActive: true });
    
    if (subscribers.length === 0) {
      return res.json({ success: false, message: 'No active subscribers found' });
    }

    // Import the newsletter sending function
    const { sendNewsletterToSubscribers } = await import('../services/emailService.js');
    
    // Send newsletter to all subscribers
    const sentCount = await sendNewsletterToSubscribers(subscribers, title, body);
    
    res.json({ 
      success: true, 
      message: 'Newsletter sent successfully', 
      sentCount 
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    res.json({ success: false, message: 'Failed to send newsletter' });
  }
});

export default router;