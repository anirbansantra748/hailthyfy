// Healthfy Health Analytics System Verification Script
// Run with: node verify-system.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Healthfy Health Analytics System Verification\n');

// Files and directories to check
const checks = [
    // Core services
    { path: 'services/aiHealthPredictionService.js', type: 'file', description: 'AI Health Prediction Service' },
    { path: 'services/healthAnalyticsService.js', type: 'file', description: 'Health Analytics Service' },
    
    // Controllers
    { path: 'controllers/healthAnalyticsController.js', type: 'file', description: 'Health Analytics Controller' },
    
    // Routes
    { path: 'routes/healthAnalyticsRoutes.js', type: 'file', description: 'Health Analytics Routes' },
    
    // Views
    { path: 'views/health-analytics', type: 'dir', description: 'Health Analytics Views Directory' },
    { path: 'views/health-analytics/drug-interaction.ejs', type: 'file', description: 'Drug Interaction View' },
    { path: 'views/health-analytics/predictions-dashboard.ejs', type: 'file', description: 'Predictions Dashboard View' },
    { path: 'views/users/profile-enhanced.ejs', type: 'file', description: 'Enhanced Profile View' },
    { path: 'views/users/update-profile.ejs', type: 'file', description: 'Update Profile View' },
    
    // Models
    { path: 'models/User.js', type: 'file', description: 'User Model' },
    
    // Main app files
    { path: 'app.js', type: 'file', description: 'Main Application File' },
    { path: 'package.json', type: 'file', description: 'Package Configuration' },
    { path: '.env', type: 'file', description: 'Environment Variables' }
];

let passed = 0;
let failed = 0;

console.log('📋 Checking system components...\n');

checks.forEach(check => {
    const fullPath = path.join(__dirname, check.path);
    let exists = false;
    
    try {
        if (check.type === 'file') {
            exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
        } else if (check.type === 'dir') {
            exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
        }
    } catch (error) {
        exists = false;
    }
    
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${check.description}`);
    
    if (exists) {
        passed++;
    } else {
        failed++;
        console.log(`   📍 Missing: ${check.path}`);
    }
});

console.log('\n📊 Verification Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / checks.length) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All system components are in place!');
    console.log('🚀 Your health analytics system is ready for testing.');
    console.log('\nNext steps:');
    console.log('1. Start the application: npm start');
    console.log('2. Open browser: http://localhost:3000');
    console.log('3. Follow the testing checklist in TESTING_CHECKLIST.md');
} else {
    console.log('\n⚠️ Some components are missing.');
    console.log('Please ensure all required files are in place before testing.');
}

// Check package.json dependencies
console.log('\n🔧 Checking key dependencies...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = [
        'express', 'mongoose', 'ejs', 'passport', 
        'express-session', 'connect-flash', 'bcryptjs'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length === 0) {
        console.log('✅ All required dependencies are listed');
    } else {
        console.log('❌ Missing dependencies:', missingDeps.join(', '));
    }
} catch (error) {
    console.log('❌ Could not read package.json');
}

console.log('\n🔍 System verification complete!');