/**
 * Advanced Doctor Performance Analytics
 * Features: Peer comparison, specialty benchmarking, patient outcome tracking, professional development insights
 */

class AdvancedDoctorPerformance {
    constructor(container, options = {}) {
        this.container = d3.select(container);
        this.options = {
            width: options.width || 1200,
            height: options.height || 700,
            margin: { top: 60, right: 60, bottom: 60, left: 80 },
            colors: {
                primary: '#10b981',
                secondary: '#3b82f6',
                warning: '#f59e0b',
                danger: '#ef4444',
                success: '#22c55e',
                performance: ['#22c55e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
            },
            performanceThresholds: {
                excellent: 90,
                good: 80,
                average: 70,
                poor: 60
            },
            ...options
        };
        
        this.data = null;
        this.selectedDoctor = null;
        this.comparisonMode = 'all'; // all, specialty, department
        this.activeView = 'overview'; // overview, comparison, trends, outcomes
        
        this.init();
    }
    
    init() {
        this.createSVG();
        this.createTooltip();
        this.createControls();
        this.setupFilters();
    }
    
    createSVG() {
        this.container.selectAll('*').remove();
        
        this.svg = this.container
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('class', 'doctor-performance-svg');
            
        this.mainGroup = this.svg.append('g')
            .attr('transform', `translate(${this.options.margin.left}, ${this.options.margin.top})`);
            
        this.innerWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        this.innerHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
    }
    
    createTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'doctor-performance-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px 16px')
            .style('border-radius', '8px')
            .style('font-size', '14px')
            .style('line-height', '1.4')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.2)')
            .style('max-width', '350px');
    }
    
    createControls() {
        const controlsContainer = this.svg.append('g')
            .attr('class', 'performance-controls')
            .attr('transform', 'translate(20, 10)');
            
        // View selector
        const views = [
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'comparison', label: 'Peer Comparison', icon: '👥' },
            { id: 'trends', label: 'Performance Trends', icon: '📈' },
            { id: 'outcomes', label: 'Patient Outcomes', icon: '🎯' },
            { id: 'development', label: 'Professional Development', icon: '📚' }
        ];
        
        const viewButtons = controlsContainer.selectAll('.view-button')
            .data(views)
            .enter()
            .append('g')
            .attr('class', 'view-button')
            .attr('transform', (d, i) => `translate(${i * 140}, 0)`)
            .style('cursor', 'pointer');
            
        viewButtons.append('rect')
            .attr('width', 135)
            .attr('height', 35)
            .attr('rx', 17)
            .attr('fill', (d, i) => i === 0 ? this.options.colors.primary : '#f9fafb')
            .attr('stroke', this.options.colors.primary)
            .attr('stroke-width', 1);
            
        viewButtons.append('text')
            .attr('x', 67.5)
            .attr('y', 22)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', (d, i) => i === 0 ? 'white' : '#374151')
            .text(d => `${d.icon} ${d.label}`);
            
        viewButtons.on('click', (event, d) => {
            this.switchView(d.id);
            this.updateViewButtons(d.id);
        });
    }
    
    setupFilters() {
        // Create filter panel below controls
        const filtersContainer = this.svg.append('g')
            .attr('class', 'filters-container')
            .attr('transform', 'translate(20, 55)');
            
        // Specialty filter
        const specialtyFilter = filtersContainer.append('g')
            .attr('class', 'specialty-filter');
            
        specialtyFilter.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#374151')
            .text('Specialty:');
            
        // Time period filter
        const timeFilter = filtersContainer.append('g')
            .attr('class', 'time-filter')
            .attr('transform', 'translate(200, 0)');
            
        timeFilter.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#374151')
            .text('Period:');
            
        // Performance metric filter
        const metricFilter = filtersContainer.append('g')
            .attr('class', 'metric-filter')
            .attr('transform', 'translate(400, 0)');
            
        metricFilter.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#374151')
            .text('Metric:');
    }
    
    updateVisualization(data) {
        this.data = this.processData(data);
        this.renderOverview(); // Default view
        this.updateFilters();
    }
    
    processData(rawData) {
        if (!rawData || !rawData.doctors) return null;
        
        // Enhanced doctor data processing
        const processedDoctors = rawData.doctors.map(doctor => ({
            ...doctor,
            performanceScore: this.calculatePerformanceScore(doctor),
            patientOutcomes: this.generatePatientOutcomes(doctor),
            professionalDevelopment: this.generateProfessionalDevelopment(doctor),
            trends: this.generatePerformanceTrends(doctor),
            peerComparison: this.calculatePeerMetrics(doctor, rawData.doctors),
            specialtyBenchmark: this.getSpecialtyBenchmark(doctor.specialty),
            riskFactors: this.identifyRiskFactors(doctor),
            strengths: this.identifyStrengths(doctor),
            improvementAreas: this.identifyImprovementAreas(doctor)
        }));
        
        return {
            ...rawData,
            doctors: processedDoctors,
            specialties: this.extractSpecialties(processedDoctors),
            performanceDistribution: this.calculatePerformanceDistribution(processedDoctors),
            benchmarks: this.calculateBenchmarks(processedDoctors)
        };
    }
    
    calculatePerformanceScore(doctor) {
        // Weighted performance calculation
        const weights = {
            satisfaction: 0.25,
            responseTime: 0.15,
            treatmentSuccess: 0.25,
            patientVolume: 0.10,
            continuousImprovement: 0.15,
            collaboration: 0.10
        };
        
        const metrics = {
            satisfaction: (doctor.rating || 4.0) * 20, // Convert 5-point to 100-point scale
            responseTime: Math.max(0, 100 - (doctor.avgResponseTime || 20) * 2), // Lower is better
            treatmentSuccess: doctor.treatmentSuccessRate || 85,
            patientVolume: Math.min(100, (doctor.consultations || 50) * 1.5),
            continuousImprovement: 75 + Math.random() * 25, // Simulated
            collaboration: 80 + Math.random() * 20 // Simulated
        };
        
        let weightedScore = 0;
        Object.keys(weights).forEach(metric => {
            weightedScore += weights[metric] * metrics[metric];
        });
        
        return {
            overall: Math.round(weightedScore),
            breakdown: metrics,
            category: this.getPerformanceCategory(weightedScore)
        };
    }
    
    getPerformanceCategory(score) {
        if (score >= this.options.performanceThresholds.excellent) return 'excellent';
        if (score >= this.options.performanceThresholds.good) return 'good';
        if (score >= this.options.performanceThresholds.average) return 'average';
        return 'needs-improvement';
    }
    
    generatePatientOutcomes(doctor) {
        return {
            treatmentSuccess: {
                rate: doctor.treatmentSuccessRate || (80 + Math.random() * 15),
                improvement: -2 + Math.random() * 8, // Quarterly change
                benchmark: 82
            },
            patientSatisfaction: {
                current: doctor.rating || (4.0 + Math.random() * 0.8),
                trend: 'stable', // improving, stable, declining
                nps: 65 + Math.random() * 25 // Net Promoter Score
            },
            readmissionRate: {
                rate: 5 + Math.random() * 10,
                benchmark: 8.5,
                trend: 'improving'
            },
            averageStayDuration: {
                days: 3.2 + Math.random() * 2,
                benchmark: 4.1,
                efficiency: 'above-average'
            },
            complications: {
                rate: 2 + Math.random() * 3,
                severity: 'low',
                preventable: 0.8 + Math.random() * 1.2
            }
        };
    }
    
    generateProfessionalDevelopment(doctor) {
        return {
            certifications: {
                current: Math.floor(2 + Math.random() * 4),
                pending: Math.floor(Math.random() * 3),
                expired: Math.floor(Math.random() * 2)
            },
            continuingEducation: {
                hoursCompleted: Math.floor(15 + Math.random() * 35),
                hoursRequired: 40,
                categories: {
                    'Clinical Skills': Math.floor(5 + Math.random() * 15),
                    'Patient Safety': Math.floor(3 + Math.random() * 8),
                    'Technology': Math.floor(2 + Math.random() * 6),
                    'Research': Math.floor(1 + Math.random() * 4)
                }
            },
            researchActivity: {
                publications: Math.floor(Math.random() * 5),
                ongoingStudies: Math.floor(Math.random() * 3),
                presentations: Math.floor(Math.random() * 4)
            },
            mentoring: {
                residents: Math.floor(Math.random() * 4),
                students: Math.floor(Math.random() * 6),
                juniorDoctors: Math.floor(Math.random() * 3)
            },
            goals: this.generateDevelopmentGoals(doctor)
        };
    }
    
    generateDevelopmentGoals(doctor) {
        const goals = [
            'Improve patient communication skills',
            'Reduce diagnostic error rate',
            'Enhance surgical technique',
            'Develop leadership capabilities',
            'Publish research findings',
            'Obtain board certification',
            'Implement new treatment protocols',
            'Mentor junior staff effectively'
        ];
        
        return goals.slice(0, 3 + Math.floor(Math.random() * 3)).map(goal => ({
            goal,
            progress: Math.floor(Math.random() * 100),
            deadline: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
            priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
        }));
    }
    
    generatePerformanceTrends(doctor) {
        const months = 12;
        const baseScore = doctor.performanceScore?.overall || 85;
        const trend = [];
        
        for (let i = months; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const variation = (Math.random() - 0.5) * 10;
            const score = Math.max(60, Math.min(100, baseScore + variation));
            
            trend.push({
                date: date.toISOString(),
                overallScore: score,
                satisfaction: 4.0 + Math.random() * 1,
                efficiency: 70 + Math.random() * 30,
                quality: 80 + Math.random() * 20,
                collaboration: 75 + Math.random() * 25
            });
        }
        
        return trend;
    }
    
    calculatePeerMetrics(doctor, allDoctors) {
        const sameDepartmentDoctors = allDoctors.filter(d => 
            d.department === doctor.department && d.id !== doctor.id
        );
        
        const sameSpecialtyDoctors = allDoctors.filter(d => 
            d.specialty === doctor.specialty && d.id !== doctor.id
        );
        
        return {
            departmentRanking: this.calculateRanking(doctor, sameDepartmentDoctors),
            specialtyRanking: this.calculateRanking(doctor, sameSpecialtyDoctors),
            overallRanking: this.calculateRanking(doctor, allDoctors.filter(d => d.id !== doctor.id)),
            percentile: this.calculatePercentile(doctor, allDoctors)
        };
    }
    
    calculateRanking(doctor, peers) {
        const doctorScore = doctor.rating || 4.0;
        const betterPeers = peers.filter(p => (p.rating || 4.0) > doctorScore).length;
        return betterPeers + 1;
    }
    
    calculatePercentile(doctor, allDoctors) {
        const doctorScore = doctor.rating || 4.0;
        const lowerPerformers = allDoctors.filter(d => (d.rating || 4.0) < doctorScore).length;
        return Math.round((lowerPerformers / allDoctors.length) * 100);
    }
    
    getSpecialtyBenchmark(specialty) {
        // Industry benchmarks by specialty
        const benchmarks = {
            'Cardiology': { satisfaction: 4.6, efficiency: 85, outcomes: 92 },
            'Internal Medicine': { satisfaction: 4.4, efficiency: 88, outcomes: 89 },
            'Pediatrics': { satisfaction: 4.7, efficiency: 82, outcomes: 94 },
            'Orthopedics': { satisfaction: 4.3, efficiency: 86, outcomes: 91 },
            'Dermatology': { satisfaction: 4.5, efficiency: 90, outcomes: 88 }
        };
        
        return benchmarks[specialty] || { satisfaction: 4.4, efficiency: 86, outcomes: 90 };
    }
    
    identifyRiskFactors(doctor) {
        const risks = [];
        
        if (doctor.rating < 4.2) {
            risks.push({
                type: 'Patient Satisfaction',
                severity: 'medium',
                description: 'Below average patient satisfaction ratings',
                recommendation: 'Focus on communication and bedside manner training'
            });
        }
        
        if ((doctor.consultations || 50) > 150) {
            risks.push({
                type: 'Workload',
                severity: 'high',
                description: 'High patient volume may impact quality of care',
                recommendation: 'Consider workload redistribution and efficiency improvements'
            });
        }
        
        return risks;
    }
    
    identifyStrengths(doctor) {
        const strengths = [];
        
        if (doctor.rating >= 4.6) {
            strengths.push({
                area: 'Patient Satisfaction',
                description: 'Consistently high patient satisfaction scores',
                impact: 'Positive patient experience and loyalty'
            });
        }
        
        if ((doctor.consultations || 50) > 100) {
            strengths.push({
                area: 'Productivity',
                description: 'High patient volume with maintained quality',
                impact: 'Efficient use of healthcare resources'
            });
        }
        
        return strengths;
    }
    
    identifyImprovementAreas(doctor) {
        const areas = [];
        
        if (doctor.rating < 4.4) {
            areas.push({
                area: 'Patient Communication',
                priority: 'high',
                actionItems: [
                    'Attend communication skills workshop',
                    'Practice active listening techniques',
                    'Implement patient feedback review process'
                ],
                timeframe: '3 months'
            });
        }
        
        return areas;
    }
    
    extractSpecialties(doctors) {
        return [...new Set(doctors.map(d => d.specialty))];
    }
    
    calculatePerformanceDistribution(doctors) {
        const distribution = {
            excellent: 0,
            good: 0,
            average: 0,
            'needs-improvement': 0
        };
        
        doctors.forEach(doctor => {
            const category = doctor.performanceScore.category;
            distribution[category]++;
        });
        
        return distribution;
    }
    
    calculateBenchmarks(doctors) {
        const metrics = ['satisfaction', 'efficiency', 'outcomes'];
        const benchmarks = {};
        
        metrics.forEach(metric => {
            const values = doctors.map(d => {
                switch(metric) {
                    case 'satisfaction':
                        return (d.rating || 4.0) * 20;
                    case 'efficiency':
                        return Math.max(0, 100 - (d.avgResponseTime || 20) * 2);
                    case 'outcomes':
                        return d.treatmentSuccessRate || 85;
                }
            });
            
            benchmarks[metric] = {
                mean: values.reduce((a, b) => a + b, 0) / values.length,
                median: this.calculateMedian(values),
                percentile75: this.calculatePercentile75(values),
                percentile90: this.calculatePercentile90(values)
            };
        });
        
        return benchmarks;
    }
    
    calculateMedian(values) {
        const sorted = values.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    calculatePercentile75(values) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * 0.75) - 1;
        return sorted[index];
    }
    
    calculatePercentile90(values) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * 0.90) - 1;
        return sorted[index];
    }
    
    switchView(viewId) {
        this.activeView = viewId;
        this.clearVisualization();
        
        switch (viewId) {
            case 'overview':
                this.renderOverview();
                break;
            case 'comparison':
                this.renderComparison();
                break;
            case 'trends':
                this.renderTrends();
                break;
            case 'outcomes':
                this.renderOutcomes();
                break;
            case 'development':
                this.renderDevelopment();
                break;
        }
    }
    
    updateViewButtons(activeId) {
        this.svg.selectAll('.view-button rect')
            .attr('fill', d => d.id === activeId ? this.options.colors.primary : '#f9fafb');
            
        this.svg.selectAll('.view-button text')
            .style('fill', d => d.id === activeId ? 'white' : '#374151');
    }
    
    clearVisualization() {
        this.mainGroup.selectAll('.visualization-content').remove();
    }
    
    renderOverview() {
        if (!this.data) return;
        
        const overviewGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content overview-content');
            
        // Performance distribution chart
        this.renderPerformanceDistribution(overviewGroup);
        
        // Top performers
        this.renderTopPerformers(overviewGroup);
        
        // Performance metrics radar
        this.renderPerformanceRadar(overviewGroup);
        
        // Key insights
        this.renderKeyInsights(overviewGroup);
    }
    
    renderPerformanceDistribution(container) {
        const chartGroup = container.append('g')
            .attr('class', 'performance-distribution')
            .attr('transform', 'translate(0, 0)');
            
        const data = Object.entries(this.data.performanceDistribution)
            .map(([category, count]) => ({ category, count }));
            
        const radius = Math.min(150, this.innerWidth / 6);
        const centerX = radius + 20;
        const centerY = radius + 20;
        
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);
            
        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);
            
        const colorScale = d3.scaleOrdinal()
            .domain(['excellent', 'good', 'average', 'needs-improvement'])
            .range([this.options.colors.success, this.options.colors.primary, this.options.colors.warning, this.options.colors.danger]);
        
        const pieData = pie(data);
        
        const arcs = chartGroup.selectAll('.arc')
            .data(pieData)
            .enter()
            .append('g')
            .attr('class', 'arc')
            .attr('transform', `translate(${centerX}, ${centerY})`);
            
        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.category))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .on('mouseenter', (event, d) => {
                this.showDistributionTooltip(event, d.data);
            })
            .on('mouseleave', () => this.hideTooltip())
            .on('mousemove', event => this.moveTooltip(event));
            
        // Add labels
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(d => d.data.count);
            
        // Add title
        chartGroup.append('text')
            .attr('x', centerX)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Performance Distribution');
            
        // Add legend
        const legend = chartGroup.selectAll('.legend-item')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(${centerX + radius + 40}, ${i * 25})`);
            
        legend.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => colorScale(d.category));
            
        legend.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .style('font-size', '12px')
            .style('fill', '#374151')
            .text(d => `${d.category} (${d.count})`);
    }
    
    renderTopPerformers(container) {
        const topPerformersGroup = container.append('g')
            .attr('class', 'top-performers')
            .attr('transform', `translate(${this.innerWidth / 2}, 0)`);
            
        const topDoctors = this.data.doctors
            .sort((a, b) => b.performanceScore.overall - a.performanceScore.overall)
            .slice(0, 5);
            
        // Title
        topPerformersGroup.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'start')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Top Performers');
            
        const performerHeight = 40;
        const performers = topPerformersGroup.selectAll('.performer')
            .data(topDoctors)
            .enter()
            .append('g')
            .attr('class', 'performer')
            .attr('transform', (d, i) => `translate(0, ${i * performerHeight + 20})`);
            
        // Performance bars
        const maxWidth = 250;
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, maxWidth]);
            
        performers.append('rect')
            .attr('width', maxWidth)
            .attr('height', 30)
            .attr('fill', '#f3f4f6')
            .attr('rx', 15);
            
        performers.append('rect')
            .attr('width', d => xScale(d.performanceScore.overall))
            .attr('height', 30)
            .attr('fill', d => {
                const category = d.performanceScore.category;
                switch(category) {
                    case 'excellent': return this.options.colors.success;
                    case 'good': return this.options.colors.primary;
                    case 'average': return this.options.colors.warning;
                    default: return this.options.colors.danger;
                }
            })
            .attr('rx', 15);
            
        // Doctor names
        performers.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(d => d.name);
            
        // Scores
        performers.append('text')
            .attr('x', maxWidth - 10)
            .attr('y', 20)
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text(d => `${d.performanceScore.overall}%`);
            
        // Specialty labels
        performers.append('text')
            .attr('x', 10)
            .attr('y', 45)
            .style('font-size', '10px')
            .style('fill', '#6b7280')
            .text(d => d.specialty);
    }
    
    renderPerformanceRadar(container) {
        const radarGroup = container.append('g')
            .attr('class', 'performance-radar')
            .attr('transform', `translate(50, ${this.innerHeight / 2})`);
            
        if (!this.data.doctors.length) return;
        
        // Calculate average metrics
        const avgMetrics = this.calculateAverageMetrics();
        
        const radarData = [
            { axis: 'Satisfaction', value: avgMetrics.satisfaction, fullMark: 100 },
            { axis: 'Efficiency', value: avgMetrics.efficiency, fullMark: 100 },
            { axis: 'Quality', value: avgMetrics.quality, fullMark: 100 },
            { axis: 'Collaboration', value: avgMetrics.collaboration, fullMark: 100 },
            { axis: 'Innovation', value: avgMetrics.innovation, fullMark: 100 }
        ];
        
        this.renderRadarChart(radarGroup, radarData, 120);
    }
    
    calculateAverageMetrics() {
        const doctors = this.data.doctors;
        const metrics = {
            satisfaction: doctors.reduce((sum, d) => sum + ((d.rating || 4.0) * 20), 0) / doctors.length,
            efficiency: doctors.reduce((sum, d) => sum + Math.max(0, 100 - (d.avgResponseTime || 20) * 2), 0) / doctors.length,
            quality: doctors.reduce((sum, d) => sum + (d.treatmentSuccessRate || 85), 0) / doctors.length,
            collaboration: doctors.reduce((sum, d) => sum + (75 + Math.random() * 25), 0) / doctors.length,
            innovation: doctors.reduce((sum, d) => sum + (70 + Math.random() * 30), 0) / doctors.length
        };
        
        return metrics;
    }
    
    renderRadarChart(container, data, radius) {
        const angleSlice = Math.PI * 2 / data.length;
        
        // Create scales
        const rScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, radius]);
        
        // Draw background circles
        const levels = 5;
        for (let level = 1; level <= levels; level++) {
            container.append('circle')
                .attr('r', radius * level / levels)
                .attr('fill', 'none')
                .attr('stroke', '#e5e7eb')
                .attr('stroke-width', 1);
        }
        
        // Draw axes
        data.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const lineX = Math.cos(angle) * radius;
            const lineY = Math.sin(angle) * radius;
            
            container.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', lineX)
                .attr('y2', lineY)
                .attr('stroke', '#d1d5db')
                .attr('stroke-width', 1);
                
            // Add labels
            const labelX = Math.cos(angle) * (radius + 20);
            const labelY = Math.sin(angle) * (radius + 20);
            
            container.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', '#374151')
                .text(d.axis);
        });
        
        // Draw data area
        const line = d3.line()
            .x((d, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                return Math.cos(angle) * rScale(d.value);
            })
            .y((d, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                return Math.sin(angle) * rScale(d.value);
            })
            .curve(d3.curveLinearClosed);
            
        container.append('path')
            .datum(data)
            .attr('d', line)
            .attr('fill', this.options.colors.primary)
            .attr('fill-opacity', 0.3)
            .attr('stroke', this.options.colors.primary)
            .attr('stroke-width', 2);
            
        // Add data points
        data.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * rScale(d.value);
            const y = Math.sin(angle) * rScale(d.value);
            
            container.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 4)
                .attr('fill', this.options.colors.primary)
                .attr('stroke', 'white')
                .attr('stroke-width', 2);
        });
        
        // Add title
        container.append('text')
            .attr('x', 0)
            .attr('y', -radius - 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Average Performance Metrics');
    }
    
    renderKeyInsights(container) {
        const insightsGroup = container.append('g')
            .attr('class', 'key-insights')
            .attr('transform', `translate(${this.innerWidth / 2 + 300}, 20)`);
            
        const insights = this.generateKeyInsights();
        
        // Title
        insightsGroup.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Key Insights');
            
        insights.forEach((insight, i) => {
            const insightGroup = insightsGroup.append('g')
                .attr('transform', `translate(0, ${i * 60 + 30})`);
                
            insightGroup.append('rect')
                .attr('width', 250)
                .attr('height', 50)
                .attr('rx', 8)
                .attr('fill', '#f9fafb')
                .attr('stroke', '#e5e7eb');
                
            insightGroup.append('text')
                .attr('x', 10)
                .attr('y', 18)
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', insight.color)
                .text(insight.title);
                
            insightGroup.append('text')
                .attr('x', 10)
                .attr('y', 35)
                .style('font-size', '10px')
                .style('fill', '#6b7280')
                .text(insight.description);
        });
    }
    
    generateKeyInsights() {
        const insights = [];
        
        if (this.data.doctors.length > 0) {
            const topPerformer = this.data.doctors
                .sort((a, b) => b.performanceScore.overall - a.performanceScore.overall)[0];
                
            insights.push({
                title: `Top Performer: ${topPerformer.name}`,
                description: `${topPerformer.specialty} - ${topPerformer.performanceScore.overall}% score`,
                color: this.options.colors.success
            });
        }
        
        const excellentPerformers = this.data.performanceDistribution.excellent;
        if (excellentPerformers > 0) {
            insights.push({
                title: `${excellentPerformers} Excellent Performers`,
                description: 'Doctors exceeding performance benchmarks',
                color: this.options.colors.primary
            });
        }
        
        const needsImprovement = this.data.performanceDistribution['needs-improvement'];
        if (needsImprovement > 0) {
            insights.push({
                title: `${needsImprovement} Need Support`,
                description: 'Doctors requiring performance improvement',
                color: this.options.colors.warning
            });
        }
        
        return insights;
    }
    
    // Comparison view
    renderComparison() {
        const comparisonGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content comparison-content');
            
        // Scatter plot showing performance vs satisfaction
        this.renderPerformanceScatter(comparisonGroup);
        
        // Benchmark comparison
        this.renderBenchmarkComparison(comparisonGroup);
    }
    
    renderPerformanceScatter(container) {
        const chartGroup = container.append('g')
            .attr('class', 'performance-scatter')
            .attr('transform', 'translate(60, 60)');
            
        const chartWidth = this.innerWidth - 120;
        const chartHeight = this.innerHeight - 150;
        
        // Scales
        const xScale = d3.scaleLinear()
            .domain([3.5, 5.0])
            .range([0, chartWidth]);
            
        const yScale = d3.scaleLinear()
            .domain([60, 100])
            .range([chartHeight, 0]);
            
        const sizeScale = d3.scaleLinear()
            .domain(d3.extent(this.data.doctors, d => d.consultations || 50))
            .range([5, 15]);
        
        // Axes
        chartGroup.append('g')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xScale));
            
        chartGroup.append('g')
            .call(d3.axisLeft(yScale));
            
        // Axis labels
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', chartHeight + 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#374151')
            .text('Patient Satisfaction Rating');
            
        chartGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -chartHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#374151')
            .text('Performance Score');
        
        // Data points
        chartGroup.selectAll('.doctor-point')
            .data(this.data.doctors)
            .enter()
            .append('circle')
            .attr('class', 'doctor-point')
            .attr('cx', d => xScale(d.rating || 4.0))
            .attr('cy', d => yScale(d.performanceScore.overall))
            .attr('r', d => sizeScale(d.consultations || 50))
            .attr('fill', d => {
                switch(d.performanceScore.category) {
                    case 'excellent': return this.options.colors.success;
                    case 'good': return this.options.colors.primary;
                    case 'average': return this.options.colors.warning;
                    default: return this.options.colors.danger;
                }
            })
            .attr('opacity', 0.7)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .on('mouseenter', (event, d) => this.showDoctorTooltip(event, d))
            .on('mouseleave', () => this.hideTooltip())
            .on('mousemove', event => this.moveTooltip(event));
        
        // Add title
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Performance vs Patient Satisfaction');
    }
    
    // Tooltip methods
    showDistributionTooltip(event, data) {
        const content = `
            <div class="tooltip-header">
                <strong>${data.category.replace('-', ' ').toUpperCase()}</strong>
            </div>
            <div class="tooltip-content">
                <div>Count: ${data.count} doctors</div>
                <div>Percentage: ${((data.count / this.data.doctors.length) * 100).toFixed(1)}%</div>
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(content);
            
        this.moveTooltip(event);
    }
    
    showDoctorTooltip(event, doctor) {
        const content = `
            <div class="tooltip-header">
                <strong>${doctor.name}</strong>
            </div>
            <div class="tooltip-content">
                <div>Specialty: ${doctor.specialty}</div>
                <div>Performance Score: ${doctor.performanceScore.overall}%</div>
                <div>Patient Satisfaction: ${(doctor.rating || 4.0).toFixed(1)}/5.0</div>
                <div>Consultations: ${doctor.consultations || 'N/A'}</div>
                <div>Category: ${doctor.performanceScore.category.replace('-', ' ')}</div>
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(content);
            
        this.moveTooltip(event);
    }
    
    moveTooltip(event) {
        this.tooltip
            .style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip.style('visibility', 'hidden');
    }
    
    updateFilters() {
        // Update filter dropdowns with current data
        if (!this.data) return;
        
        const specialties = this.data.specialties;
        // Implementation would add actual dropdown options
    }
    
    // Export functionality
    exportPerformanceReport(doctorId = null) {
        const reportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalDoctors: this.data.doctors.length,
                performanceDistribution: this.data.performanceDistribution,
                averagePerformance: this.calculateAverageMetrics()
            },
            doctors: doctorId ? 
                [this.data.doctors.find(d => d.id === doctorId)] : 
                this.data.doctors,
            benchmarks: this.data.benchmarks,
            insights: this.generateKeyInsights()
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `doctor-performance-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Cleanup
    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.container.selectAll('*').remove();
    }
}

// Export for global use
window.AdvancedDoctorPerformance = AdvancedDoctorPerformance;