const medicineSearchService = require('../services/medicineSearchService');

/**
 * Medicine Controller
 * Handles medicine search and price comparison requests
 */

class MedicineController {
    
    /**
     * Render main medicine search page
     */
    async renderSearchPage(req, res) {
        try {
            const trendingData = medicineSearchService.getTrendingMedicines();
            // Format the search numbers for display
            const trending = trendingData.map(medicine => ({
                ...medicine,
                searches: medicine.searches.toLocaleString()
            }));
            
            res.render('medicine/search', {
                title: 'Medicine Price Search | Healthfy',
                trending: trending,
                user: req.session.user || null,
                searchQuery: null,
                searchResults: null
            });
        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Error rendering search page:', error);
            res.status(500).render('error', {
                title: 'Error | Healthfy',
                message: 'Failed to load medicine search page',
                error: error
            });
        }
    }

    /**
     * Search medicines across platforms
     * POST /medicine-search/search (API) or POST /medicine-search (form)
     */
    async searchMedicine(req, res) {
        try {
            const { medicineName } = req.body;
            const isApiRequest = req.headers['content-type'] === 'application/json' || req.path.includes('/search');
            
            if (!medicineName || medicineName.trim().length < 2) {
                if (isApiRequest) {
                    return res.status(400).json({
                        success: false,
                        message: 'Medicine name must be at least 2 characters long'
                    });
                } else {
                    // Form submission - redirect to search page with empty results
                    return res.render('medicine/search', {
                        title: 'Medicine Price Search | Healthfy',
                        trending: medicineSearchService.getTrendingMedicines(),
                        user: req.session.user || null,
                        searchQuery: medicineName || '',
                        searchResults: null
                    });
                }
            }

            const searchResults = await medicineSearchService.searchMedicine(medicineName.trim());
            
            if (isApiRequest) {
                // API response
                res.json({
                    success: true,
                    data: searchResults,
                    message: `Found results for ${medicineName}`
                });
            } else {
                // Form submission - render page with results
                res.render('medicine/search', {
                    title: `Search Results: ${medicineName} | Healthfy`,
                    trending: medicineSearchService.getTrendingMedicines().map(m => ({...m, searches: m.searches.toLocaleString()})),
                    user: req.session.user || null,
                    searchQuery: medicineName,
                    searchResults
                });
            }

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Search error:', error);
            
            const isApiRequest = req.headers['content-type'] === 'application/json' || req.path.includes('/search');
            
            if (isApiRequest) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to search medicine prices',
                    error: error.message
                });
            } else {
                // Form submission error - render page with no results
                res.render('medicine/search', {
                    title: 'Medicine Price Search | Healthfy',
                    trending: medicineSearchService.getTrendingMedicines().map(m => ({...m, searches: m.searches.toLocaleString()})),
                    user: req.session.user || null,
                    searchQuery: req.body.medicineName || '',
                    searchResults: null
                });
            }
        }
    }

    /**
     * Get medicine suggestions for autocomplete
     * GET /medicine-search/suggestions?q=query
     */
    async getSuggestions(req, res) {
        try {
            const { q: query } = req.query;
            
            if (!query || query.length < 2) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Query too short'
                });
            }

            const suggestions = medicineSearchService.getMedicineSuggestions(query);
            
            res.json({
                success: true,
                data: suggestions,
                message: `Found ${suggestions.length} suggestions`
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get medicine suggestions',
                error: error.message
            });
        }
    }

    /**
     * Compare specific medicine by ID across platforms
     * GET /medicine-search/compare/:medicineId
     */
    async compareMedicine(req, res) {
        try {
            const { medicineId } = req.params;
            
            // For demo, treat medicineId as medicine name
            // In real app, you'd fetch from database
            const medicineName = medicineId.replace(/-/g, ' ');
            
            const searchResults = await medicineSearchService.searchMedicine(medicineName);
            
            res.render('medicine/compare', {
                title: `Price Comparison - ${medicineName} | Healthfy`,
                medicine: medicineName,
                results: searchResults,
                user: req.session.user || null
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Compare error:', error);
            res.status(500).render('error', {
                title: 'Error | Healthfy',
                message: 'Failed to compare medicine prices',
                error: error
            });
        }
    }

    /**
     * Add medicine to favorites
     * POST /medicine-search/favorites
     */
    async addToFavorites(req, res) {
        try {
            const { medicineName, platform, price } = req.body;
            
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login to add favorites'
                });
            }

            // In real app, save to database
            // For demo, just simulate success
            
            res.json({
                success: true,
                message: `${medicineName} added to favorites`,
                data: {
                    medicineName,
                    platform,
                    price,
                    addedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Add favorites error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add medicine to favorites',
                error: error.message
            });
        }
    }

    /**
     * Get user's favorite medicines
     * GET /medicine-search/favorites
     */
    async getFavorites(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login to view favorites'
                });
            }

            // In real app, fetch from database
            // For demo, return mock favorites
            const favorites = [
                {
                    id: 1,
                    medicineName: 'Paracetamol',
                    platform: 'PharmEasy',
                    price: 85,
                    addedAt: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    medicineName: 'Dolo 650',
                    platform: '1mg',
                    price: 120,
                    addedAt: '2024-01-14T15:45:00Z'
                }
            ];

            res.json({
                success: true,
                data: favorites,
                message: `Found ${favorites.length} favorite medicines`
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Get favorites error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get favorite medicines',
                error: error.message
            });
        }
    }

    /**
     * Remove medicine from favorites
     * DELETE /medicine-search/favorites/:favoriteId
     */
    async removeFromFavorites(req, res) {
        try {
            const { favoriteId } = req.params;
            
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login to manage favorites'
                });
            }

            // In real app, delete from database
            // For demo, just simulate success
            
            res.json({
                success: true,
                message: 'Medicine removed from favorites'
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Remove favorites error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove medicine from favorites',
                error: error.message
            });
        }
    }

    /**
     * Get trending medicines
     * GET /medicine-search/trending
     */
    async getTrending(req, res) {
        try {
            const trending = medicineSearchService.getTrendingMedicines();
            
            res.json({
                success: true,
                data: trending,
                message: `Found ${trending.length} trending medicines`
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Trending error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get trending medicines',
                error: error.message
            });
        }
    }

    /**
     * Get medicine price history (Mock data)
     * GET /medicine-search/price-history/:medicineName
     */
    async getPriceHistory(req, res) {
        try {
            const { medicineName } = req.params;
            
            // Generate mock price history data
            const history = this.generateMockPriceHistory(medicineName);
            
            res.json({
                success: true,
                data: {
                    medicineName,
                    history,
                    period: '30 days'
                },
                message: `Price history for ${medicineName}`
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Price history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get price history',
                error: error.message
            });
        }
    }

    /**
     * Generate mock price history for demo
     */
    generateMockPriceHistory(medicineName) {
        const history = [];
        const basePrice = Math.floor(Math.random() * 200) + 50;
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Add some price variation
            const variation = 0.9 + Math.random() * 0.2; // ±10% variation
            const price = Math.round(basePrice * variation);
            
            history.push({
                date: date.toISOString().split('T')[0],
                price: price,
                platform: ['1mg', 'PharmEasy', 'Apollo Pharmacy', 'Netmeds'][Math.floor(Math.random() * 4)]
            });
        }
        
        return history;
    }

    /**
     * Set price alert for a medicine
     * POST /medicine-search/alert
     */
    async setPriceAlert(req, res) {
        try {
            const { medicineName, targetPrice, email } = req.body;
            
            if (!medicineName || !targetPrice || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine name, target price, and email are required'
                });
            }

            // In real app, save alert to database and set up monitoring
            // For demo, just simulate success
            
            res.json({
                success: true,
                message: `Price alert set for ${medicineName} when price drops below ₹${targetPrice}`,
                data: {
                    medicineName,
                    targetPrice,
                    email,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ [MEDICINE CONTROLLER] Price alert error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to set price alert',
                error: error.message
            });
        }
    }
}

module.exports = new MedicineController();
