/**
 * Advanced Patient Journey Mapping with D3.js
 * Features: Animated pathways, heatmaps, conversion funnels, multi-path analysis, patient clustering
 */

class AdvancedPatientJourney {
    constructor(container, options = {}) {
        this.container = d3.select(container);
        this.options = {
            width: options.width || 1200,
            height: options.height || 800,
            margin: { top: 40, right: 40, bottom: 40, left: 40 },
            nodeRadius: { min: 25, max: 80 },
            colors: {
                primary: '#10b981',
                secondary: '#3b82f6',
                warning: '#f59e0b',
                danger: '#ef4444',
                success: '#22c55e',
                pathFlow: '#8b5cf6'
            },
            animation: {
                duration: 1000,
                delay: 100,
                particleSpeed: 2000
            },
            ...options
        };
        
        this.svg = null;
        this.tooltip = null;
        this.data = null;
        this.simulation = null;
        this.heatmapData = new Map();
        this.selectedSegment = null;
        
        this.init();
    }
    
    init() {
        this.createSVG();
        this.createTooltip();
        this.createDefinitions();
        this.setupZoom();
        this.createLegend();
    }
    
    createSVG() {
        // Clear existing content
        this.container.selectAll('*').remove();
        
        this.svg = this.container
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('class', 'patient-journey-svg');
            
        this.mainGroup = this.svg.append('g')
            .attr('class', 'main-group')
            .attr('transform', `translate(${this.options.margin.left}, ${this.options.margin.top})`);
    }
    
    createTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'patient-journey-tooltip')
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
            .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
            .style('max-width', '320px');
    }
    
    createDefinitions() {
        const defs = this.svg.append('defs');
        
        // Gradient definitions for nodes
        const nodeGradient = defs.append('radialGradient')
            .attr('id', 'nodeGradient')
            .attr('cx', '30%')
            .attr('cy', '30%');
            
        nodeGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', this.options.colors.primary)
            .attr('stop-opacity', 1);
            
        nodeGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#059669')
            .attr('stop-opacity', 1);
        
        // Arrow markers for pathways
        const arrowMarker = defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('markerWidth', 12)
            .attr('markerHeight', 9)
            .attr('refX', 11)
            .attr('refY', 4.5)
            .attr('orient', 'auto')
            .attr('markerUnits', 'strokeWidth');
            
        arrowMarker.append('path')
            .attr('d', 'M0,0 L0,9 L12,4.5 z')
            .attr('fill', this.options.colors.primary);
        
        // Glow filter for highlighted elements
        const glowFilter = defs.append('filter')
            .attr('id', 'glow')
            .attr('width', '300%')
            .attr('height', '300%')
            .attr('x', '-100%')
            .attr('y', '-100%');
            
        glowFilter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');
            
        const feMerge = glowFilter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
        
        // Pattern for heatmap overlay
        const heatmapPattern = defs.append('pattern')
            .attr('id', 'heatmapPattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4);
            
        heatmapPattern.append('circle')
            .attr('cx', 2)
            .attr('cy', 2)
            .attr('r', 1)
            .attr('fill', this.options.colors.warning)
            .attr('opacity', 0.6);
    }
    
    setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });
            
        this.svg.call(zoom);
    }
    
    createLegend() {
        const legendGroup = this.svg.append('g')
            .attr('class', 'legend-group')
            .attr('transform', `translate(${this.options.width - 200}, 20)`);
            
        const legendData = [
            { label: 'High Volume', color: this.options.colors.primary, size: 'large' },
            { label: 'Medium Volume', color: this.options.colors.secondary, size: 'medium' },
            { label: 'Low Volume', color: this.options.colors.warning, size: 'small' },
            { label: 'Bottleneck', color: this.options.colors.danger, size: 'medium' }
        ];
        
        const legend = legendGroup.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 30})`);
            
        legend.append('circle')
            .attr('r', d => d.size === 'large' ? 8 : d.size === 'medium' ? 6 : 4)
            .attr('fill', d => d.color)
            .attr('cx', 10)
            .attr('cy', 0);
            
        legend.append('text')
            .attr('x', 25)
            .attr('y', 5)
            .attr('font-size', '12px')
            .attr('fill', '#374151')
            .text(d => d.label);
    }
    
    updateVisualization(data) {
        this.data = data;
        this.processData();
        this.renderJourneyStages();
        this.renderPathways();
        this.renderHeatmap();
        this.renderPatientSegments();
        this.animateJourney();
        this.setupInteractions();
    }
    
    processData() {
        // Calculate node sizes based on patient volume
        const maxPatients = d3.max(this.data.journeyStages, d => d.patients);
        const minPatients = d3.min(this.data.journeyStages, d => d.patients);
        
        this.nodeScale = d3.scaleSqrt()
            .domain([minPatients, maxPatients])
            .range([this.options.nodeRadius.min, this.options.nodeRadius.max]);
            
        // Calculate pathway thickness
        this.pathwayScale = d3.scaleLinear()
            .domain([0, maxPatients])
            .range([2, 20]);
            
        // Generate heatmap data
        this.generateHeatmapData();
    }
    
    generateHeatmapData() {
        this.data.journeyStages.forEach((stage, i) => {
            // Simulate bottleneck intensity
            const bottleneckScore = this.calculateBottleneckScore(stage);
            this.heatmapData.set(stage.id, {
                intensity: bottleneckScore,
                color: this.getHeatmapColor(bottleneckScore),
                waitTime: stage.avgTime || 0
            });
        });
    }
    
    calculateBottleneckScore(stage) {
        // Complex bottleneck calculation based on multiple factors
        const waitTimeFactor = Math.min(stage.avgTime / 60, 1); // Normalize to 0-1
        const completionFactor = 1 - (stage.completionRate || 0.9);
        const satisfactionFactor = 1 - ((stage.satisfactionScore || 4.5) / 5);
        
        return (waitTimeFactor * 0.4 + completionFactor * 0.4 + satisfactionFactor * 0.2);
    }
    
    getHeatmapColor(intensity) {
        const heatmapScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([1, 0]); // Reverse scale so red = high intensity
        return heatmapScale(intensity);
    }
    
    renderJourneyStages() {
        // Clear existing stages
        this.mainGroup.selectAll('.journey-stage').remove();
        
        // Create stage groups
        const stageGroups = this.mainGroup.selectAll('.journey-stage')
            .data(this.data.journeyStages)
            .enter()
            .append('g')
            .attr('class', 'journey-stage')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
            
        // Add heatmap overlay circles
        const heatmapOverlay = stageGroups.append('circle')
            .attr('class', 'heatmap-overlay')
            .attr('r', d => this.nodeScale(d.patients) + 15)
            .attr('fill', d => this.heatmapData.get(d.id)?.color || 'transparent')
            .attr('opacity', 0.3)
            .attr('stroke', 'none');
            
        // Main stage circles with enhanced styling
        const stageCircles = stageGroups.append('circle')
            .attr('class', 'stage-circle')
            .attr('r', 0) // Start at 0 for animation
            .attr('fill', 'url(#nodeGradient)')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 3)
            .attr('cursor', 'pointer')
            .style('filter', 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))');
            
        // Animate circle appearance
        stageCircles.transition()
            .duration(this.options.animation.duration)
            .delay((d, i) => i * this.options.animation.delay)
            .attr('r', d => this.nodeScale(d.patients));
            
        // Add stage labels with better positioning
        const stageLabels = stageGroups.append('text')
            .attr('class', 'stage-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.3em')
            .style('font-weight', 'bold')
            .style('font-size', '12px')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
            .style('pointer-events', 'none');
            
        // Handle multi-line labels
        stageLabels.each(function(d) {
            const words = d.stage.split(' ');
            const maxWords = 2;
            
            if (words.length <= maxWords) {
                d3.select(this).text(d.stage);
            } else {
                d3.select(this).text(words.slice(0, maxWords).join(' '));
                
                d3.select(this.parentNode)
                    .append('text')
                    .attr('class', 'stage-label-line2')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '0.9em')
                    .style('font-weight', 'bold')
                    .style('font-size', '11px')
                    .style('fill', 'white')
                    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
                    .style('pointer-events', 'none')
                    .text(words.slice(maxWords).join(' '));
            }
        });
        
        // Add patient count badges
        stageGroups.append('text')
            .attr('class', 'patient-count')
            .attr('text-anchor', 'middle')
            .attr('dy', '2.5em')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
            .text(d => d.patients.toLocaleString());
            
        // Add performance indicators
        this.addPerformanceIndicators(stageGroups);
        
        // Add bottleneck warnings
        this.addBottleneckWarnings(stageGroups);
    }
    
    addPerformanceIndicators(stageGroups) {
        const performanceIndicators = stageGroups.append('g')
            .attr('class', 'performance-indicators')
            .attr('transform', d => `translate(${this.nodeScale(d.patients) + 20}, -20)`);
            
        // Satisfaction score indicator
        performanceIndicators.append('circle')
            .attr('r', 8)
            .attr('fill', d => {
                const score = d.satisfactionScore || 4.0;
                if (score >= 4.5) return this.options.colors.success;
                if (score >= 4.0) return this.options.colors.warning;
                return this.options.colors.danger;
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
            
        performanceIndicators.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(d => (d.satisfactionScore || 4.0).toFixed(1));
    }
    
    addBottleneckWarnings(stageGroups) {
        const bottleneckGroups = stageGroups.filter(d => {
            const intensity = this.heatmapData.get(d.id)?.intensity || 0;
            return intensity > 0.6; // High bottleneck threshold
        });
        
        const warningIcons = bottleneckGroups.append('g')
            .attr('class', 'bottleneck-warning')
            .attr('transform', d => `translate(${this.nodeScale(d.patients) + 10}, ${this.nodeScale(d.patients) + 10})`);
            
        warningIcons.append('circle')
            .attr('r', 10)
            .attr('fill', this.options.colors.danger)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('filter', 'url(#glow)');
            
        warningIcons.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text('⚠');
    }
    
    renderPathways() {
        // Clear existing pathways
        this.mainGroup.selectAll('.pathway-group').remove();
        
        const pathwayGroup = this.mainGroup.append('g')
            .attr('class', 'pathway-group');
            
        // Create pathway connections
        const pathways = pathwayGroup.selectAll('.pathway')
            .data(this.data.pathwayFlows || [])
            .enter()
            .append('g')
            .attr('class', 'pathway');
            
        // Get source and target positions
        const getNodePosition = (nodeId) => {
            const node = this.data.journeyStages.find(s => s.id === nodeId);
            return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
        };
        
        // Create curved pathways
        const pathLines = pathways.append('path')
            .attr('class', 'pathway-line')
            .attr('fill', 'none')
            .attr('stroke', this.options.colors.pathFlow)
            .attr('stroke-width', d => this.pathwayScale(d.patients))
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrowhead)')
            .attr('d', d => {
                const source = getNodePosition(d.source);
                const target = getNodePosition(d.target);
                
                return this.createCurvedPath(source, target);
            });
            
        // Add pathway labels
        const pathwayLabels = pathways.append('text')
            .attr('class', 'pathway-label')
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', this.options.colors.pathFlow)
            .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
            .attr('transform', d => {
                const source = getNodePosition(d.source);
                const target = getNodePosition(d.target);
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2 - 10;
                return `translate(${midX}, ${midY})`;
            })
            .text(d => `${d.patients} patients`);
            
        // Add success rate indicators
        pathways.append('rect')
            .attr('class', 'success-rate-indicator')
            .attr('width', 40)
            .attr('height', 16)
            .attr('rx', 8)
            .attr('fill', d => {
                const rate = d.successRate || 0.9;
                if (rate >= 0.9) return this.options.colors.success;
                if (rate >= 0.8) return this.options.colors.warning;
                return this.options.colors.danger;
            })
            .attr('transform', d => {
                const source = getNodePosition(d.source);
                const target = getNodePosition(d.target);
                const midX = (source.x + target.x) / 2 - 20;
                const midY = (source.y + target.y) / 2 + 5;
                return `translate(${midX}, ${midY})`;
            });
            
        pathways.append('text')
            .attr('class', 'success-rate-text')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .attr('transform', d => {
                const source = getNodePosition(d.source);
                const target = getNodePosition(d.target);
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2 + 15;
                return `translate(${midX}, ${midY})`;
            })
            .text(d => `${Math.round((d.successRate || 0.9) * 100)}%`);
    }
    
    createCurvedPath(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
        
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
    }
    
    renderHeatmap() {
        // Add heatmap toggle button
        this.addHeatmapToggle();
        
        // Heatmap is already rendered as part of stage circles
        // This method can be extended for additional heatmap features
        this.createHeatmapLegend();
    }
    
    addHeatmapToggle() {
        const toggleGroup = this.svg.append('g')
            .attr('class', 'heatmap-toggle')
            .attr('transform', 'translate(20, 20)');
            
        const toggle = toggleGroup.append('g')
            .attr('cursor', 'pointer');
            
        toggle.append('rect')
            .attr('width', 120)
            .attr('height', 30)
            .attr('rx', 15)
            .attr('fill', '#f3f4f6')
            .attr('stroke', '#d1d5db')
            .attr('stroke-width', 1);
            
        toggle.append('text')
            .attr('x', 60)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#374151')
            .text('Toggle Heatmap');
            
        toggle.on('click', () => {
            const overlays = this.mainGroup.selectAll('.heatmap-overlay');
            const isVisible = overlays.attr('opacity') > 0;
            
            overlays.transition()
                .duration(300)
                .attr('opacity', isVisible ? 0 : 0.3);
        });
    }
    
    createHeatmapLegend() {
        const heatmapLegend = this.svg.append('g')
            .attr('class', 'heatmap-legend')
            .attr('transform', 'translate(20, 60)');
            
        const legendWidth = 150;
        const legendHeight = 20;
        
        // Create gradient for legend
        const legendGradient = this.svg.select('defs')
            .append('linearGradient')
            .attr('id', 'heatmapLegendGradient')
            .attr('x1', '0%')
            .attr('x2', '100%');
            
        const colorStops = [
            { offset: '0%', color: d3.interpolateRdYlBu(1) },
            { offset: '50%', color: d3.interpolateRdYlBu(0.5) },
            { offset: '100%', color: d3.interpolateRdYlBu(0) }
        ];
        
        colorStops.forEach(stop => {
            legendGradient.append('stop')
                .attr('offset', stop.offset)
                .attr('stop-color', stop.color);
        });
        
        heatmapLegend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#heatmapLegendGradient)')
            .attr('stroke', '#d1d5db')
            .attr('stroke-width', 1);
            
        heatmapLegend.append('text')
            .attr('x', 0)
            .attr('y', 35)
            .style('font-size', '10px')
            .style('fill', '#6b7280')
            .text('Low');
            
        heatmapLegend.append('text')
            .attr('x', legendWidth)
            .attr('y', 35)
            .attr('text-anchor', 'end')
            .style('font-size', '10px')
            .style('fill', '#6b7280')
            .text('High Bottleneck');
    }
    
    renderPatientSegments() {
        if (!this.data.patientSegments) return;
        
        const segmentSelector = this.svg.append('g')
            .attr('class', 'segment-selector')
            .attr('transform', `translate(${this.options.width - 200}, 80)`);
            
        const segments = segmentSelector.selectAll('.segment-button')
            .data([{ name: 'All Segments', id: null }, ...this.data.patientSegments])
            .enter()
            .append('g')
            .attr('class', 'segment-button')
            .attr('transform', (d, i) => `translate(0, ${i * 35})`)
            .attr('cursor', 'pointer');
            
        segments.append('rect')
            .attr('width', 180)
            .attr('height', 30)
            .attr('rx', 15)
            .attr('fill', d => d.id === this.selectedSegment ? this.options.colors.primary : '#f9fafb')
            .attr('stroke', this.options.colors.primary)
            .attr('stroke-width', 1);
            
        segments.append('text')
            .attr('x', 90)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', d => d.id === this.selectedSegment ? 'white' : '#374151')
            .text(d => d.name);
            
        segments.on('click', (event, d) => {
            this.selectedSegment = d.id;
            this.highlightSegment(d.id);
            this.updateSegmentSelector();
        });
    }
    
    highlightSegment(segmentId) {
        // Highlight paths and nodes relevant to the selected segment
        const stageCircles = this.mainGroup.selectAll('.stage-circle');
        const pathwayLines = this.mainGroup.selectAll('.pathway-line');
        
        if (segmentId) {
            // Dim all elements first
            stageCircles.transition()
                .duration(300)
                .attr('opacity', 0.3);
                
            pathwayLines.transition()
                .duration(300)
                .attr('opacity', 0.3);
                
            // Highlight relevant elements based on segment
            // This would be enhanced based on actual segment data
            const relevantStages = this.getRelevantStagesForSegment(segmentId);
            
            stageCircles.filter(d => relevantStages.includes(d.id))
                .transition()
                .duration(300)
                .attr('opacity', 1)
                .style('filter', 'url(#glow)');
        } else {
            // Reset to normal
            stageCircles.transition()
                .duration(300)
                .attr('opacity', 1)
                .style('filter', 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))');
                
            pathwayLines.transition()
                .duration(300)
                .attr('opacity', 0.6);
        }
    }
    
    getRelevantStagesForSegment(segmentId) {
        // This would be enhanced based on actual segment analysis
        const segmentStageMapping = {
            'young_healthy': ['registration', 'consultation', 'outcome'],
            'middle_chronic': ['registration', 'triage', 'consultation', 'diagnosis', 'treatment', 'monitoring'],
            'elderly_complex': ['registration', 'triage', 'consultation', 'diagnosis', 'treatment', 'intervention', 'monitoring', 'outcome']
        };
        
        return segmentStageMapping[segmentId] || [];
    }
    
    updateSegmentSelector() {
        const buttons = this.svg.selectAll('.segment-button rect');
        const texts = this.svg.selectAll('.segment-button text');
        
        buttons.attr('fill', (d, i) => {
            const segment = [{ id: null }, ...this.data.patientSegments][i];
            return segment.id === this.selectedSegment ? this.options.colors.primary : '#f9fafb';
        });
        
        texts.style('fill', (d, i) => {
            const segment = [{ id: null }, ...this.data.patientSegments][i];
            return segment.id === this.selectedSegment ? 'white' : '#374151';
        });
    }
    
    animateJourney() {
        this.animateFlowParticles();
        this.animateMetrics();
    }
    
    animateFlowParticles() {
        const pathways = this.mainGroup.selectAll('.pathway-line');
        
        pathways.each(function(d) {
            const path = d3.select(this);
            const pathNode = this;
            const pathLength = pathNode.getTotalLength();
            
            // Create flow particles
            for (let i = 0; i < 3; i++) {
                const particle = d3.select(pathNode.parentNode)
                    .append('circle')
                    .attr('class', 'flow-particle')
                    .attr('r', 4)
                    .attr('fill', '#8b5cf6')
                    .attr('opacity', 0);
                    
                function animateParticle() {
                    particle
                        .attr('opacity', 0)
                        .transition()
                        .duration(100)
                        .attr('opacity', 0.8)
                        .transition()
                        .duration(2000)
                        .delay(i * 500)
                        .ease(d3.easeLinear)
                        .attrTween('transform', function() {
                            return function(t) {
                                const point = pathNode.getPointAtLength(t * pathLength);
                                return `translate(${point.x},${point.y})`;
                            };
                        })
                        .transition()
                        .duration(100)
                        .attr('opacity', 0)
                        .on('end', animateParticle);
                }
                
                setTimeout(animateParticle, Math.random() * 1000);
            }
        });
    }
    
    animateMetrics() {
        // Animate patient count numbers
        this.mainGroup.selectAll('.patient-count')
            .text('0')
            .transition()
            .duration(1500)
            .delay((d, i) => i * 100)
            .tween('text', function(d) {
                const i = d3.interpolate(0, d.patients);
                return function(t) {
                    this.textContent = Math.round(i(t)).toLocaleString();
                };
            });
    }
    
    setupInteractions() {
        // Stage hover interactions
        const stageGroups = this.mainGroup.selectAll('.journey-stage');
        
        stageGroups
            .on('mouseenter', (event, d) => {
                this.showTooltip(event, d);
                this.highlightStage(d.id, true);
            })
            .on('mouseleave', (event, d) => {
                this.hideTooltip();
                this.highlightStage(d.id, false);
            })
            .on('mousemove', (event) => {
                this.moveTooltip(event);
            })
            .on('click', (event, d) => {
                this.showStageDetails(d);
            });
            
        // Pathway hover interactions
        const pathways = this.mainGroup.selectAll('.pathway');
        
        pathways
            .on('mouseenter', (event, d) => {
                this.showPathwayTooltip(event, d);
            })
            .on('mouseleave', () => {
                this.hideTooltip();
            })
            .on('mousemove', (event) => {
                this.moveTooltip(event);
            });
    }
    
    showTooltip(event, d) {
        const heatmapData = this.heatmapData.get(d.id) || {};
        
        const tooltipContent = `
            <div class="tooltip-header">
                <strong>${d.stage}</strong>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-row">
                    <span class="tooltip-label">Patients:</span>
                    <span class="tooltip-value">${d.patients.toLocaleString()}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Avg Duration:</span>
                    <span class="tooltip-value">${d.avgTime} ${d.avgTime === 1 ? 'day' : 'days'}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Completion Rate:</span>
                    <span class="tooltip-value">${((d.completionRate || 0.9) * 100).toFixed(1)}%</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Satisfaction:</span>
                    <span class="tooltip-value">${(d.satisfactionScore || 4.0).toFixed(1)}/5.0</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Bottleneck Level:</span>
                    <span class="tooltip-value" style="color: ${heatmapData.color || '#10b981'}">
                        ${this.getBottleneckLevel(heatmapData.intensity)}
                    </span>
                </div>
                ${d.commonIssues ? `
                <div class="tooltip-section">
                    <div class="tooltip-label">Common Issues:</div>
                    <ul class="tooltip-list">
                        ${d.commonIssues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(tooltipContent);
            
        this.moveTooltip(event);
    }
    
    showPathwayTooltip(event, d) {
        const tooltipContent = `
            <div class="tooltip-header">
                <strong>Patient Flow</strong>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-row">
                    <span class="tooltip-label">From:</span>
                    <span class="tooltip-value">${this.getStageLabel(d.source)}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">To:</span>
                    <span class="tooltip-value">${this.getStageLabel(d.target)}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Patients:</span>
                    <span class="tooltip-value">${d.patients.toLocaleString()}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Success Rate:</span>
                    <span class="tooltip-value">${((d.successRate || 0.9) * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
        
        this.tooltip
            .style('visibility', 'visible')
            .html(tooltipContent);
            
        this.moveTooltip(event);
    }
    
    getStageLabel(stageId) {
        const stage = this.data.journeyStages.find(s => s.id === stageId);
        return stage ? stage.stage : stageId;
    }
    
    getBottleneckLevel(intensity) {
        if (!intensity) return 'Low';
        if (intensity < 0.3) return 'Low';
        if (intensity < 0.6) return 'Medium';
        return 'High';
    }
    
    moveTooltip(event) {
        this.tooltip
            .style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip.style('visibility', 'hidden');
    }
    
    highlightStage(stageId, highlight) {
        const stageCircle = this.mainGroup.selectAll('.journey-stage')
            .filter(d => d.id === stageId)
            .select('.stage-circle');
            
        if (highlight) {
            stageCircle
                .transition()
                .duration(200)
                .attr('stroke-width', 5)
                .style('filter', 'url(#glow)');
        } else {
            stageCircle
                .transition()
                .duration(200)
                .attr('stroke-width', 3)
                .style('filter', 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))');
        }
    }
    
    showStageDetails(stageData) {
        // Emit custom event for external handling
        this.container.node().dispatchEvent(new CustomEvent('stageClick', {
            detail: stageData
        }));
    }
    
    // Conversion funnel analysis
    generateConversionFunnel() {
        const funnelData = this.data.journeyStages.map((stage, index) => ({
            ...stage,
            conversionRate: index === 0 ? 100 : (stage.patients / this.data.journeyStages[0].patients) * 100,
            dropoffRate: index === 0 ? 0 : ((this.data.journeyStages[index - 1].patients - stage.patients) / this.data.journeyStages[index - 1].patients) * 100
        }));
        
        return funnelData;
    }
    
    // Export functionality
    exportAsImage() {
        const svgString = new XMLSerializer().serializeToString(this.svg.node());
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'patient-journey-map.png';
            link.href = canvas.toDataURL();
            link.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
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
window.AdvancedPatientJourney = AdvancedPatientJourney;