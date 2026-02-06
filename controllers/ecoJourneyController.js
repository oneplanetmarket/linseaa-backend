import EcoJourney from '../models/EcoJourney.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Get or create user's eco journey
export const getEcoJourney = async (req, res) => {
  try {
    const userId = req.body.userId;
    
    let ecoJourney = await EcoJourney.findOne({ userId });
    
    if (!ecoJourney) {
      // Create new eco journey for user
      ecoJourney = new EcoJourney({ 
        userId,
        achievements: [{
          name: 'Welcome to OPM',
          description: 'Started your sustainable shopping journey',
          icon: '🌟',
          category: 'welcome',
          earnedAt: new Date()
        }]
      });
      await ecoJourney.save();
    }
    
    res.json({ success: true, ecoJourney });
  } catch (error) {
    console.error('Error fetching eco journey:', error);
    res.json({ success: false, message: error.message });
  }
};

// Update eco journey after order completion
export const updateEcoJourney = async (req, res) => {
  try {
    const { userId, orderId } = req.body;
    
    // Get order details
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }
    
    let ecoJourney = await EcoJourney.findOne({ userId });
    if (!ecoJourney) {
      ecoJourney = new EcoJourney({ userId });
    }
    
    // Calculate sustainability metrics
    let carbonSaved = 0;
    let sustainableItems = 0;
    let localProducers = new Set(ecoJourney.localProducers);
    
    order.items.forEach(item => {
      const product = item.productId;
      // Estimate carbon savings (simplified calculation)
      carbonSaved += item.quantity * 0.5; // 0.5kg CO2 saved per sustainable product
      sustainableItems += item.quantity;
      
      // Track local producers
      if (product.producer) {
        localProducers.add(product.producer.toString());
      }
    });
    
    // Update totals
    ecoJourney.totalOrders += 1;
    ecoJourney.totalSpent += order.amount;
    ecoJourney.carbonFootprintSaved += carbonSaved;
    ecoJourney.sustainableProducts += sustainableItems;
    ecoJourney.localProducers = Array.from(localProducers);
    
    // Update streaks
    const today = new Date();
    const lastPurchase = ecoJourney.streaks.lastPurchaseDate;
    
    if (!lastPurchase || (today - lastPurchase) / (1000 * 60 * 60 * 24) <= 7) {
      // Within a week, continue streak
      ecoJourney.streaks.currentSustainableStreak += 1;
      if (ecoJourney.streaks.currentSustainableStreak > ecoJourney.streaks.longestSustainableStreak) {
        ecoJourney.streaks.longestSustainableStreak = ecoJourney.streaks.currentSustainableStreak;
      }
    } else {
      // Reset streak
      ecoJourney.streaks.currentSustainableStreak = 1;
    }
    ecoJourney.streaks.lastPurchaseDate = today;
    
    // Add experience points
    const experienceGained = sustainableItems * 10 + Math.floor(order.amount / 10);
    ecoJourney.addExperience(experienceGained);
    
    // Update monthly stats
    ecoJourney.updateMonthlyStats(order.amount, carbonSaved, sustainableItems);
    
    // Check for new achievements
    checkOrderAchievements(ecoJourney);
    
    await ecoJourney.save();
    
    res.json({ 
      success: true, 
      ecoJourney,
      experienceGained,
      carbonSaved,
      message: 'Eco journey updated successfully'
    });
  } catch (error) {
    console.error('Error updating eco journey:', error);
    res.json({ success: false, message: error.message });
  }
};

// Update user goals
export const updateGoals = async (req, res) => {
  try {
    const { userId, goals } = req.body;
    
    const ecoJourney = await EcoJourney.findOne({ userId });
    if (!ecoJourney) {
      return res.json({ success: false, message: 'Eco journey not found' });
    }
    
    ecoJourney.goals = { ...ecoJourney.goals, ...goals };
    ecoJourney.updatedAt = new Date();
    
    await ecoJourney.save();
    
    res.json({ success: true, ecoJourney });
  } catch (error) {
    console.error('Error updating goals:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'level' } = req.query;
    
    let sortField;
    switch (type) {
      case 'carbon':
        sortField = 'carbonFootprintSaved';
        break;
      case 'spending':
        sortField = 'totalSpent';
        break;
      case 'orders':
        sortField = 'totalOrders';
        break;
      default:
        sortField = 'level';
    }
    
    const leaderboard = await EcoJourney.find({ 'preferences.publicProfile': true })
      .populate('userId', 'name email')
      .sort({ [sortField]: -1 })
      .limit(10)
      .select(`userId level experiencePoints totalOrders totalSpent carbonFootprintSaved ${sortField}`);
    
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get achievement progress
export const getAchievementProgress = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const ecoJourney = await EcoJourney.findOne({ userId });
    if (!ecoJourney) {
      return res.json({ success: false, message: 'Eco journey not found' });
    }
    
    // Available achievements
    const allAchievements = [
      { name: 'First Purchase', description: 'Made your first sustainable purchase', icon: '🛒', category: 'orders', target: 1, current: ecoJourney.totalOrders },
      { name: 'Green Dozen', description: 'Made 12 sustainable purchases', icon: '📦', category: 'orders', target: 12, current: ecoJourney.totalOrders },
      { name: 'Carbon Saver', description: 'Saved 10kg of CO2', icon: '🌍', category: 'carbon', target: 10, current: ecoJourney.carbonFootprintSaved },
      { name: 'Local Hero', description: 'Supported 5 local producers', icon: '🏘️', category: 'local', target: 5, current: ecoJourney.localProducers.length },
      { name: 'Streak Master', description: 'Maintained a 7-purchase streak', icon: '🔥', category: 'streak', target: 7, current: ecoJourney.streaks.currentSustainableStreak },
      { name: 'Eco Investor', description: 'Spent ₹1000 on sustainable products', icon: '💰', category: 'spending', target: 1000, current: ecoJourney.totalSpent }
    ];
    
    // Mark achieved ones
    const achievementProgress = allAchievements.map(achievement => ({
      ...achievement,
      achieved: ecoJourney.achievements.some(a => a.name === achievement.name),
      progress: Math.min((achievement.current / achievement.target) * 100, 100)
    }));
    
    res.json({ success: true, achievements: achievementProgress });
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.json({ success: false, message: error.message });
  }
};

// Helper function to check for order-based achievements
const checkOrderAchievements = (ecoJourney) => {
  const achievements = [
    { target: 1, name: 'First Purchase', description: 'Made your first sustainable purchase', icon: '🛒', category: 'orders', field: 'totalOrders' },
    { target: 5, name: 'Regular Shopper', description: 'Made 5 sustainable purchases', icon: '🛍️', category: 'orders', field: 'totalOrders' },
    { target: 12, name: 'Green Dozen', description: 'Made 12 sustainable purchases', icon: '📦', category: 'orders', field: 'totalOrders' },
    { target: 25, name: 'Eco Enthusiast', description: 'Made 25 sustainable purchases', icon: '🌟', category: 'orders', field: 'totalOrders' },
    { target: 10, name: 'Carbon Saver', description: 'Saved 10kg of CO2', icon: '🌍', category: 'carbon', field: 'carbonFootprintSaved' },
    { target: 50, name: 'Climate Champion', description: 'Saved 50kg of CO2', icon: '🏆', category: 'carbon', field: 'carbonFootprintSaved' },
    { target: 3, name: 'Community Supporter', description: 'Supported 3 local producers', icon: '🤝', category: 'local', field: 'localProducers' },
    { target: 5, name: 'Local Hero', description: 'Supported 5 local producers', icon: '🏘️', category: 'local', field: 'localProducers' },
    { target: 7, name: 'Streak Master', description: 'Maintained a 7-purchase streak', icon: '🔥', category: 'streak', field: 'streaks.currentSustainableStreak' },
    { target: 500, name: 'Eco Spender', description: 'Spent ₹500 on sustainable products', icon: '💳', category: 'spending', field: 'totalSpent' },
    { target: 1000, name: 'Eco Investor', description: 'Spent ₹1000 on sustainable products', icon: '💰', category: 'spending', field: 'totalSpent' }
  ];
  
  achievements.forEach(achievement => {
    let currentValue;
    if (achievement.field === 'localProducers') {
      currentValue = ecoJourney.localProducers.length;
    } else if (achievement.field === 'streaks.currentSustainableStreak') {
      currentValue = ecoJourney.streaks.currentSustainableStreak;
    } else {
      currentValue = ecoJourney[achievement.field];
    }
    
    if (currentValue >= achievement.target && !ecoJourney.achievements.some(a => a.name === achievement.name)) {
      ecoJourney.achievements.push({
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        earnedAt: new Date()
      });
    }
  });
};