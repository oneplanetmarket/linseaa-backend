import express from 'express';
import { 
  getEcoJourney, 
  updateEcoJourney, 
  updateGoals, 
  getLeaderboard, 
  getAchievementProgress 
} from '../controllers/ecoJourneyController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

// Get user's eco journey
router.get('/', authUser, getEcoJourney);

// Update eco journey after order
router.post('/update', authUser, updateEcoJourney);

// Update user goals
router.put('/goals', authUser, updateGoals);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Get achievement progress
router.get('/achievements', authUser, getAchievementProgress);

export default router;