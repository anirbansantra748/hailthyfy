/**
 * Advanced Medical Trends Analysis
 * Features: Correlation analysis, seasonal trend detection, outbreak monitoring, treatment effectiveness tracking
 */

class AdvancedMedicalTrends {
    constructor(container, options = {}) {
        this.container = d3.select(container);
        this.options = {
            width: options.width || 1200,
            height: options.height || 600,
            margin: { top: 40, right: 60, bottom: 60, left: 80 },
            colors: {
                primary: '#10b981',
                secondary: '#3b82f6',
                warning: '#f59e0b',
                danger: '#ef4444',
                success: '#22c55e',
                trends: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
            },
            ...options
        };
        
        this.svg = null;
        this.data = null;
        this.scales = {};
        this.axes = {};
        this.correlationMatrix = null;
        this.seasonalPatterns = null;
        this.outbreakDetector = null;
        
        this.init();
    }
    
    init() {
        this.createSVG();
        this.setupScales();
        this.createTooltip();
        this.createControls();
    }
    
    createSVG() {
        this.container.selectAll('*').remove();
        
        this.svg = this.container
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('class', 'medical-trends-svg');
            
        this.mainGroup = this.svg.append('g')
            .attr('transform', `translate(${this.options.margin.left}, ${this.options.margin.top})`);
            
        this.innerWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        this.innerHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
    }
    
    setupScales() {
        this.scales = {
            x: d3.scaleTime()
                .range([0, this.innerWidth]),
            y: d3.scaleLinear()
                .range([this.innerHeight, 0]),
            color: d3.scaleOrdinal()
                .range(this.options.colors.trends)
        };
    }
    
    createTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'medical-trends-tooltip')
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
            .style('max-width', '320px');
    }
    
    createControls() {
        const controlsContainer = this.svg.append('g')
            .attr('class', 'trends-controls')
            .attr('transform', `translate(${this.options.margin.left}, 10)`);
            
        // Analysis type selector
        const analysisTypes = [
            { id: 'trends', label: 'Trend Analysis', icon: '📈' },
            { id: 'correlation', label: 'Correlation Matrix', icon: '🔗' },
            { id: 'seasonal', label: 'Seasonal Patterns', icon: '📅' },
            { id: 'outbreak', label: 'Outbreak Detection', icon: '⚠️' },
            { id: 'effectiveness', label: 'Treatment Effectiveness', icon: '💊' }
        ];
        
        const buttonGroup = controlsContainer.selectAll('.analysis-button')
            .data(analysisTypes)
            .enter()
            .append('g')
            .attr('class', 'analysis-button')
            .attr('transform', (d, i) => `translate(${i * 140}, 0)`)
            .style('cursor', 'pointer');
            
        buttonGroup.append('rect')
            .attr('width', 130)
            .attr('height', 30)
            .attr('rx', 15)
            .attr('fill', (d, i) => i === 0 ? this.options.colors.primary : '#f3f4f6')
            .attr('stroke', this.options.colors.primary)
            .attr('stroke-width', 1);
            
        buttonGroup.append('text')
            .attr('x', 65)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', (d, i) => i === 0 ? 'white' : '#374151')
            .text(d => `${d.icon} ${d.label}`);
            
        // Button click handlers
        buttonGroup.on('click', (event, d) => {
            this.switchAnalysisType(d.id);
            this.updateButtonStates(d.id);
        });
    }
    
    updateButtonStates(activeId) {
        this.svg.selectAll('.analysis-button rect')
            .attr('fill', (d) => d.id === activeId ? this.options.colors.primary : '#f3f4f6');
            
        this.svg.selectAll('.analysis-button text')
            .style('fill', (d) => d.id === activeId ? 'white' : '#374151');
    }
    
    updateVisualization(data) {
        this.data = data;
        this.processData();
        this.renderTrendAnalysis(); // Default view
    }
    
    processData() {
        if (!this.data) return;
        
        // Process consultation trends
        this.processedData = {
            consultationTrends: this.data.consultationTrends || [],
            conditionTrends: this.data.conditionTrends || {},
            treatmentEffectiveness: this.data.treatmentEffectiveness || {},
            medicationTrends: this.data.medicationTrends || {}
        };
        
        // Calculate correlations
        this.calculateCorrelations();
        
        // Detect seasonal patterns
        this.detectSeasonalPatterns();
        
        // Outbreak detection
        this.detectOutbreaks();
    }
    
    calculateCorrelations() {
        const conditions = Object.keys(this.processedData.conditionTrends);
        this.correlationMatrix = [];
        
        conditions.forEach((condition1, i) => {
            const row = [];
            conditions.forEach((condition2, j) => {
                if (i === j) {
                    row.push(1);
                } else {
                    const correlation = this.calculatePearsonCorrelation(
                        this.processedData.conditionTrends[condition1],
                        this.processedData.conditionTrends[condition2]
                    );
                    row.push(correlation);
                }
            });
            this.correlationMatrix.push({
                condition: condition1,
                correlations: row
            });
        });
    }
    
    calculatePearsonCorrelation(data1, data2) {
        if (!data1 || !data2 || data1.length !== data2.length) return 0;
        
        const n = data1.length;
        const sum1 = data1.reduce((sum, d) => sum + d.value, 0);
        const sum2 = data2.reduce((sum, d) => sum + d.value, 0);
        
        const mean1 = sum1 / n;
        const mean2 = sum2 / n;
        
        let numerator = 0;
        let sum1Sq = 0;
        let sum2Sq = 0;
        
        for (let i = 0; i < n; i++) {
            const diff1 = data1[i].value - mean1;
            const diff2 = data2[i].value - mean2;
            
            numerator += diff1 * diff2;
            sum1Sq += diff1 * diff1;
            sum2Sq += diff2 * diff2;
        }
        
        const denominator = Math.sqrt(sum1Sq * sum2Sq);
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    detectSeasonalPatterns() {
        this.seasonalPatterns = {};
        
        Object.keys(this.processedData.conditionTrends).forEach(condition => {
            const data = this.processedData.conditionTrends[condition];
            if (!data || data.length < 12) return;
            
            const monthlyAverages = Array(12).fill(0);
            const monthlyCounts = Array(12).fill(0);
            
            data.forEach(d => {
                const month = new Date(d.date).getMonth();
                monthlyAverages[month] += d.value;
                monthlyCounts[month]++;
            });
            
            // Calculate averages
            const seasonalData = monthlyAverages.map((sum, i) => ({
                month: i,
                value: monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0,
                monthName: new Date(2024, i, 1).toLocaleString('default', { month: 'short' })
            }));
            
            // Detect peaks and valleys
            const peaks = this.findPeaksAndValleys(seasonalData);
            
            this.seasonalPatterns[condition] = {
                monthlyAverages: seasonalData,
                peaks: peaks.peaks,
                valleys: peaks.valleys,
                seasonality: this.calculateSeasonalityIndex(seasonalData)
            };
        });
    }
    
    findPeaksAndValleys(data) {
        const peaks = [];
        const valleys = [];
        
        for (let i = 1; i < data.length - 1; i++) {
            const prev = data[i - 1].value;
            const current = data[i].value;
            const next = data[i + 1].value;
            
            if (current > prev && current > next) {
                peaks.push({ month: data[i].month, value: current, monthName: data[i].monthName });
            } else if (current < prev && current < next) {
                valleys.push({ month: data[i].month, value: current, monthName: data[i].monthName });
            }
        }
        
        return { peaks, valleys };
    }
    
    calculateSeasonalityIndex(data) {
        const values = data.map(d => d.value);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }
    
    detectOutbreaks() {
        this.outbreaks = [];
        
        Object.keys(this.processedData.conditionTrends).forEach(condition => {
            const data = this.processedData.conditionTrends[condition];
            if (!data || data.length < 14) return;
            
            // Calculate 14-day moving average and standard deviation
            const movingAverages = this.calculateMovingAverage(data, 14);
            const outbreakThreshold = 2; // 2 standard deviations above mean
            
            for (let i = 14; i < data.length; i++) {
                const current = data[i].value;
                const baseline = movingAverages[i - 14];
                const stdDev = this.calculateStandardDeviation(data.slice(i - 14, i));
                
                if (current > baseline + (outbreakThreshold * stdDev)) {
                    this.outbreaks.push({
                        condition,
                        date: new Date(data[i].date),
                        value: current,
                        baseline,
                        severity: this.calculateOutbreakSeverity(current, baseline, stdDev),
                        confidence: Math.min(95, 70 + ((current - baseline) / stdDev) * 5)
                    });
                }
            }
        });
        
        // Sort by severity and recency
        this.outbreaks.sort((a, b) => {
            const severityDiff = b.severity - a.severity;
            if (Math.abs(severityDiff) < 0.1) {
                return b.date - a.date;
            }
            return severityDiff;
        });
    }
    
    calculateMovingAverage(data, windowSize) {
        const result = [];
        for (let i = windowSize - 1; i < data.length; i++) {
            const window = data.slice(i - windowSize + 1, i + 1);
            const average = window.reduce((sum, d) => sum + d.value, 0) / windowSize;
            result.push(average);
        }
        return result;
    }
    
    calculateStandardDeviation(data) {
        const values = data.map(d => d.value);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    
    calculateOutbreakSeverity(current, baseline, stdDev) {
        const zScore = (current - baseline) / stdDev;
        
        if (zScore > 3) return 'Critical';
        if (zScore > 2.5) return 'High';
        if (zScore > 2) return 'Moderate';
        return 'Low';
    }
    
    switchAnalysisType(type) {
        this.clearVisualization();
        
        switch (type) {
            case 'trends':
                this.renderTrendAnalysis();
                break;
            case 'correlation':
                this.renderCorrelationMatrix();
                break;
            case 'seasonal':
                this.renderSeasonalPatterns();
                break;
            case 'outbreak':
                this.renderOutbreakDetection();
                break;
            case 'effectiveness':
                this.renderTreatmentEffectiveness();
                break;
        }
    }
    
    clearVisualization() {
        this.mainGroup.selectAll('.visualization-content').remove();
    }
    
    renderTrendAnalysis() {
        const trendsGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content trends-analysis');
            
        if (!this.processedData.conditionTrends) return;
        
        // Update scales
        const allData = Object.values(this.processedData.conditionTrends).flat();
        const dateExtent = d3.extent(allData, d => new Date(d.date));
        const valueExtent = d3.extent(allData, d => d.value);
        
        this.scales.x.domain(dateExtent);
        this.scales.y.domain([0, valueExtent[1] * 1.1]);
        
        // Add axes
        const xAxis = d3.axisBottom(this.scales.x)
            .tickFormat(d3.timeFormat('%b %Y'));
        const yAxis = d3.axisLeft(this.scales.y);
            
        trendsGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${this.innerHeight})`)
            .call(xAxis);
            
        trendsGroup.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);
            
        // Add axis labels
        trendsGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Case Count');
            
        trendsGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Date');
        
        // Create line generator
        const line = d3.line()
            .x(d => this.scales.x(new Date(d.date)))
            .y(d => this.scales.y(d.value))
            .curve(d3.curveMonotoneX);
        
        // Add trend lines for each condition
        const conditions = Object.keys(this.processedData.conditionTrends);
        this.scales.color.domain(conditions);
        
        conditions.forEach((condition, i) => {
            const data = this.processedData.conditionTrends[condition];
            
            trendsGroup.append('path')
                .datum(data)
                .attr('class', `trend-line trend-${i}`)
                .attr('fill', 'none')
                .attr('stroke', this.scales.color(condition))
                .attr('stroke-width', 2.5)
                .attr('opacity', 0.8)
                .attr('d', line);
                
            // Add data points
            trendsGroup.selectAll(`.trend-point-${i}`)
                .data(data.filter((d, idx) => idx % 3 === 0)) // Show every 3rd point
                .enter()
                .append('circle')
                .attr('class', `trend-point trend-point-${i}`)
                .attr('cx', d => this.scales.x(new Date(d.date)))
                .attr('cy', d => this.scales.y(d.value))
                .attr('r', 4)
                .attr('fill', this.scales.color(condition))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseenter', (event, d) => this.showTrendTooltip(event, d, condition))
                .on('mouseleave', () => this.hideTooltip())
                .on('mousemove', event => this.moveTooltip(event));
        });
        
        // Add legend
        this.createTrendLegend(trendsGroup, conditions);
        
        // Add trend analysis insights
        this.addTrendInsights(trendsGroup);
    }
    
    renderCorrelationMatrix() {
        const corrGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content correlation-matrix');
            
        if (!this.correlationMatrix || this.correlationMatrix.length === 0) return;
        
        const conditions = this.correlationMatrix.map(d => d.condition);
        const cellSize = Math.min(40, (this.innerWidth - 100) / conditions.length);
        
        // Create scales for heatmap
        const xScale = d3.scaleBand()
            .domain(conditions)
            .range([0, conditions.length * cellSize])
            .padding(0.05);
            
        const yScale = d3.scaleBand()
            .domain(conditions)
            .range([0, conditions.length * cellSize])
            .padding(0.05);
            
        const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([-1, 1]);
        
        // Create heatmap cells
        this.correlationMatrix.forEach((row, i) => {
            row.correlations.forEach((corr, j) => {
                corrGroup.append('rect')
                    .attr('x', xScale(conditions[j]))
                    .attr('y', yScale(conditions[i]))
                    .attr('width', xScale.bandwidth())
                    .attr('height', yScale.bandwidth())
                    .attr('fill', colorScale(corr))
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('mouseenter', (event) => {
                        this.showCorrelationTooltip(event, conditions[i], conditions[j], corr);
                    })
                    .on('mouseleave', () => this.hideTooltip())
                    .on('mousemove', event => this.moveTooltip(event));
                    
                // Add correlation value text
                if (Math.abs(corr) > 0.3) {
                    corrGroup.append('text')
                        .attr('x', xScale(conditions[j]) + xScale.bandwidth() / 2)
                        .attr('y', yScale(conditions[i]) + yScale.bandwidth() / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .style('font-size', '10px')
                        .style('font-weight', 'bold')
                        .style('fill', Math.abs(corr) > 0.7 ? 'white' : 'black')
                        .text(corr.toFixed(2));
                }
            });
        });
        
        // Add axes labels
        conditions.forEach((condition, i) => {
            // X-axis labels
            corrGroup.append('text')
                .attr('x', xScale(condition) + xScale.bandwidth() / 2)
                .attr('y', conditions.length * cellSize + 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', '#666')
                .text(condition);
                
            // Y-axis labels
            corrGroup.append('text')
                .attr('x', -15)
                .attr('y', yScale(condition) + yScale.bandwidth() / 2)
                .attr('text-anchor', 'end')
                .attr('dy', '0.35em')
                .style('font-size', '12px')
                .style('fill', '#666')
                .text(condition);
        });
        
        // Add color scale legend
        this.createCorrelationLegend(corrGroup, colorScale, conditions.length * cellSize);
    }
    
    renderSeasonalPatterns() {
        const seasonalGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content seasonal-patterns');
            
        if (!this.seasonalPatterns) return;
        
        const conditions = Object.keys(this.seasonalPatterns);
        const chartWidth = this.innerWidth / Math.min(3, conditions.length);
        const chartHeight = this.innerHeight / Math.ceil(conditions.length / 3);
        
        conditions.forEach((condition, i) => {
            const pattern = this.seasonalPatterns[condition];
            const row = Math.floor(i / 3);
            const col = i % 3;
            
            const chartGroup = seasonalGroup.append('g')
                .attr('class', `seasonal-chart-${i}`)
                .attr('transform', `translate(${col * chartWidth + 10}, ${row * chartHeight + 10})`);
                
            this.renderSeasonalChart(chartGroup, condition, pattern, chartWidth - 20, chartHeight - 40);
        });
    }
    
    renderSeasonalChart(group, condition, pattern, width, height) {
        const xScale = d3.scaleBand()
            .domain(pattern.monthlyAverages.map(d => d.monthName))
            .range([0, width])
            .padding(0.1);
            
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(pattern.monthlyAverages, d => d.value)])
            .range([height, 0]);
        
        // Add title
        group.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text(condition);
        
        // Add bars
        group.selectAll('.seasonal-bar')
            .data(pattern.monthlyAverages)
            .enter()
            .append('rect')
            .attr('class', 'seasonal-bar')
            .attr('x', d => xScale(d.monthName))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
            .attr('fill', (d, i) => {
                // Highlight peak months
                const isPeak = pattern.peaks.some(p => p.month === d.month);
                return isPeak ? this.options.colors.danger : this.options.colors.primary;
            })
            .attr('opacity', 0.8);
            
        // Add peak indicators
        pattern.peaks.forEach(peak => {
            group.append('text')
                .attr('x', xScale(peak.monthName) + xScale.bandwidth() / 2)
                .attr('y', yScale(peak.value) - 5)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('🔥');
        });
        
        // Add seasonality index
        group.append('text')
            .attr('x', width)
            .attr('y', height + 15)
            .attr('text-anchor', 'end')
            .style('font-size', '10px')
            .style('fill', '#6b7280')
            .text(`Seasonality: ${(pattern.seasonality * 100).toFixed(1)}%`);
    }
    
    renderOutbreakDetection() {
        const outbreakGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content outbreak-detection');
            
        if (!this.outbreaks || this.outbreaks.length === 0) {
            outbreakGroup.append('text')
                .attr('x', this.innerWidth / 2)
                .attr('y', this.innerHeight / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('fill', '#6b7280')
                .text('No outbreaks detected in the current data');
            return;
        }
        
        // Create outbreak timeline
        const timeScale = d3.scaleTime()
            .domain(d3.extent(this.outbreaks, d => d.date))
            .range([0, this.innerWidth]);
            
        const severityScale = d3.scaleOrdinal()
            .domain(['Low', 'Moderate', 'High', 'Critical'])
            .range([this.options.colors.success, this.options.colors.warning, this.options.colors.danger, '#991b1b']);
        
        // Add timeline axis
        const timeAxis = d3.axisBottom(timeScale)
            .tickFormat(d3.timeFormat('%b %d'));
            
        outbreakGroup.append('g')
            .attr('class', 'time-axis')
            .attr('transform', `translate(0, ${this.innerHeight - 50})`)
            .call(timeAxis);
        
        // Group outbreaks by condition
        const outbreaksByCondition = d3.group(this.outbreaks, d => d.condition);
        const conditions = Array.from(outbreaksByCondition.keys());
        
        const yScale = d3.scaleBand()
            .domain(conditions)
            .range([0, this.innerHeight - 100])
            .padding(0.2);
        
        // Add condition labels
        conditions.forEach(condition => {
            outbreakGroup.append('text')
                .attr('x', -10)
                .attr('y', yScale(condition) + yScale.bandwidth() / 2)
                .attr('text-anchor', 'end')
                .attr('dy', '0.35em')
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', '#374151')
                .text(condition);
        });
        
        // Add outbreak markers
        this.outbreaks.forEach((outbreak, i) => {
            const x = timeScale(outbreak.date);
            const y = yScale(outbreak.condition) + yScale.bandwidth() / 2;
            
            outbreakGroup.append('circle')
                .attr('class', 'outbreak-marker')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 8)
                .attr('fill', severityScale(outbreak.severity))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseenter', (event) => this.showOutbreakTooltip(event, outbreak))
                .on('mouseleave', () => this.hideTooltip())
                .on('mousemove', event => this.moveTooltip(event));
                
            // Add severity indicator
            if (outbreak.severity === 'Critical') {
                outbreakGroup.append('text')
                    .attr('x', x)
                    .attr('y', y - 15)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '14px')
                    .text('🚨');
            }
        });
        
        // Add outbreak summary
        this.addOutbreakSummary(outbreakGroup);
    }
    
    renderTreatmentEffectiveness() {
        const effectivenessGroup = this.mainGroup.append('g')
            .attr('class', 'visualization-content treatment-effectiveness');
            
        if (!this.processedData.treatmentEffectiveness) return;
        
        const treatments = Object.keys(this.processedData.treatmentEffectiveness);
        const effectiveness = Object.values(this.processedData.treatmentEffectiveness);
        
        // Create scales
        const xScale = d3.scaleBand()
            .domain(treatments)
            .range([0, this.innerWidth])
            .padding(0.1);
            
        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([this.innerHeight, 0]);
        
        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat(d => d + '%');
        
        effectivenessGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${this.innerHeight})`)
            .call(xAxis);
            
        effectivenessGroup.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);
        
        // Add bars
        effectivenessGroup.selectAll('.effectiveness-bar')
            .data(treatments)
            .enter()
            .append('rect')
            .attr('class', 'effectiveness-bar')
            .attr('x', d => xScale(d))
            .attr('y', d => yScale(this.processedData.treatmentEffectiveness[d]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => this.innerHeight - yScale(this.processedData.treatmentEffectiveness[d]))
            .attr('fill', d => {
                const rate = this.processedData.treatmentEffectiveness[d];
                if (rate >= 90) return this.options.colors.success;
                if (rate >= 80) return this.options.colors.primary;
                if (rate >= 70) return this.options.colors.warning;
                return this.options.colors.danger;
            })
            .attr('opacity', 0.8)
            .on('mouseenter', (event, d) => {
                this.showEffectivenessTooltip(event, d, this.processedData.treatmentEffectiveness[d]);
            })
            .on('mouseleave', () => this.hideTooltip())
            .on('mousemove', event => this.moveTooltip(event));
            
        // Add value labels
        effectivenessGroup.selectAll('.effectiveness-label')
            .data(treatments)
            .enter()
            .append('text')
            .attr('class', 'effectiveness-label')
            .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(this.processedData.treatmentEffectiveness[d]) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text(d => this.processedData.treatmentEffectiveness[d] + '%');
    }
    
    // Tooltip methods
    showTrendTooltip(event, data, condition) {
        const content = `
            <div class="tooltip-header">
                <strong>${condition}</strong>
            </div>
            <div class="tooltip-content">
                <div>Date: ${new Date(data.date).toLocaleDateString()}</div>
                <div>Cases: ${data.value.toLocaleString()}</div>
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(content);
            
        this.moveTooltip(event);
    }
    
    showCorrelationTooltip(event, condition1, condition2, correlation) {
        const strength = Math.abs(correlation);
        let strengthText = 'Weak';
        if (strength > 0.7) strengthText = 'Strong';
        else if (strength > 0.5) strengthText = 'Moderate';
        
        const direction = correlation > 0 ? 'Positive' : 'Negative';
        
        const content = `
            <div class="tooltip-header">
                <strong>Correlation Analysis</strong>
            </div>
            <div class="tooltip-content">
                <div><strong>${condition1}</strong> vs <strong>${condition2}</strong></div>
                <div>Correlation: ${correlation.toFixed(3)}</div>
                <div>Strength: ${strengthText} ${direction}</div>
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(content);
            
        this.moveTooltip(event);
    }
    
    showOutbreakTooltip(event, outbreak) {
        const content = `
            <div class="tooltip-header">
                <strong>Outbreak Alert</strong>
            </div>
            <div class="tooltip-content">
                <div>Condition: ${outbreak.condition}</div>
                <div>Date: ${outbreak.date.toLocaleDateString()}</div>
                <div>Current Cases: ${outbreak.value.toLocaleString()}</div>
                <div>Baseline: ${outbreak.baseline.toFixed(1)}</div>
                <div>Severity: ${outbreak.severity}</div>
                <div>Confidence: ${outbreak.confidence.toFixed(1)}%</div>
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(content);
            
        this.moveTooltip(event);
    }
    
    showEffectivenessTooltip(event, treatment, rate) {
        const content = `
            <div class="tooltip-header">
                <strong>${treatment}</strong>
            </div>
            <div class="tooltip-content">
                <div>Success Rate: ${rate}%</div>
                <div>Category: ${rate >= 90 ? 'Excellent' : rate >= 80 ? 'Good' : rate >= 70 ? 'Fair' : 'Needs Improvement'}</div>
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
    
    // Helper methods for creating legends and insights
    createTrendLegend(group, conditions) {
        const legendGroup = group.append('g')
            .attr('class', 'trend-legend')
            .attr('transform', `translate(${this.innerWidth - 150}, 20)`);
            
        conditions.forEach((condition, i) => {
            const legendItem = legendGroup.append('g')
                .attr('transform', `translate(0, ${i * 20})`);
                
            legendItem.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 0)
                .attr('y2', 0)
                .attr('stroke', this.scales.color(condition))
                .attr('stroke-width', 3);
                
            legendItem.append('text')
                .attr('x', 25)
                .attr('y', 0)
                .attr('dy', '0.35em')
                .style('font-size', '12px')
                .style('fill', '#374151')
                .text(condition);
        });
    }
    
    createCorrelationLegend(group, colorScale, matrixSize) {
        const legendGroup = group.append('g')
            .attr('class', 'correlation-legend')
            .attr('transform', `translate(${matrixSize + 50}, 0)`);
            
        const legendHeight = 200;
        const legendWidth = 20;
        
        // Create gradient
        const gradient = this.svg.select('defs')
            .append('linearGradient')
            .attr('id', 'correlation-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', legendHeight)
            .attr('x2', 0).attr('y2', 0);
            
        gradient.selectAll('stop')
            .data([-1, -0.5, 0, 0.5, 1])
            .enter()
            .append('stop')
            .attr('offset', (d, i) => (i / 4) * 100 + '%')
            .attr('stop-color', d => colorScale(d));
            
        legendGroup.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#correlation-gradient)');
            
        // Add scale
        const legendScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([legendHeight, 0]);
            
        const legendAxis = d3.axisRight(legendScale);
        
        legendGroup.append('g')
            .attr('transform', `translate(${legendWidth}, 0)`)
            .call(legendAxis);
            
        legendGroup.append('text')
            .attr('x', legendWidth + 40)
            .attr('y', legendHeight / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Correlation');
    }
    
    addTrendInsights(group) {
        // Add insights based on trend analysis
        const insights = this.generateTrendInsights();
        
        const insightsGroup = group.append('g')
            .attr('class', 'trend-insights')
            .attr('transform', `translate(20, ${this.innerHeight + 70})`);
            
        insights.forEach((insight, i) => {
            const insightItem = insightsGroup.append('g')
                .attr('transform', `translate(${i * 300}, 0)`);
                
            insightItem.append('rect')
                .attr('width', 280)
                .attr('height', 60)
                .attr('rx', 8)
                .attr('fill', '#f9fafb')
                .attr('stroke', '#e5e7eb')
                .attr('stroke-width', 1);
                
            insightItem.append('text')
                .attr('x', 10)
                .attr('y', 20)
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#374151')
                .text(insight.title);
                
            insightItem.append('text')
                .attr('x', 10)
                .attr('y', 40)
                .style('font-size', '10px')
                .style('fill', '#6b7280')
                .text(insight.description);
        });
    }
    
    generateTrendInsights() {
        const insights = [];
        
        if (this.outbreaks && this.outbreaks.length > 0) {
            insights.push({
                title: `${this.outbreaks.length} Active Outbreaks`,
                description: `Most severe: ${this.outbreaks[0].condition}`
            });
        }
        
        if (this.seasonalPatterns) {
            const highSeasonality = Object.keys(this.seasonalPatterns)
                .filter(condition => this.seasonalPatterns[condition].seasonality > 0.3);
                
            if (highSeasonality.length > 0) {
                insights.push({
                    title: 'High Seasonal Variation',
                    description: `${highSeasonality[0]} shows strong seasonal patterns`
                });
            }
        }
        
        if (this.correlationMatrix) {
            const strongCorrelations = this.correlationMatrix.flatMap((row, i) =>
                row.correlations.map((corr, j) => ({
                    condition1: row.condition,
                    condition2: this.correlationMatrix[j].condition,
                    correlation: corr
                }))
            ).filter(item => Math.abs(item.correlation) > 0.7 && item.correlation !== 1);
            
            if (strongCorrelations.length > 0) {
                insights.push({
                    title: 'Strong Correlations Found',
                    description: `${strongCorrelations[0].condition1} & ${strongCorrelations[0].condition2}`
                });
            }
        }
        
        return insights.slice(0, 3);
    }
    
    addOutbreakSummary(group) {
        const summaryGroup = group.append('g')
            .attr('class', 'outbreak-summary')
            .attr('transform', `translate(${this.innerWidth - 200}, 20)`);
            
        const criticalCount = this.outbreaks.filter(o => o.severity === 'Critical').length;
        const highCount = this.outbreaks.filter(o => o.severity === 'High').length;
        
        summaryGroup.append('rect')
            .attr('width', 180)
            .attr('height', 100)
            .attr('rx', 8)
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#e5e7eb')
            .attr('stroke-width', 1);
            
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Outbreak Summary');
            
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 40)
            .style('font-size', '12px')
            .style('fill', '#dc2626')
            .text(`Critical: ${criticalCount}`);
            
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 60)
            .style('font-size', '12px')
            .style('fill', '#f59e0b')
            .text(`High: ${highCount}`);
            
        summaryGroup.append('text')
            .attr('x', 10)
            .attr('y', 80)
            .style('font-size', '12px')
            .style('fill', '#6b7280')
            .text(`Total: ${this.outbreaks.length}`);
    }
    
    // Export functionality
    exportAnalysis(format = 'json') {
        const analysisData = {
            trends: this.processedData,
            correlations: this.correlationMatrix,
            seasonalPatterns: this.seasonalPatterns,
            outbreaks: this.outbreaks,
            insights: this.generateTrendInsights(),
            exportDate: new Date().toISOString()
        };
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'medical-trends-analysis.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
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
window.AdvancedMedicalTrends = AdvancedMedicalTrends;