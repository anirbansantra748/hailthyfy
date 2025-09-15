const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

/**
 * Medicine Price Comparison Routes
 * Search across multiple pharmacy websites for best medicine prices
 */

// GET /medicine-search - Medicine search page
router.get('/', medicineController.renderSearchPage);

// POST /medicine-search - Form submission for medicine search
router.post('/', medicineController.searchMedicine);

// POST /medicine-search/search - Search for medicine prices (API)
router.post('/search', medicineController.searchMedicine);

// GET /medicine-search/compare/:medicineId - Compare specific medicine across platforms
router.get('/compare/:medicineId', medicineController.compareMedicine);

// POST /medicine-search/favorites - Add medicine to favorites (requires auth)
router.post('/favorites', medicineController.addToFavorites);

// GET /medicine-search/favorites - Get user's favorite medicines (requires auth)  
router.get('/favorites', medicineController.getFavorites);

// DELETE /medicine-search/favorites/:favoriteId - Remove from favorites (requires auth)
router.delete('/favorites/:favoriteId', medicineController.removeFromFavorites);

// GET /medicine-search/trending - Get trending medicines
router.get('/trending', medicineController.getTrending);

// GET /medicine-search/suggestions - Get medicine name suggestions for autocomplete
router.get('/suggestions', medicineController.getSuggestions);

// GET /medicine-search/price-history/:medicineName - Get price history
router.get('/price-history/:medicineName', medicineController.getPriceHistory);

// POST /medicine-search/alert - Set price alert
router.post('/alert', medicineController.setPriceAlert);

// GET /medicine-search/test - Debug test page
router.get('/test', (req, res) => {
    res.render('medicine/test', {
        title: 'Medicine Search Test | Healthfy'
    });
});

// GET /medicine-search/debug - Simple JSON debug response
router.get('/debug', (req, res) => {
    console.log('🔍 [DEBUG] Medicine search debug route accessed');
    res.json({
        success: true,
        message: 'Medicine search routes are working!',
        timestamp: new Date().toISOString(),
        routes: [
            'GET /',
            'POST /search',
            'GET /suggestions',
            'GET /trending',
            'GET /debug'
        ]
    });
});

// POST /medicine-search/debug - Simple POST debug
router.post('/debug', (req, res) => {
    console.log('🔍 [DEBUG] POST debug route accessed', req.body);
    res.json({
        success: true,
        message: 'POST debug successful',
        receivedData: req.body,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
