// API Testing Script for Healthfy Health Analytics
// Run this in browser console after logging in

console.log("🧪 Starting Healthfy API Tests...");

// Test 1: Drug Interaction Check
async function testDrugInteractions() {
    console.log("\n📊 Testing Drug Interaction API...");
    
    try {
        const response = await fetch('/drug-interaction-checker/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                medications: ['Aspirin', 'Warfarin', 'Metformin']
            })
        });
        
        const result = await response.json();
        console.log("✅ Drug Interaction Result:", result);
        
        if (result.success) {
            console.log(`📋 Summary: ${result.data.summary.message}`);
            console.log(`⚠️ Severe: ${result.data.severe.length}`);
            console.log(`🟡 Moderate: ${result.data.moderate.length}`);
            console.log(`🟢 Mild: ${result.data.mild.length}`);
            console.log(`🚨 Allergies: ${result.data.allergicReactions.length}`);
        }
    } catch (error) {
        console.error("❌ Drug Interaction Test Failed:", error);
    }
}

// Test 2: Health Predictions
async function testHealthPredictions() {
    console.log("\n🧬 Testing Health Predictions API...");
    
    try {
        const response = await fetch('/health-predictions/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        console.log("✅ Health Prediction Result:", result);
        
        if (result.success) {
            console.log(`🎯 Overall Risk Score: ${result.data.overallRiskScore}/100`);
            console.log("📊 Disease Risks:", {
                diabetes: result.data.diseaseRisks.diabetes,
                heartDisease: result.data.diseaseRisks.heartDisease,
                hypertension: result.data.diseaseRisks.hypertension
            });
            console.log(`💡 Recommendations: ${result.data.recommendations.length} items`);
        }
    } catch (error) {
        console.error("❌ Health Prediction Test Failed:", error);
    }
}

// Test 3: User Medications Update
async function testMedicationUpdate() {
    console.log("\n💊 Testing Medication Update API...");
    
    try {
        const response = await fetch('/users/medications/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                medications: ['Lisinopril', 'Atorvastatin', 'Metformin']
            })
        });
        
        const result = await response.json();
        console.log("✅ Medication Update Result:", result);
    } catch (error) {
        console.error("❌ Medication Update Test Failed:", error);
    }
}

// Run all tests
async function runAllTests() {
    await testDrugInteractions();
    await testHealthPredictions();
    await testMedicationUpdate();
    console.log("\n🎉 All API tests completed!");
}

// Auto-run tests when script is loaded
runAllTests();