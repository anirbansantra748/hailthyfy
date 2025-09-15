const mongoose = require('mongoose');
require('dotenv').config();

const HealthChallenge = require('../models/HealthChallenge');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dummyChallenges = [
  {
    title: "🏃‍♂️ 30-Day Walking Challenge",
    description: "Walk 10,000 steps every day for 30 days and improve your cardiovascular health. Track your progress and build a healthy walking habit!",
    category: "fitness",
    type: "daily",
    difficulty: "beginner",
    target: {
      value: 10000,
      unit: "steps",
      description: "Walk 10,000 steps daily"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    rewards: {
      points: 100,
      badges: [],
      achievements: []
    },
    instructions: "Use a step counter app or fitness tracker to monitor your daily steps. Aim for 10,000 steps each day.",
    tips: [
      "Take the stairs instead of the elevator",
      "Park farther away from your destination",
      "Take walking breaks during work",
      "Walk while talking on the phone",
      "Use a pedometer or smartphone app to track steps"
    ],
    tags: ["walking", "fitness", "cardio", "beginner", "daily"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "💧 Hydration Hero Challenge",
    description: "Drink 8 glasses of water every day for 21 days. Stay hydrated and improve your overall health and energy levels!",
    category: "hydration",
    type: "daily",
    difficulty: "beginner",
    target: {
      value: 8,
      unit: "glasses",
      description: "Drink 8 glasses of water daily"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
    },
    rewards: {
      points: 75,
      badges: [],
      achievements: []
    },
    instructions: "Track your water intake throughout the day. One glass equals approximately 8 ounces or 240ml.",
    tips: [
      "Keep a water bottle with you at all times",
      "Set reminders on your phone to drink water",
      "Add lemon or cucumber for flavor",
      "Drink a glass of water before each meal",
      "Use apps to track your water intake"
    ],
    tags: ["hydration", "water", "health", "beginner", "daily"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "🥗 Healthy Eating Streak",
    description: "Eat at least 5 servings of fruits and vegetables every day for 14 days. Boost your nutrition and energy!",
    category: "nutrition",
    type: "daily",
    difficulty: "intermediate",
    target: {
      value: 5,
      unit: "servings",
      description: "Eat 5 servings of fruits and vegetables daily"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    },
    rewards: {
      points: 125,
      badges: [],
      achievements: []
    },
    instructions: "Track your daily fruit and vegetable intake. One serving equals 1 cup of raw vegetables, 1/2 cup cooked vegetables, or 1 medium fruit.",
    tips: [
      "Add vegetables to every meal",
      "Keep fruits visible on your counter",
      "Try new vegetables each week",
      "Blend fruits into smoothies",
      "Prep vegetables in advance for easy snacking"
    ],
    tags: ["nutrition", "fruits", "vegetables", "healthy-eating", "intermediate"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "🧘‍♀️ Mindfulness Meditation Journey",
    description: "Practice mindfulness meditation for 15 minutes daily for 21 days. Reduce stress and improve mental clarity.",
    category: "mental-health",
    type: "daily",
    difficulty: "beginner",
    target: {
      value: 15,
      unit: "minutes",
      description: "Meditate for 15 minutes daily"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
    },
    rewards: {
      points: 150,
      badges: [],
      achievements: []
    },
    instructions: "Find a quiet space and practice mindfulness meditation. Focus on your breath and observe your thoughts without judgment.",
    tips: [
      "Start with shorter sessions if needed",
      "Use meditation apps for guidance",
      "Create a consistent routine",
      "Find a comfortable, quiet space",
      "Be patient with yourself as you learn"
    ],
    tags: ["meditation", "mindfulness", "mental-health", "stress-relief", "beginner"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "😴 Sleep Optimization Challenge",
    description: "Get 7-8 hours of quality sleep every night for 21 days. Improve your sleep hygiene and wake up refreshed!",
    category: "sleep",
    type: "daily",
    difficulty: "intermediate",
    target: {
      value: 8,
      unit: "hours",
      description: "Sleep 7-8 hours nightly"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
    },
    rewards: {
      points: 175,
      badges: [],
      achievements: []
    },
    instructions: "Track your sleep duration and quality. Aim for consistent bedtime and wake-up times.",
    tips: [
      "Avoid screens 1 hour before bed",
      "Keep your bedroom cool and dark",
      "Establish a consistent bedtime routine",
      "Limit caffeine after 2 PM",
      "Use sleep tracking apps or devices"
    ],
    tags: ["sleep", "rest", "health", "routine", "intermediate"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "💪 30-Day Strength Building",
    description: "Complete strength training exercises for 30 minutes, 4 times per week for 30 days. Build muscle and increase strength!",
    category: "fitness",
    type: "weekly",
    difficulty: "intermediate",
    target: {
      value: 4,
      unit: "times",
      description: "Complete 4 strength sessions per week"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    rewards: {
      points: 200,
      badges: [],
      achievements: []
    },
    instructions: "Perform strength training exercises targeting major muscle groups. Each session should last at least 30 minutes.",
    tips: [
      "Focus on compound movements",
      "Progress gradually with weight or reps",
      "Allow rest days between sessions",
      "Maintain proper form over heavy weight",
      "Track your workouts and progress"
    ],
    tags: ["strength", "fitness", "muscle", "workout", "intermediate"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "🏃‍♀️ 5K Running Preparation",
    description: "Train for a 5K run over 8 weeks. Gradually build your running endurance and achieve your first 5K goal!",
    category: "fitness",
    type: "weekly",
    difficulty: "advanced",
    target: {
      value: 5000,
      unit: "steps",
      description: "Run 5 kilometers (approximately 5000 steps)"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000) // 8 weeks from now
    },
    rewards: {
      points: 300,
      badges: [],
      achievements: []
    },
    instructions: "Follow a structured 5K training plan. Start with run-walk intervals and gradually increase running duration.",
    tips: [
      "Start slowly and build gradually",
      "Invest in proper running shoes",
      "Warm up before and cool down after runs",
      "Listen to your body and rest when needed",
      "Stay hydrated during and after runs"
    ],
    tags: ["running", "5K", "cardio", "endurance", "advanced"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  },
  {
    title: "📱 Digital Detox Weekend",
    description: "Take a break from social media and unnecessary screen time every weekend for 4 weeks. Reconnect with the real world!",
    category: "mental-health",
    type: "weekly",
    difficulty: "intermediate",
    target: {
      value: 2,
      unit: "days",
      description: "2 days of reduced screen time per week"
    },
    duration: {
      start: new Date(),
      end: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 4 weeks from now
    },
    rewards: {
      points: 150,
      badges: [],
      achievements: []
    },
    instructions: "Limit recreational screen time during weekends. Focus on offline activities and real-world connections.",
    tips: [
      "Plan offline activities in advance",
      "Use app timers to track usage",
      "Find alternative hobbies",
      "Spend time in nature",
      "Connect with friends and family in person"
    ],
    tags: ["digital-detox", "mental-health", "mindfulness", "weekend", "intermediate"],
    isPublic: true,
    isActive: true,
    statistics: {
      totalParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      popularityScore: 0
    },
    participants: []
  }
];

async function addDummyChallenges() {
  try {
    console.log('Starting to add dummy challenges...');
    
    // Find any user to set as creator (or create a system user)
    let systemUser = await User.findOne({ email: 'system@healthfy.com' });
    
    if (!systemUser) {
      // Create a system user if it doesn't exist
      console.log('Creating system user...');
      systemUser = new User({
        name: 'Healthfy System',
        email: 'system@healthfy.com',
        password: '$2b$10$dummy.hash.for.system.user', // Dummy hash
        isDoctor: false,
        role: 'admin'
      });
      await systemUser.save();
      console.log('System user created');
    }

    // Clear existing challenges
    await HealthChallenge.deleteMany({});
    console.log('Cleared existing challenges');

    // Add dummy challenges
    for (let i = 0; i < dummyChallenges.length; i++) {
      const challengeData = {
        ...dummyChallenges[i],
        createdBy: systemUser._id
      };
      
      const challenge = new HealthChallenge(challengeData);
      await challenge.save();
      
      console.log(`Created challenge: ${challenge.title}`);
    }
    
    console.log('✅ All dummy challenges added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding dummy challenges:', error);
    process.exit(1);
  }
}

// Run the script
addDummyChallenges();