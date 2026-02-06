import express from 'express';
import { 
    producerLogin, 
    producerLogout, 
    getProducerProfile,
    createProducerAccount,
    getAllProducers,
    updateProducerAccount,
    deleteProducerAccount
} from '../controllers/producerController.js';
import authProducer from '../middlewares/authProducer.js';
import authSeller from '../middlewares/authSeller.js';

const router = express.Router();

// Producer authentication routes
router.post('/login', producerLogin);
router.get('/logout', producerLogout);
router.get('/profile', authProducer, getProducerProfile);

// Admin routes for managing producer accounts
router.post('/create', authSeller, createProducerAccount);
router.get('/all', authSeller, getAllProducers);
router.put('/update/:id', authSeller, updateProducerAccount);
router.delete('/delete/:id', authSeller, deleteProducerAccount);

export default router;