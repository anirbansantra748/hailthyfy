const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Medicine Price Search Service
 * Searches across multiple pharmacy websites for medicine prices
 */

class MedicineSearchService {
    constructor() {
        this.platforms = {
            'Apollo Pharmacy': {
                url: 'https://www.apollopharmacy.in',
                searchEndpoint: '/search-medicines/',
                enabled: true
            },
            '1mg': {
                url: 'https://www.1mg.com',
                searchEndpoint: '/search/all?name=',
                enabled: true
            },
            'Netmeds': {
                url: 'https://www.netmeds.com',
                searchEndpoint: '/products/?q=',
                searchSuffix: '&verticalspecification=Medicine',
                enabled: true
            },
            'PharmEasy': {
                url: 'https://pharmeasy.in',
                searchEndpoint: '/search/all?name=',
                enabled: true
            },
            'Amazon Pharmacy': {
                url: 'https://www.amazon.in',
                searchEndpoint: '/s?k=',
                enabled: true
            },
            'Flipkart Health': {
                url: 'https://www.flipkart.com',
                searchEndpoint: '/search?q=',
                enabled: true
            }
        };
        
        // Common medicine database for suggestions
        this.commonMedicines = [
            'Paracetamol', 'Aspirin', 'Ibuprofen', 'Amoxicillin', 'Metformin',
            'Atorvastatin', 'Lisinopril', 'Levothyroxine', 'Amlodipine', 'Omeprazole',
            'Simvastatin', 'Losartan', 'Azithromycin', 'Hydrochlorothiazide', 'Prednisone',
            'Gabapentin', 'Sertraline', 'Furosemide', 'Trazodone', 'Tramadol',
            'Cephalexin', 'Pantoprazole', 'Ciprofloxacin', 'Clonazepam', 'Lorazepam',
            'Dolo 650', 'Crocin', 'Combiflam', 'Vicks', 'Strepsils'
        ];
    }

    /**
     * Search medicine prices across all platforms
     */
    async searchMedicine(medicineName) {
        console.log(`🔍 [MEDICINE SEARCH] Searching for: ${medicineName}`);
        
        try {
            const searchPromises = [];
            const results = {
                medicineName: medicineName,
                timestamp: new Date().toISOString(),
                platforms: [],
                cheapestOption: null,
                searchDuration: 0
            };
            
            const startTime = Date.now();
            
            // Search across all enabled platforms
            for (const [platformName, config] of Object.entries(this.platforms)) {
                if (config.enabled) {
                    searchPromises.push(
                        this.searchOnPlatform(platformName, config, medicineName)
                            .catch(error => ({
                                platform: platformName,
                                error: error.message,
                                available: false,
                                prices: []
                            }))
                    );
                }
            }
            
            // Wait for all searches to complete (with timeout)
            const platformResults = await Promise.allSettled(searchPromises);
            
            // Process results
            let cheapest = null;
            
            platformResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const platformResult = result.value;
                    results.platforms.push(platformResult);
                    
                    // Find cheapest option across all platforms
                    if (platformResult.available && platformResult.prices.length > 0) {
                        const platformCheapest = platformResult.prices[0]; // Assuming sorted by price
                        if (!cheapest || platformCheapest.price < cheapest.price) {
                            cheapest = {
                                ...platformCheapest,
                                platform: platformResult.platform
                            };
                        }
                    }
                }
            });
            
            results.cheapestOption = cheapest;
            results.searchDuration = Date.now() - startTime;
            
            // Sort platforms by availability and then by cheapest price
            results.platforms.sort((a, b) => {
                if (a.available && !b.available) return -1;
                if (!a.available && b.available) return 1;
                if (a.available && b.available && a.prices.length > 0 && b.prices.length > 0) {
                    return a.prices[0].price - b.prices[0].price;
                }
                return 0;
            });
            
            console.log(`✅ [MEDICINE SEARCH] Search completed in ${results.searchDuration}ms`);
            return results;
            
        } catch (error) {
            console.error('❌ [MEDICINE SEARCH] Search failed:', error);
            throw new Error(`Failed to search medicine: ${error.message}`);
        }
    }

    /**
     * Search on specific platform (Mock implementation)
     * In real implementation, this would use web scraping or APIs
     */
    async searchOnPlatform(platformName, config, medicineName) {
        console.log(`🔍 [${platformName}] Searching for: ${medicineName}`);
        
        try {
            // Simulate API delay
            await this.delay(500 + Math.random() * 1000);
            
            // Mock results based on platform and medicine
            const mockResult = this.generateMockResults(platformName, medicineName);
            
            console.log(`✅ [${platformName}] Found ${mockResult.prices.length} results`);
            return mockResult;
            
        } catch (error) {
            console.error(`❌ [${platformName}] Search failed:`, error);
            return {
                platform: platformName,
                available: false,
                error: error.message,
                prices: []
            };
        }
    }

    /**
     * Generate mock results for demonstration
     * In real implementation, replace with actual web scraping/API calls
     */
    generateMockResults(platformName, medicineName) {
        const basePrice = this.calculateBasePrice(medicineName);
        const platformMultiplier = this.getPlatformMultiplier(platformName);
        const availability = Math.random() > 0.3; // 70% availability rate
        
        if (!availability) {
            return {
                platform: platformName,
                available: false,
                prices: [],
                searchUrl: this.generateSearchUrl(platformName, medicineName),
                lastUpdated: new Date().toISOString()
            };
        }
        
        const numVariants = Math.floor(Math.random() * 3) + 1; // 1-3 variants
        const prices = [];
        
        for (let i = 0; i < numVariants; i++) {
            const variation = 0.8 + Math.random() * 0.4; // ±20% price variation
            const price = Math.round(basePrice * platformMultiplier * variation);
            const discount = Math.floor(Math.random() * 30); // 0-30% discount
            const originalPrice = Math.round(price * (1 + discount / 100));
            
            prices.push({
                name: `${medicineName} - ${this.getRandomVariant()}`,
                price: price,
                originalPrice: originalPrice,
                discount: discount,
                inStock: Math.random() > 0.2, // 80% in stock
                rating: (3.5 + Math.random() * 1.5).toFixed(1),
                reviews: Math.floor(Math.random() * 1000) + 10,
                seller: this.getRandomSeller(platformName),
                deliveryTime: this.getRandomDeliveryTime(),
                productUrl: this.generateSearchUrl(platformName, medicineName)
            });
        }
        
        // Sort by price (cheapest first)
        prices.sort((a, b) => a.price - b.price);
        
        return {
            platform: platformName,
            available: true,
            prices: prices,
            searchUrl: this.generateSearchUrl(platformName, medicineName),
            lastUpdated: new Date().toISOString(),
            totalResults: prices.length
        };
    }

    /**
     * Helper methods
     */
    calculateBasePrice(medicineName) {
        // Simple hash-based pricing for consistency
        let hash = 0;
        for (let i = 0; i < medicineName.length; i++) {
            hash = ((hash << 5) - hash + medicineName.charCodeAt(i)) & 0xffffffff;
        }
        return Math.abs(hash % 200) + 50; // ₹50-₹250 base price range
    }

    getPlatformMultiplier(platformName) {
        const multipliers = {
            'Apollo Pharmacy': 1.1,
            '1mg': 0.95,
            'Netmeds': 1.0,
            'PharmEasy': 0.9,
            'Amazon Pharmacy': 1.05,
            'Flipkart Health': 0.98
        };
        return multipliers[platformName] || 1.0;
    }

    getRandomVariant() {
        const variants = ['Strip of 10 tablets', '30 tablets', 'Bottle of 100ml', '20 capsules', '60ml syrup'];
        return variants[Math.floor(Math.random() * variants.length)];
    }

    getRandomSeller(platformName) {
        const sellers = {
            'Apollo Pharmacy': ['Apollo Pharmacy', 'Apollo Health Store'],
            '1mg': ['Tata 1mg', 'Medlife', 'Generic Medicine Store'],
            'Netmeds': ['Netmeds', 'Reliance Health'],
            'PharmEasy': ['PharmEasy', 'DocsApp'],
            'Amazon Pharmacy': ['Cloudtail India', 'Appario Retail', 'Amazon Pharmacy'],
            'Flipkart Health': ['Flipkart Health+', 'Health & Glow']
        };
        const platformSellers = sellers[platformName] || [platformName];
        return platformSellers[Math.floor(Math.random() * platformSellers.length)];
    }

    getRandomDeliveryTime() {
        const times = ['Same day delivery', '1-2 days', '2-3 days', '3-5 days', 'Express delivery'];
        return times[Math.floor(Math.random() * times.length)];
    }

    generateSearchUrl(platformName, medicineName) {
        const platform = this.platforms[platformName];
        if (!platform) {
            return `#`; // fallback for unknown platforms
        }
        
        const encodedMedicine = encodeURIComponent(medicineName.trim());
        const searchSuffix = platform.searchSuffix || '';
        
        return `${platform.url}${platform.searchEndpoint}${encodedMedicine}${searchSuffix}`;
    }

    /**
     * Get medicine name suggestions for autocomplete
     */
    getMedicineSuggestions(query) {
        if (!query || query.length < 2) return [];
        
        const queryLower = query.toLowerCase();
        return this.commonMedicines
            .filter(medicine => medicine.toLowerCase().includes(queryLower))
            .slice(0, 10)
            .map(medicine => ({
                name: medicine,
                category: this.getMedicineCategory(medicine)
            }));
    }

    getMedicineCategory(medicine) {
        const categories = {
            'Paracetamol': 'Pain Relief',
            'Aspirin': 'Pain Relief',
            'Ibuprofen': 'Pain Relief',
            'Amoxicillin': 'Antibiotic',
            'Metformin': 'Diabetes',
            'Dolo 650': 'Fever & Pain',
            'Crocin': 'Fever & Pain',
            'Combiflam': 'Pain Relief'
        };
        return categories[medicine] || 'Medicine';
    }

    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get trending medicines
     */
    getTrendingMedicines() {
        return [
            { name: 'Paracetamol', searches: 1250, category: 'Pain Relief' },
            { name: 'Dolo 650', searches: 980, category: 'Fever' },
            { name: 'Crocin', searches: 875, category: 'Pain Relief' },
            { name: 'Azithromycin', searches: 650, category: 'Antibiotic' },
            { name: 'Omeprazole', searches: 520, category: 'Acidity' },
            { name: 'Combiflam', searches: 480, category: 'Pain Relief' },
            { name: 'Cetirizine', searches: 420, category: 'Allergy' },
            { name: 'Pantoprazole', searches: 380, category: 'Acidity' }
        ];
    }
}

module.exports = new MedicineSearchService();
