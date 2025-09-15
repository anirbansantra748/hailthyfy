// Medicine Search Controller
// Handles server-side medicine search with mock data generation

const medicineSearchController = {
    // GET /medicine-search - Show search page
    showSearchPage: async (req, res) => {
        try {
            const trending = [
                { name: 'Paracetamol', searches: '12,543', category: 'Pain Relief' },
                { name: 'Dolo 650', searches: '9,821', category: 'Fever & Pain' },
                { name: 'Crocin', searches: '8,765', category: 'Fever & Pain' },
                { name: 'Azithromycin', searches: '7,432', category: 'Antibiotic' },
                { name: 'Amoxicillin', searches: '6,987', category: 'Antibiotic' },
                { name: 'Combiflam', searches: '6,543', category: 'Pain Relief' },
                { name: 'Cetirizine', searches: '5,876', category: 'Allergy' },
                { name: 'Pantoprazole', searches: '5,234', category: 'Acidity' }
            ];

            res.render('medicine/search', { 
                trending,
                searchQuery: null,
                searchResults: null
            });
        } catch (error) {
            console.error('Error showing search page:', error);
            res.status(500).render('error', { message: 'Unable to load search page' });
        }
    },

    // POST /medicine-search - Handle form submission
    searchMedicine: async (req, res) => {
        try {
            const { medicineName } = req.body;
            
            if (!medicineName || medicineName.length < 2) {
                return res.render('medicine/search', { 
                    trending: await getTrendingMedicines(),
                    searchQuery: medicineName || '',
                    searchResults: null
                });
            }

            // Generate mock search results (this would be replaced with real API calls)
            const searchResults = generateMockSearchResults(medicineName.trim());
            
            res.render('medicine/search', { 
                trending: await getTrendingMedicines(),
                searchQuery: medicineName,
                searchResults
            });
        } catch (error) {
            console.error('Error searching medicine:', error);
            res.render('medicine/search', { 
                trending: await getTrendingMedicines(),
                searchQuery: req.body.medicineName || '',
                searchResults: null
            });
        }
    },

    // GET /medicine-search/suggestions - Auto-complete suggestions (fallback API)
    getSuggestions: async (req, res) => {
        try {
            const query = req.query.q;
            if (!query || query.length < 2) {
                return res.json({ success: false, data: [] });
            }

            const suggestions = generateMockSuggestions(query);
            res.json({ success: true, data: suggestions });
        } catch (error) {
            console.error('Error getting suggestions:', error);
            res.json({ success: false, data: [] });
        }
    }
};

// Helper function to get trending medicines
async function getTrendingMedicines() {
    return [
        { name: 'Paracetamol', searches: '12,543', category: 'Pain Relief' },
        { name: 'Dolo 650', searches: '9,821', category: 'Fever & Pain' },
        { name: 'Crocin', searches: '8,765', category: 'Fever & Pain' },
        { name: 'Azithromycin', searches: '7,432', category: 'Antibiotic' },
        { name: 'Amoxicillin', searches: '6,987', category: 'Antibiotic' },
        { name: 'Combiflam', searches: '6,543', category: 'Pain Relief' },
        { name: 'Cetirizine', searches: '5,876', category: 'Allergy' },
        { name: 'Pantoprazole', searches: '5,234', category: 'Acidity' }
    ];
}

// Generate mock search results
function generateMockSearchResults(medicineName) {
    console.log('🧪 [MOCK DATA] Generating server-side mock search results for:', medicineName);
    
    const platforms = [
        {
            name: 'Apollo Pharmacy',
            url: 'https://www.apollopharmacy.in',
            searchEndpoint: '/search-medicines/',
            multiplier: 1.1
        },
        {
            name: '1mg',
            url: 'https://www.1mg.com',
            searchEndpoint: '/search/all?name=',
            multiplier: 0.95
        },
        {
            name: 'Netmeds',
            url: 'https://www.netmeds.com',
            searchEndpoint: '/products/?q=',
            searchSuffix: '&verticalspecification=Medicine',
            multiplier: 1.0
        },
        {
            name: 'PharmEasy',
            url: 'https://pharmeasy.in',
            searchEndpoint: '/search/all?name=',
            multiplier: 0.9
        },
        {
            name: 'Amazon Pharmacy',
            url: 'https://www.amazon.in',
            searchEndpoint: '/s?k=',
            multiplier: 1.05
        },
        {
            name: 'Flipkart Health',
            url: 'https://www.flipkart.com',
            searchEndpoint: '/search?q=',
            multiplier: 0.98
        }
    ];

    const basePrice = calculateBasePrice(medicineName);
    const searchResults = {
        medicineName: medicineName,
        timestamp: new Date().toISOString(),
        platforms: [],
        cheapestOption: null,
        searchDuration: 850 + Math.floor(Math.random() * 300)
    };

    let cheapest = null;

    platforms.forEach(platform => {
        const availability = Math.random() > 0.25; // 75% availability rate
        const platformResult = {
            platform: platform.name,
            available: availability,
            prices: [],
            searchUrl: generateSearchUrl(platform, medicineName),
            lastUpdated: new Date().toISOString()
        };

        if (availability) {
            const numVariants = Math.floor(Math.random() * 3) + 1; // 1-3 variants
            
            for (let i = 0; i < numVariants; i++) {
                const variation = 0.8 + Math.random() * 0.4; // ±20% price variation
                const price = Math.round(basePrice * platform.multiplier * variation);
                const discount = Math.floor(Math.random() * 30); // 0-30% discount
                const originalPrice = discount > 0 ? Math.round(price * (1 + discount / 100)) : price;
                
                const product = {
                    name: `${medicineName} - ${getRandomVariant()}`,
                    price: price,
                    originalPrice: originalPrice,
                    discount: discount,
                    inStock: Math.random() > 0.2, // 80% in stock
                    rating: (3.5 + Math.random() * 1.5).toFixed(1),
                    reviews: Math.floor(Math.random() * 1000) + 10,
                    seller: getRandomSeller(platform.name),
                    deliveryTime: getRandomDeliveryTime(),
                    productUrl: generateSearchUrl(platform, medicineName)
                };
                
                platformResult.prices.push(product);
                
                // Track cheapest option
                if (!cheapest || product.price < cheapest.price) {
                    cheapest = {
                        ...product,
                        platform: platform.name
                    };
                }
            }
            
            // Sort prices by price (cheapest first)
            platformResult.prices.sort((a, b) => a.price - b.price);
            platformResult.totalResults = platformResult.prices.length;
        } else {
            platformResult.error = Math.random() > 0.5 ? 
                'Medicine not available on this platform' : 
                'Temporarily out of stock';
        }

        searchResults.platforms.push(platformResult);
    });

    searchResults.cheapestOption = cheapest;
    
    // Sort platforms by availability and then by cheapest price
    searchResults.platforms.sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        if (a.available && b.available && a.prices.length > 0 && b.prices.length > 0) {
            return a.prices[0].price - b.prices[0].price;
        }
        return 0;
    });

    console.log('🧪 [MOCK DATA] Generated server-side results for:', medicineName);
    return searchResults;
}

// Generate mock suggestions
function generateMockSuggestions(query) {
    const commonMedicines = [
        { name: 'Paracetamol', category: 'Pain Relief' },
        { name: 'Aspirin', category: 'Pain Relief' },
        { name: 'Ibuprofen', category: 'Pain Relief' },
        { name: 'Amoxicillin', category: 'Antibiotic' },
        { name: 'Metformin', category: 'Diabetes' },
        { name: 'Atorvastatin', category: 'Cholesterol' },
        { name: 'Lisinopril', category: 'Blood Pressure' },
        { name: 'Levothyroxine', category: 'Thyroid' },
        { name: 'Amlodipine', category: 'Blood Pressure' },
        { name: 'Omeprazole', category: 'Acidity' },
        { name: 'Dolo 650', category: 'Fever & Pain' },
        { name: 'Crocin', category: 'Fever & Pain' },
        { name: 'Combiflam', category: 'Pain Relief' },
        { name: 'Azithromycin', category: 'Antibiotic' },
        { name: 'Pantoprazole', category: 'Acidity' },
        { name: 'Cetirizine', category: 'Allergy' },
        { name: 'Vicks', category: 'Cold & Cough' },
        { name: 'Strepsils', category: 'Throat' }
    ];

    const queryLower = query.toLowerCase();
    return commonMedicines
        .filter(medicine => medicine.name.toLowerCase().includes(queryLower))
        .slice(0, 8); // Limit to 8 suggestions
}

// Helper function to generate search URLs
function generateSearchUrl(platform, medicineName) {
    const encodedMedicine = encodeURIComponent(medicineName.trim());
    const searchSuffix = platform.searchSuffix || '';
    return `${platform.url}${platform.searchEndpoint}${encodedMedicine}${searchSuffix}`;
}

// Utility functions for mock data generation
function calculateBasePrice(medicineName) {
    // Simple hash-based pricing for consistency
    let hash = 0;
    for (let i = 0; i < medicineName.length; i++) {
        hash = ((hash << 5) - hash + medicineName.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash % 200) + 50; // ₹50-₹250 base price range
}

function getRandomVariant() {
    const variants = [
        'Strip of 10 tablets', 
        '30 tablets', 
        'Bottle of 100ml', 
        '20 capsules', 
        '60ml syrup',
        'Strip of 15 tablets',
        'Bottle of 200ml',
        '10 capsules'
    ];
    return variants[Math.floor(Math.random() * variants.length)];
}

function getRandomSeller(platformName) {
    const sellers = {
        'Apollo Pharmacy': ['Apollo Pharmacy', 'Apollo Health Store', 'Apollo Direct'],
        '1mg': ['Tata 1mg', 'Medlife', 'Generic Medicine Store'],
        'Netmeds': ['Netmeds', 'Reliance Health', 'Netmeds Plus'],
        'PharmEasy': ['PharmEasy', 'DocsApp', 'PharmEasy Plus'],
        'Amazon Pharmacy': ['Cloudtail India', 'Appario Retail', 'Amazon Pharmacy'],
        'Flipkart Health': ['Flipkart Health+', 'Health & Glow', 'Flipkart Healthcare']
    };
    const platformSellers = sellers[platformName] || [platformName];
    return platformSellers[Math.floor(Math.random() * platformSellers.length)];
}

function getRandomDeliveryTime() {
    const times = [
        'Same day delivery', 
        '1-2 days', 
        '2-3 days', 
        '3-5 days', 
        'Express delivery',
        'Next day delivery',
        'Free delivery in 2-3 days'
    ];
    return times[Math.floor(Math.random() * times.length)];
}

module.exports = medicineSearchController;
