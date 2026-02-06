import express from 'express';
import ProducerApplication from '../models/ProducerApplication.js';
import { sendProducerApplicationSubmitted, sendProducerApplicationApproved, sendProducerApplicationRejected } from '../services/emailService.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const data = new ProducerApplication(req.body);
    await data.save();
    res.status(201).json({ message: 'Application submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const apps = await ProducerApplication.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.patch('/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await ProducerApplication.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
