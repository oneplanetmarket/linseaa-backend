import mongoose from 'mongoose';

const ecoJourneySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  carbonFootprintSaved: { type: Number, default: 0 }, // in kg CO2
  sustainableProducts: { type: Number, default: 0 },
  localProducers: { type: Array, default: [] }, // Array of producer IDs
  achievements: [{
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String,
    category: String // 'carbon', 'local', 'spending', 'variety'
  }],
  monthlyStats: [{
    month: String, // YYYY-MM format
    orders: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    carbonSaved: { type: Number, default: 0 },
    sustainableItems: { type: Number, default: 0 }
  }],
  goals: {
    monthlySpending: { type: Number, default: 100 },
    carbonReduction: { type: Number, default: 10 }, // kg CO2 per month
    localSupport: { type: Number, default: 3 } // number of local producers per month
  },
  preferences: {
    categories: [String], // preferred product categories
    notifications: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: false }
  },
  streaks: {
    currentSustainableStreak: { type: Number, default: 0 }, // consecutive sustainable purchases
    longestSustainableStreak: { type: Number, default: 0 },
    lastPurchaseDate: Date
  },
  level: { type: Number, default: 1 },
  experiencePoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate user level based on experience points
ecoJourneySchema.methods.calculateLevel = function() {
  const xp = this.experiencePoints;
  // Level formula: Level = floor(sqrt(XP/100)) + 1
  this.level = Math.floor(Math.sqrt(xp / 100)) + 1;
  return this.level;
};

// Add experience points and check for achievements
ecoJourneySchema.methods.addExperience = function(points, category = 'general') {
  this.experiencePoints += points;
  this.calculateLevel();
  this.updatedAt = new Date();
  
  // Check for level-based achievements
  this.checkLevelAchievements();
  
  return this.experiencePoints;
};

// Check and award achievements
ecoJourneySchema.methods.checkLevelAchievements = function() {
  const achievements = [
    { level: 2, name: 'Eco Beginner', description: 'Started your eco journey', icon: '🌱', category: 'level' },
    { level: 5, name: 'Green Shopper', description: 'Reached level 5', icon: '🌿', category: 'level' },
    { level: 10, name: 'Sustainability Champion', description: 'Reached level 10', icon: '🏆', category: 'level' },
    { level: 20, name: 'Eco Master', description: 'Reached level 20', icon: '🌍', category: 'level' }
  ];

  achievements.forEach(achievement => {
    if (this.level >= achievement.level && !this.achievements.some(a => a.name === achievement.name)) {
      this.achievements.push({
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        earnedAt: new Date()
      });
    }
  });
};

// Update monthly stats
ecoJourneySchema.methods.updateMonthlyStats = function(orderAmount, carbonSaved, sustainableItems) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  let monthStat = this.monthlyStats.find(stat => stat.month === currentMonth);
  if (!monthStat) {
    monthStat = {
      month: currentMonth,
      orders: 0,
      spent: 0,
      carbonSaved: 0,
      sustainableItems: 0
    };
    this.monthlyStats.push(monthStat);
  }
  
  monthStat.orders += 1;
  monthStat.spent += orderAmount;
  monthStat.carbonSaved += carbonSaved;
  monthStat.sustainableItems += sustainableItems;
  
  this.updatedAt = new Date();
};

export default mongoose.model('EcoJourney', ecoJourneySchema);