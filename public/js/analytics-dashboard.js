/**
 * Healthcare Analytics Dashboard
 * Comprehensive analytics with D3.js and Chart.js
 * Features: Patient Journey Mapping, Medical Trends, Doctor Performance
 */

// Global variables for charts and data
let analyticsData = {
  overview: {},
  patientJourney: {},
  medicalTrends: {},
  doctorPerformance: {},
  aiInsights: [],
  anomalies: [],
  realTimeMetrics: {}
};

let charts = {
  patientFlow: null,
  conditions: null,
  responseTime: null,
  adherence: null,
  journeyStage: null,
  medicalTrends: null,
  topConditions: null,
  treatmentEffectiveness: null,
  medicationTrends: null,
  doctorPerformance: null,
  performanceDistribution: null,
  doctorSatisfactionTrend: null,
  doctorWorkload: null
};

// Color palettes
const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  gradients: [
    '#10b981', '#34d399', '#22c55e', '#3b82f6',
    '#8b5cf6', '#6366f1', '#f59e0b', '#ef4444'
  ]
};

// Global advanced features
let patientJourneyViz = null;
let medicalTrendsViz = null;
let doctorPerformanceViz = null;
let aiInsightsPanel = null;
let anomalyDetector = null;
let realTimeUpdater = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
  loadAnalyticsData();
  setupEventListeners();
  initializeAdvancedFeatures();
  setupAdvancedPatientJourney();
  setupAdvancedMedicalTrends();
  setupAdvancedDoctorPerformance();
  initializeAIInsights();
  startRealTimeUpdates();
});

/**
 * Initialize Dashboard
 */
function initializeDashboard() {
  console.log('🚀 Initializing Healthcare Analytics Dashboard...');
  
  // Initialize Chart.js defaults
  Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.position = 'bottom';
  
  // Create default charts
  createOverviewCharts();
  createPatientJourneyVisualization();
  createMedicalTrendsCharts();
  createDoctorPerformanceCharts();
}

/**
 * Load Analytics Data
 */
async function loadAnalyticsData() {
  try {
    showLoadingState();
    
    // Load overview data
    const overviewData = await fetchAnalyticsData('/api/analytics/overview');
    analyticsData.overview = overviewData;
    updateOverviewMetrics(overviewData);
    
    // Load patient journey data
    const journeyData = await fetchAnalyticsData('/api/analytics/patient-journey');
    analyticsData.patientJourney = journeyData;
    
    // Load medical trends data
    const trendsData = await fetchAnalyticsData('/api/analytics/medical-trends');
    analyticsData.medicalTrends = trendsData;
    
    // Load doctor performance data
    const performanceData = await fetchAnalyticsData('/api/analytics/doctor-performance');
    analyticsData.doctorPerformance = performanceData;
    
    // Update all visualizations
    updateAllCharts();
    
    hideLoadingState();
    
  } catch (error) {
    console.error('❌ Error loading analytics data:', error);
    showErrorState('Failed to load analytics data');
  }
}

/**
 * Fetch Analytics Data
 */
async function fetchAnalyticsData(endpoint) {
  // Simulate API calls with realistic healthcare data
  switch (endpoint) {
    case '/api/analytics/overview':
      return generateOverviewData();
    case '/api/analytics/patient-journey':
      return generatePatientJourneyData();
    case '/api/analytics/medical-trends':
      return generateMedicalTrendsData();
    case '/api/analytics/doctor-performance':
      return generateDoctorPerformanceData();
    default:
      throw new Error('Unknown endpoint');
  }
}

/**
 * Generate Sample Overview Data
 */
function generateOverviewData() {
  return {
    totalPatients: 2847,
    activeConsultations: 143,
    avgSatisfaction: 4.6,
    criticalAlerts: 7,
    changes: {
      patients: 12.5,
      consultations: 8.3,
      satisfaction: 2.1,
      alerts: -15.2
    },
    patientFlow: generateTimeSeriesData(30, 50, 200, 'patients'),
    conditions: {
      'Diabetes': 234,
      'Hypertension': 189,
      'Heart Disease': 145,
      'Asthma': 123,
      'Arthritis': 98,
      'Depression': 76
    },
    responseTime: {
      'Emergency': 5,
      'Urgent': 15,
      'Regular': 30,
      'Follow-up': 45
    },
    medicationAdherence: {
      'Excellent (90-100%)': 45,
      'Good (80-89%)': 32,
      'Fair (70-79%)': 15,
      'Poor (<70%)': 8
    }
  };
}

/**
 * Generate Sample Patient Journey Data
 */
function generatePatientJourneyData() {
  return {
    journeyStages: [
      { stage: 'Initial Consultation', patients: 1000, avgTime: 2, x: 100, y: 100 },
      { stage: 'Diagnosis', patients: 850, avgTime: 5, x: 300, y: 100 },
      { stage: 'Treatment Plan', patients: 720, avgTime: 3, x: 500, y: 100 },
      { stage: 'Treatment', patients: 680, avgTime: 14, x: 700, y: 100 },
      { stage: 'Follow-up', patients: 520, avgTime: 7, x: 500, y: 250 },
      { stage: 'Recovery', patients: 450, avgTime: 21, x: 300, y: 250 },
      { stage: 'Referral', patients: 180, avgTime: 3, x: 700, y: 250 },
      { stage: 'Emergency', patients: 120, avgTime: 1, x: 100, y: 250 }
    ],
    journeyConnections: [
      { source: 'Initial Consultation', target: 'Diagnosis', patients: 850 },
      { source: 'Diagnosis', target: 'Treatment Plan', patients: 720 },
      { source: 'Treatment Plan', target: 'Treatment', patients: 680 },
      { source: 'Treatment', target: 'Follow-up', patients: 520 },
      { source: 'Follow-up', target: 'Recovery', patients: 450 },
      { source: 'Treatment Plan', target: 'Referral', patients: 180 },
      { source: 'Emergency', target: 'Diagnosis', patients: 120 },
      { source: 'Referral', target: 'Treatment', patients: 150 }
    ],
    journeyMetrics: {
      avgJourneyTime: '52 days',
      completionRate: 78,
      dropoffRate: 22
    },
    commonPaths: [
      {
        path: 'Consultation → Diagnosis → Treatment → Recovery',
        percentage: 45,
        avgTime: 48
      },
      {
        path: 'Consultation → Diagnosis → Referral → Treatment',
        percentage: 28,
        avgTime: 62
      },
      {
        path: 'Emergency → Diagnosis → Treatment → Follow-up',
        percentage: 15,
        avgTime: 35
      }
    ]
  };
}

/**
 * Generate Sample Medical Trends Data
 */
function generateMedicalTrendsData() {
  return {
    consultationTrends: generateTimeSeriesData(90, 20, 80, 'consultations'),
    conditionTrends: {
      'Diabetes': generateTimeSeriesData(90, 15, 25),
      'Hypertension': generateTimeSeriesData(90, 12, 22),
      'Heart Disease': generateTimeSeriesData(90, 8, 18),
      'Respiratory': generateTimeSeriesData(90, 10, 20)
    },
    treatmentEffectiveness: {
      'Medication Therapy': 85,
      'Physical Therapy': 78,
      'Surgery': 92,
      'Counseling': 73,
      'Lifestyle Changes': 68
    },
    medicationTrends: {
      'Prescribed': generateTimeSeriesData(30, 150, 300, 'medications'),
      'Adherence': generateTimeSeriesData(30, 70, 95, 'percentage'),
      'Interactions': generateTimeSeriesData(30, 5, 25, 'interactions')
    }
  };
}

/**
 * Generate Sample Doctor Performance Data
 */
function generateDoctorPerformanceData() {
  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', rating: 4.8, patients: 145, consultations: 67 },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Internal Medicine', rating: 4.6, patients: 189, consultations: 89 },
    { id: 3, name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', rating: 4.9, patients: 203, consultations: 134 },
    { id: 4, name: 'Dr. David Thompson', specialty: 'Orthopedics', rating: 4.5, patients: 156, consultations: 78 },
    { id: 5, name: 'Dr. Lisa Park', specialty: 'Dermatology', rating: 4.7, patients: 167, consultations: 92 }
  ];

  return {
    totalDoctors: 25,
    avgSatisfaction: 4.6,
    avgResponseTime: '18 min',
    treatmentSuccessRate: 84,
    consultationsThisMonth: 1247,
    doctors: doctors,
    performanceMetrics: doctors.map(doc => ({
      name: doc.name,
      satisfaction: doc.rating,
      responseTime: Math.floor(Math.random() * 30) + 10,
      successRate: Math.floor(Math.random() * 20) + 75,
      consultations: doc.consultations
    })),
    distributionData: {
      'Excellent (4.5+)': 68,
      'Good (4.0-4.4)': 24,
      'Average (3.5-3.9)': 6,
      'Below Average (<3.5)': 2
    }
  };
}

/**
 * Generate Time Series Data
 */
function generateTimeSeriesData(days, min, max, label = 'value') {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    data.push({
      date: date.toISOString().split('T')[0],
      value: value,
      label: label
    });
  }
  
  return data;
}

/**
 * Update Overview Metrics
 */
function updateOverviewMetrics(data) {
  // Update stat cards
  document.getElementById('totalPatientsCount').textContent = data.totalPatients.toLocaleString();
  document.getElementById('activeConsultationsCount').textContent = data.activeConsultations;
  document.getElementById('avgSatisfactionScore').textContent = data.avgSatisfaction.toFixed(1);
  document.getElementById('criticalAlertsCount').textContent = data.criticalAlerts;
  
  // Update change indicators
  updateChangeIndicator('patientsChange', data.changes.patients, 'this month');
  updateChangeIndicator('consultationsChange', data.changes.consultations, 'this week');
  updateChangeIndicator('satisfactionChange', data.changes.satisfaction, 'this month');
  updateChangeIndicator('alertsChange', data.changes.alerts, 'this week', 'alerts');
}

/**
 * Update Change Indicator
 */
function updateChangeIndicator(elementId, change, period, suffix = '%') {
  const element = document.getElementById(elementId);
  const isPositive = change > 0;
  const isAlerts = suffix === 'alerts';
  
  // For alerts, positive change is bad, negative is good
  const className = isAlerts ? 
    (change > 0 ? 'negative' : change < 0 ? 'positive' : 'neutral') :
    (isPositive ? 'positive' : change < 0 ? 'negative' : 'neutral');
  
  const sign = change > 0 ? '+' : '';
  const displaySuffix = suffix === 'alerts' ? '' : suffix;
  
  element.className = `stat-change ${className}`;
  element.textContent = `${sign}${change.toFixed(1)}${displaySuffix} ${period}`;
}

/**
 * Create Overview Charts
 */
function createOverviewCharts() {
  // Patient Flow Chart
  const patientFlowCtx = document.getElementById('patientFlowChart').getContext('2d');
  charts.patientFlow = new Chart(patientFlowCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Daily Patients',
        data: [],
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              return new Date(tooltipItems[0].label).toLocaleDateString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#f3f4f6'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });

  // Health Conditions Chart
  const conditionsCtx = document.getElementById('conditionsChart').getContext('2d');
  charts.conditions = new Chart(conditionsCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: colors.gradients,
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });

  // Response Time Chart
  const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
  charts.responseTime = new Chart(responseTimeCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Response Time (minutes)',
        data: [],
        backgroundColor: [colors.danger, colors.warning, colors.info, colors.success],
        borderRadius: 8
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes'
          }
        }
      }
    }
  });

  // Medication Adherence Chart
  const adherenceCtx = document.getElementById('adherenceChart').getContext('2d');
  charts.adherence = new Chart(adherenceCtx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [colors.success, colors.info, colors.warning, colors.danger],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

/**
 * Create Patient Journey Visualization using D3.js
 */
function createPatientJourneyVisualization() {
  const container = d3.select("#patientJourneyViz");
  const width = container.node().clientWidth;
  const height = 500;
  
  // Clear existing visualization
  container.selectAll("*").remove();
  
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Create arrow marker
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("markerWidth", 10)
    .attr("markerHeight", 7)
    .attr("refX", 9)
    .attr("refY", 3.5)
    .attr("orient", "auto")
    .append("polygon")
    .attr("points", "0 0, 10 3.5, 0 7")
    .attr("fill", colors.primary);

  // Create journey stage chart
  const journeyStageCtx = document.getElementById('journeyStageChart').getContext('2d');
  charts.journeyStage = new Chart(journeyStageCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Patients',
        data: [],
        backgroundColor: colors.primary,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Setup Advanced Patient Journey Visualization
 */
function setupAdvancedPatientJourney() {
  const container = document.getElementById('patientJourneyViz');
  if (container && typeof AdvancedPatientJourney !== 'undefined') {
    patientJourneyViz = new AdvancedPatientJourney('#patientJourneyViz', {
      width: 1200,
      height: 600,
      colors: colors
    });
    
    // Listen for stage click events
    container.addEventListener('stageClick', (event) => {
      showAdvancedStageModal(event.detail);
    });
  }
}

/**
 * Setup Advanced Medical Trends Visualization
 */
function setupAdvancedMedicalTrends() {
  const container = document.getElementById('medicalTrendsChart');
  if (container && typeof AdvancedMedicalTrends !== 'undefined') {
    medicalTrendsViz = new AdvancedMedicalTrends(container, {
      width: 1200,
      height: 600,
      colors: colors
    });
  }
}

/**
 * Setup Advanced Doctor Performance Visualization
 */
function setupAdvancedDoctorPerformance() {
  const container = document.getElementById('doctorPerformanceChart');
  if (container && typeof AdvancedDoctorPerformance !== 'undefined') {
    doctorPerformanceViz = new AdvancedDoctorPerformance(container, {
      width: 1200,
      height: 700,
      colors: colors
    });
  }
}

/**
 * Update Patient Journey Visualization with Advanced D3.js
 */
function updatePatientJourneyVisualization(data) {
  // Use advanced visualization if available
  if (patientJourneyViz && data) {
    patientJourneyViz.updateVisualization(data);
    return;
  }
  const container = d3.select("#patientJourneyViz svg");
  const width = container.node() ? container.node().getBoundingClientRect().width : 800;
  const height = 500;
  
  if (!data.journeyStages) return;
  
  // Clear existing elements
  container.selectAll(".journey-element").remove();
  
  // Create scales for positioning
  const maxPatients = d3.max(data.journeyStages, d => d.patients);
  const radiusScale = d3.scaleSqrt()
    .domain([0, maxPatients])
    .range([20, 60]);
    
  // Create force simulation for dynamic positioning
  const nodes = data.journeyStages.map((stage, i) => ({
    ...stage,
    id: stage.stage,
    fx: stage.x || (i * (width / (data.journeyStages.length - 1)) + 100),
    fy: stage.y || (height / 2)
  }));
  
  // Create links from journey connections
  const links = data.journeyConnections ? data.journeyConnections.map(conn => {
    const sourceNode = nodes.find(n => n.stage === conn.source);
    const targetNode = nodes.find(n => n.stage === conn.target);
    return {
      source: sourceNode,
      target: targetNode,
      patients: conn.patients,
      strength: conn.patients / maxPatients
    };
  }).filter(link => link.source && link.target) : [];

  // Create tooltip
  const tooltip = d3.select("body").selectAll(".journey-tooltip")
    .data([0])
    .enter()
    .append("div")
    .attr("class", "journey-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000");

  // Add gradient backgrounds for nodes
  const gradients = container.select("defs").selectAll(".node-gradient")
    .data(nodes)
    .enter()
    .append("radialGradient")
    .attr("class", "node-gradient")
    .attr("id", d => `gradient-${d.id.replace(/\s+/g, '-')}`)
    .attr("cx", "30%")
    .attr("cy", "30%");
    
  gradients.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colors.primary)
    .attr("stop-opacity", 0.9);
    
  gradients.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colors.primaryDark)
    .attr("stop-opacity", 1);

  // Create link lines with animated flow
  const linkGroup = container.append("g").attr("class", "journey-element links-group");
  
  const linkLines = linkGroup.selectAll(".journey-link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "journey-element journey-link")
    .attr("stroke", colors.primary)
    .attr("stroke-width", d => Math.max(2, d.strength * 8))
    .attr("stroke-opacity", 0.6)
    .attr("fill", "none")
    .attr("marker-end", "url(#arrowhead)")
    .style("cursor", "pointer");
    
  // Add animated flow particles
  const particles = linkGroup.selectAll(".flow-particle")
    .data(links.filter(d => d.patients > 50))
    .enter()
    .append("circle")
    .attr("class", "journey-element flow-particle")
    .attr("r", 3)
    .attr("fill", colors.warning)
    .attr("opacity", 0.8);

  // Create stage nodes group
  const nodeGroup = container.append("g").attr("class", "journey-element nodes-group");
  
  const stageNodes = nodeGroup.selectAll(".journey-stage")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "journey-element journey-stage")
    .attr("transform", d => `translate(${d.fx}, ${d.fy})`)
    .style("cursor", "pointer")
    .on("mouseenter", function(event, d) {
      d3.select(this).select("circle").transition().duration(200)
        .attr("r", radiusScale(d.patients) + 5)
        .attr("stroke-width", 4);
        
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.stage}</strong><br/>
          Patients: ${d.patients.toLocaleString()}<br/>
          Avg Time: ${d.avgTime} days<br/>
          Success Rate: ${(85 + Math.random() * 10).toFixed(1)}%
        `);
    })
    .on("mousemove", function(event) {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseleave", function(event, d) {
      d3.select(this).select("circle").transition().duration(200)
        .attr("r", radiusScale(d.patients))
        .attr("stroke-width", 3);
        
      tooltip.style("visibility", "hidden");
    })
    .on("click", function(event, d) {
      // Show detailed stage information
      showStageDetails(d);
    });

  // Add circles for stages with animations
  const circles = stageNodes.append("circle")
    .attr("r", 0)
    .attr("fill", d => `url(#gradient-${d.id.replace(/\s+/g, '-')})`)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 3)
    .attr("class", "journey-node")
    .transition()
    .duration(1000)
    .delay((d, i) => i * 100)
    .attr("r", d => radiusScale(d.patients));

  // Add stage labels with better positioning
  stageNodes.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.3em")
    .attr("class", "journey-text stage-label")
    .style("font-weight", "bold")
    .style("fill", "white")
    .style("font-size", "11px")
    .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
    .text(d => {
      const words = d.stage.split(' ');
      return words.length > 2 ? words.slice(0, 2).join(' ') : d.stage;
    })
    .each(function(d) {
      const words = d.stage.split(' ');
      if (words.length > 2) {
        d3.select(this.parentNode)
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.7em")
          .attr("class", "journey-text stage-label")
          .style("font-weight", "bold")
          .style("fill", "white")
          .style("font-size", "11px")
          .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
          .text(words.slice(2).join(' '));
      }
    });

  // Add patient count badges
  stageNodes.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "2.2em")
    .attr("class", "journey-text patient-count")
    .style("fill", "white")
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
    .text(d => d.patients.toLocaleString());

  // Add time labels with icons
  stageNodes.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", d => radiusScale(d.patients) + 25)
    .attr("class", "journey-text time-label")
    .style("font-size", "11px")
    .style("fill", "#666")
    .style("font-weight", "500")
    .text(d => `⏱ ${d.avgTime} days`);

  // Update link paths with curved connections
  linkLines.attr("d", d => {
    const dx = d.target.fx - d.source.fx;
    const dy = d.target.fy - d.source.fy;
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
    return `M${d.source.fx},${d.source.fy}A${dr},${dr} 0 0,1 ${d.target.fx},${d.target.fy}`;
  });
  
  // Animate flow particles along paths
  particles.each(function(d) {
    const particle = d3.select(this);
    const path = linkLines.filter(link => link === d).node();
    if (path) {
      const pathLength = path.getTotalLength();
      
      function animateParticle() {
        particle
          .attr("opacity", 0)
          .transition()
          .duration(50)
          .attr("opacity", 0.8)
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attrTween("transform", function() {
            return function(t) {
              const point = path.getPointAtLength(t * pathLength);
              return `translate(${point.x},${point.y})`;
            };
          })
          .transition()
          .duration(50)
          .attr("opacity", 0)
          .on("end", animateParticle);
      }
      
      // Start animation with random delay
      setTimeout(animateParticle, Math.random() * 2000);
    }
  });

  // Update journey metrics
  if (data.journeyMetrics) {
    document.getElementById('avgJourneyTime').textContent = data.journeyMetrics.avgJourneyTime;
    document.getElementById('completionRate').textContent = data.journeyMetrics.completionRate + '%';
    document.getElementById('dropoffRate').textContent = data.journeyMetrics.dropoffRate + '%';
  }
}

/**
 * Show Stage Details Modal
 */
function showStageDetails(stageData) {
  // Create modal with detailed stage information
  const modal = d3.select('body').append('div')
    .attr('class', 'stage-details-modal')
    .style('position', 'fixed')
    .style('top', '50%')
    .style('left', '50%')
    .style('transform', 'translate(-50%, -50%)')
    .style('background', 'white')
    .style('padding', '24px')
    .style('border-radius', '12px')
    .style('box-shadow', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)')
    .style('z-index', '9999')
    .style('max-width', '400px')
    .style('width', '90%');
    
  modal.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('align-items', 'center')
    .style('margin-bottom', '16px')
    .call(div => {
      div.append('h3')
        .style('margin', '0')
        .style('color', colors.primaryDark)
        .text(stageData.stage);
        
      div.append('button')
        .style('background', 'none')
        .style('border', 'none')
        .style('font-size', '24px')
        .style('cursor', 'pointer')
        .style('color', '#666')
        .text('×')
        .on('click', () => modal.remove());
    });
    
  const details = modal.append('div')
    .style('color', '#374151');
    
  details.append('div')
    .style('margin-bottom', '12px')
    .html(`<strong>Total Patients:</strong> ${stageData.patients.toLocaleString()}`);
    
  details.append('div')
    .style('margin-bottom', '12px')
    .html(`<strong>Average Duration:</strong> ${stageData.avgTime} days`);
    
  details.append('div')
    .style('margin-bottom', '12px')
    .html(`<strong>Success Rate:</strong> ${(85 + Math.random() * 10).toFixed(1)}%`);
    
  details.append('div')
    .style('margin-bottom', '12px')
    .html(`<strong>Completion Rate:</strong> ${(75 + Math.random() * 15).toFixed(1)}%`);
    
  // Add overlay
  d3.select('body').append('div')
    .attr('class', 'modal-overlay')
    .style('position', 'fixed')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'rgba(0, 0, 0, 0.5)')
    .style('z-index', '9998')
    .on('click', () => {
      modal.remove();
      d3.select('.modal-overlay').remove();
    });
}

/**
 * Create Medical Trends Charts
 */
function createMedicalTrendsCharts() {
  // Medical Trends Chart
  const trendsCtx = document.getElementById('medicalTrendsChart').getContext('2d');
  charts.medicalTrends = new Chart(trendsCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });

  // Top Conditions Chart
  const topConditionsCtx = document.getElementById('topConditionsChart').getContext('2d');
  charts.topConditions = new Chart(topConditionsCtx, {
    type: 'horizontalBar',
    data: {
      labels: [],
      datasets: [{
        label: 'Cases',
        data: [],
        backgroundColor: colors.gradients.slice(0, 6)
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  // Treatment Effectiveness Chart
  const effectivenessCtx = document.getElementById('treatmentEffectivenessChart').getContext('2d');
  charts.treatmentEffectiveness = new Chart(effectivenessCtx, {
    type: 'radar',
    data: {
      labels: [],
      datasets: [{
        label: 'Effectiveness %',
        data: [],
        backgroundColor: colors.primary + '40',
        borderColor: colors.primary,
        pointBackgroundColor: colors.primary
      }]
    },
    options: {
      elements: {
        line: {
          borderWidth: 3
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  // Medication Trends Chart
  const medicationTrendsCtx = document.getElementById('medicationTrendsChart').getContext('2d');
  charts.medicationTrends = new Chart(medicationTrendsCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Create Doctor Performance Charts
 */
function createDoctorPerformanceCharts() {
  // Doctor Performance Comparison Chart
  const performanceCtx = document.getElementById('doctorPerformanceChart').getContext('2d');
  charts.doctorPerformance = new Chart(performanceCtx, {
    type: 'radar',
    data: {
      labels: ['Patient Satisfaction', 'Response Time', 'Success Rate', 'Consultations', 'Availability'],
      datasets: []
    },
    options: {
      elements: {
        line: {
          borderWidth: 2
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  // Performance Distribution Chart
  const distributionCtx = document.getElementById('performanceDistributionChart').getContext('2d');
  charts.performanceDistribution = new Chart(distributionCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [colors.success, colors.info, colors.warning, colors.danger]
      }]
    }
  });

  // Doctor Satisfaction Trend Chart
  const satisfactionTrendCtx = document.getElementById('doctorSatisfactionTrend').getContext('2d');
  charts.doctorSatisfactionTrend = new Chart(satisfactionTrendCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Satisfaction Rating',
        data: [],
        borderColor: colors.success,
        backgroundColor: colors.success + '20',
        tension: 0.4
      }]
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 5
        }
      }
    }
  });

  // Doctor Workload Chart
  const workloadCtx = document.getElementById('doctorWorkloadChart').getContext('2d');
  charts.doctorWorkload = new Chart(workloadCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Consultations',
        data: [],
        backgroundColor: colors.info
      }]
    }
  });
}

/**
 * Update All Charts
 */
function updateAllCharts() {
  updateOverviewCharts();
  updatePatientJourneyCharts();
  updateMedicalTrendsCharts();
  updateDoctorPerformanceCharts();
}

/**
 * Update Overview Charts
 */
function updateOverviewCharts() {
  const data = analyticsData.overview;
  
  // Update Patient Flow Chart
  if (data.patientFlow && charts.patientFlow) {
    charts.patientFlow.data.labels = data.patientFlow.map(d => d.date);
    charts.patientFlow.data.datasets[0].data = data.patientFlow.map(d => d.value);
    charts.patientFlow.update();
  }
  
  // Update Conditions Chart
  if (data.conditions && charts.conditions) {
    charts.conditions.data.labels = Object.keys(data.conditions);
    charts.conditions.data.datasets[0].data = Object.values(data.conditions);
    charts.conditions.update();
  }
  
  // Update Response Time Chart
  if (data.responseTime && charts.responseTime) {
    charts.responseTime.data.labels = Object.keys(data.responseTime);
    charts.responseTime.data.datasets[0].data = Object.values(data.responseTime);
    charts.responseTime.update();
  }
  
  // Update Adherence Chart
  if (data.medicationAdherence && charts.adherence) {
    charts.adherence.data.labels = Object.keys(data.medicationAdherence);
    charts.adherence.data.datasets[0].data = Object.values(data.medicationAdherence);
    charts.adherence.update();
  }
}

/**
 * Update Patient Journey Charts
 */
function updatePatientJourneyCharts() {
  const data = analyticsData.patientJourney;
  
  // Update D3 visualization
  updatePatientJourneyVisualization(data);
  
  // Update Journey Stage Chart
  if (data.journeyStages && charts.journeyStage) {
    charts.journeyStage.data.labels = data.journeyStages.map(d => d.stage);
    charts.journeyStage.data.datasets[0].data = data.journeyStages.map(d => d.patients);
    charts.journeyStage.update();
  }
}

/**
 * Update Medical Trends Charts with Advanced Analytics
 */
function updateMedicalTrendsCharts() {
  const data = analyticsData.medicalTrends;
  
  // Use advanced visualization if available
  if (medicalTrendsViz && data) {
    medicalTrendsViz.updateVisualization(data);
    return;
  }
  
  // Fallback to basic chart
  if (data.conditionTrends && charts.medicalTrends) {
    charts.medicalTrends.data.labels = data.consultationTrends.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Create main condition trend datasets
    charts.medicalTrends.data.datasets = Object.keys(data.conditionTrends).map((condition, index) => ({
      label: condition,
      data: data.conditionTrends[condition].map(d => d.value),
      borderColor: colors.gradients[index % colors.gradients.length],
      backgroundColor: colors.gradients[index % colors.gradients.length] + '20',
      tension: 0.4,
      pointBackgroundColor: colors.gradients[index % colors.gradients.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true
    }));
    
    // Add moving average trend lines
    Object.keys(data.conditionTrends).slice(0, 2).forEach((condition, index) => {
      const movingAvg = calculateMovingAverage(data.conditionTrends[condition].map(d => d.value), 7);
      charts.medicalTrends.data.datasets.push({
        label: `${condition} (7-day avg)`,
        data: movingAvg,
        borderColor: colors.gradients[index % colors.gradients.length],
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 3
      });
    });
    
    // Enhanced chart options
    charts.medicalTrends.options.plugins = {
      ...charts.medicalTrends.options.plugins,
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        callbacks: {
          afterBody: function(tooltipItems) {
            const total = tooltipItems.reduce((sum, item) => sum + (item.raw || 0), 0);
            return `\nTotal cases: ${total}\nTrend: ${total > 100 ? '↗️ Rising' : '↘️ Declining'}`;
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    };
    
    charts.medicalTrends.update();
  }
  
  // Update Treatment Effectiveness Chart with benchmarking
  if (data.treatmentEffectiveness && charts.treatmentEffectiveness) {
    charts.treatmentEffectiveness.data.labels = Object.keys(data.treatmentEffectiveness);
    charts.treatmentEffectiveness.data.datasets = [
      {
        label: 'Current Performance',
        data: Object.values(data.treatmentEffectiveness),
        backgroundColor: colors.primary + '40',
        borderColor: colors.primary,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Industry Benchmark',
        data: Object.values(data.treatmentEffectiveness).map(val => Math.max(0, val - 8 + Math.random() * 10)),
        backgroundColor: colors.info + '20',
        borderColor: colors.info,
        pointBackgroundColor: colors.info,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderDash: [5, 5]
      }
    ];
    
    // Enhanced radar chart options
    charts.treatmentEffectiveness.options.plugins = {
      ...charts.treatmentEffectiveness.options.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const benchmark = context.dataset.label === 'Industry Benchmark' ? 
              context.parsed.r : 
              charts.treatmentEffectiveness.data.datasets[1].data[context.dataIndex];
            const current = context.dataset.label === 'Current Performance' ? 
              context.parsed.r : 
              charts.treatmentEffectiveness.data.datasets[0].data[context.dataIndex];
            const diff = current - benchmark;
            const status = diff > 0 ? 'Above' : 'Below';
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}% (${status} benchmark by ${Math.abs(diff).toFixed(1)}%)`;
          }
        }
      }
    };
    
    charts.treatmentEffectiveness.update();
  }
  
  // Update Advanced Medication Trends Chart
  if (data.medicationTrends && charts.medicationTrends) {
    const labels = data.medicationTrends.Prescribed.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    charts.medicationTrends.data.labels = labels;
    
    charts.medicationTrends.data.datasets = [
      {
        label: 'Medications Prescribed',
        data: data.medicationTrends.Prescribed.map(d => d.value),
        borderColor: colors.primary,
        backgroundColor: colors.primary + '30',
        tension: 0.4,
        yAxisID: 'y',
        fill: true,
        type: 'line'
      },
      {
        label: 'Adherence Rate (%)',
        data: data.medicationTrends.Adherence.map(d => d.value),
        borderColor: colors.success,
        backgroundColor: colors.success + '30',
        tension: 0.4,
        yAxisID: 'y1',
        fill: false,
        type: 'line',
        pointStyle: 'triangle'
      },
      {
        label: 'Drug Interactions',
        data: data.medicationTrends.Interactions.map(d => d.value),
        backgroundColor: colors.danger + '60',
        borderColor: colors.danger,
        yAxisID: 'y',
        type: 'bar',
        borderWidth: 1
      }
    ];
    
    // Enhanced scales configuration
    charts.medicationTrends.options.scales = {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
          color: colors.primaryDark,
          font: { weight: 'bold' }
        },
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Adherence (%)',
          color: colors.success,
          font: { weight: 'bold' }
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    };
    
    // Enhanced interaction and plugins
    charts.medicationTrends.options.interaction = {
      mode: 'index',
      intersect: false
    };
    
    charts.medicationTrends.options.plugins = {
      ...charts.medicationTrends.options.plugins,
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        callbacks: {
          afterBody: function(tooltipItems) {
            const prescribed = tooltipItems.find(item => item.dataset.label.includes('Prescribed'))?.raw || 0;
            const adherence = tooltipItems.find(item => item.dataset.label.includes('Adherence'))?.raw || 0;
            const interactions = tooltipItems.find(item => item.dataset.label.includes('Interactions'))?.raw || 0;
            
            let analysis = '\nMedication Analysis:';
            if (adherence > 85) analysis += '\n• Excellent adherence rate';
            else if (adherence > 70) analysis += '\n• Good adherence rate';
            else analysis += '\n• Poor adherence - needs attention';
            
            if (interactions > 15) analysis += '\n• High interaction risk';
            else if (interactions > 5) analysis += '\n• Moderate interaction risk';
            else analysis += '\n• Low interaction risk';
            
            return analysis;
          }
        }
      }
    };
    
    charts.medicationTrends.update();
  }

  // Update top conditions chart
  updateTopConditionsChart(data);
}

/**
 * Calculate Moving Average
 */
function calculateMovingAverage(data, window) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = data.slice(start, i + 1);
    const average = subset.reduce((sum, val) => sum + val, 0) / subset.length;
    result.push(i < window - 1 ? null : average);
  }
  return result;
}

/**
 * Update Top Conditions Chart
 */
function updateTopConditionsChart(data) {
  if (charts.topConditions) {
    const topConditionsData = [
      { condition: 'Diabetes', cases: 234, trend: 'up' },
      { condition: 'Hypertension', cases: 189, trend: 'stable' },
      { condition: 'Heart Disease', cases: 145, trend: 'down' },
      { condition: 'Respiratory', cases: 123, trend: 'up' },
      { condition: 'Mental Health', cases: 98, trend: 'up' },
      { condition: 'Arthritis', cases: 76, trend: 'stable' }
    ];
    
    charts.topConditions.data.labels = topConditionsData.map(d => d.condition);
    charts.topConditions.data.datasets[0].data = topConditionsData.map(d => d.cases);
    charts.topConditions.data.datasets[0].backgroundColor = topConditionsData.map(d => {
      switch(d.trend) {
        case 'up': return colors.danger + '80';
        case 'down': return colors.success + '80';
        default: return colors.warning + '80';
      }
    });
    
    // Add trend indicators in tooltip
    charts.topConditions.options.plugins = {
      ...charts.topConditions.options.plugins,
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const trend = topConditionsData[context.dataIndex].trend;
            const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
            const trendText = trend === 'up' ? 'Rising' : trend === 'down' ? 'Declining' : 'Stable';
            return `Trend: ${trendIcon} ${trendText}`;
          }
        }
      }
    };
    
    charts.topConditions.update();
  }
}

/**
 * Update Doctor Performance Charts
 */
function updateDoctorPerformanceCharts() {
  const data = analyticsData.doctorPerformance;
  
  // Use advanced visualization if available
  if (doctorPerformanceViz && data) {
    doctorPerformanceViz.updateVisualization(data);
    return;
  }
  
  // Fallback to basic metrics update
  // Update overview metrics
  if (data.totalDoctors) {
    document.getElementById('totalDoctorsCount').textContent = data.totalDoctors;
    document.getElementById('avgPatientSatisfaction').textContent = data.avgSatisfaction.toFixed(1);
    document.getElementById('avgResponseTime').textContent = data.avgResponseTime;
    document.getElementById('treatmentSuccessRate').textContent = data.treatmentSuccessRate + '%';
    document.getElementById('consultationsThisMonth').textContent = data.consultationsThisMonth.toLocaleString();
  }
  
  // Update Performance Distribution Chart
  if (data.distributionData && charts.performanceDistribution) {
    charts.performanceDistribution.data.labels = Object.keys(data.distributionData);
    charts.performanceDistribution.data.datasets[0].data = Object.values(data.distributionData);
    charts.performanceDistribution.update();
  }
  
  // Populate doctor select dropdown
  const doctorSelect = document.getElementById('doctorSelect');
  if (data.doctors && doctorSelect) {
    doctorSelect.innerHTML = '<option value="">Select Doctor for Detailed Analysis</option>';
    data.doctors.forEach(doctor => {
      const option = document.createElement('option');
      option.value = doctor.id;
      option.textContent = `${doctor.name} - ${doctor.specialty}`;
      doctorSelect.appendChild(option);
    });
  }
  
  // Update rankings table
  updateDoctorRankingsTable(data);
}

/**
 * Update Doctor Rankings Table
 */
function updateDoctorRankingsTable(data) {
  const tableContainer = document.getElementById('doctorRankingsTable');
  if (!data.performanceMetrics || !tableContainer) return;
  
  const sortedDoctors = data.performanceMetrics.sort((a, b) => b.satisfaction - a.satisfaction);
  
  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-light">
          <tr>
            <th>Rank</th>
            <th>Doctor</th>
            <th>Satisfaction</th>
            <th>Response Time</th>
            <th>Success Rate</th>
            <th>Consultations</th>
            <th>Performance</th>
          </tr>
        </thead>
        <tbody>
          ${sortedDoctors.map((doctor, index) => `
            <tr>
              <td>
                <span class="badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}">
                  ${index + 1}${index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                </span>
              </td>
              <td><strong>${doctor.name}</strong></td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="me-2">${doctor.satisfaction.toFixed(1)}</span>
                  <div class="progress flex-grow-1" style="height: 8px;">
                    <div class="progress-bar bg-success" 
                         style="width: ${(doctor.satisfaction / 5) * 100}%"></div>
                  </div>
                </div>
              </td>
              <td>${doctor.responseTime} min</td>
              <td>
                <span class="badge bg-${doctor.successRate >= 85 ? 'success' : doctor.successRate >= 75 ? 'warning' : 'danger'}">
                  ${doctor.successRate}%
                </span>
              </td>
              <td>${doctor.consultations}</td>
              <td>
                <div class="trend-indicator ${doctor.satisfaction >= 4.5 ? 'trend-up' : doctor.satisfaction >= 4.0 ? 'trend-stable' : 'trend-down'}">
                  <i class="fas fa-${doctor.satisfaction >= 4.5 ? 'arrow-up' : doctor.satisfaction >= 4.0 ? 'minus' : 'arrow-down'}"></i>
                  ${doctor.satisfaction >= 4.5 ? 'Excellent' : doctor.satisfaction >= 4.0 ? 'Good' : 'Needs Improvement'}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  tableContainer.innerHTML = tableHTML;
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Tab change events
  document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', function(e) {
      const targetId = e.target.getAttribute('data-bs-target');
      handleTabChange(targetId);
    });
  });

  // Doctor selection change
  document.getElementById('doctorSelect').addEventListener('change', function(e) {
    updateDoctorDetails(e.target.value);
  });

  // Filter updates
  document.getElementById('journeyTimeRange').addEventListener('change', updatePatientJourney);
  document.getElementById('trendTimeRange').addEventListener('change', updateMedicalTrends);
  
  // Window resize
  window.addEventListener('resize', debounce(handleResize, 250));
}

/**
 * Handle Tab Change
 */
function handleTabChange(targetId) {
  // Trigger chart updates when tabs become visible
  setTimeout(() => {
    Object.values(charts).forEach(chart => {
      if (chart && chart.resize) {
        chart.resize();
      }
    });
  }, 100);
}

/**
 * Update Doctor Details
 */
function updateDoctorDetails(doctorId) {
  if (!doctorId) return;
  
  const doctor = analyticsData.doctorPerformance.doctors.find(d => d.id == doctorId);
  if (!doctor) return;
  
  // Generate satisfaction trend data
  const satisfactionData = generateTimeSeriesData(30, 4.0, 5.0);
  
  // Update satisfaction trend chart
  if (charts.doctorSatisfactionTrend) {
    charts.doctorSatisfactionTrend.data.labels = satisfactionData.map(d => 
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    charts.doctorSatisfactionTrend.data.datasets[0].data = satisfactionData.map(d => d.value);
    charts.doctorSatisfactionTrend.update();
  }
  
  // Generate workload data
  const workloadData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    consultations: Math.floor(Math.random() * 15) + 5
  }));
  
  // Update workload chart
  if (charts.doctorWorkload) {
    charts.doctorWorkload.data.labels = workloadData.map(d => d.day);
    charts.doctorWorkload.data.datasets[0].data = workloadData.map(d => d.consultations);
    charts.doctorWorkload.update();
  }
}

/**
 * Update Patient Journey
 */
function updatePatientJourney() {
  console.log('🔄 Updating patient journey...');
  // Re-fetch and update patient journey data
  loadAnalyticsData();
}

/**
 * Update Medical Trends
 */
function updateMedicalTrends() {
  console.log('🔄 Updating medical trends...');
  // Re-fetch and update medical trends data
  loadAnalyticsData();
}

/**
 * Handle Window Resize
 */
function handleResize() {
  // Recreate D3 visualization on resize
  if (analyticsData.patientJourney.journeyStages) {
    createPatientJourneyVisualization();
    updatePatientJourneyVisualization(analyticsData.patientJourney);
  }
  
  // Update all charts
  Object.values(charts).forEach(chart => {
    if (chart && chart.resize) {
      chart.resize();
    }
  });
}

/**
 * Show Loading State
 */
function showLoadingState() {
  // Add loading spinners to main containers
  const containers = [
    '#overview', '#patient-journey', '#medical-trends', '#doctor-performance'
  ];
  
  containers.forEach(containerId => {
    const container = document.querySelector(containerId);
    if (container) {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.id = 'loading-' + containerId.replace('#', '');
      container.appendChild(spinner);
    }
  });
}

/**
 * Hide Loading State
 */
function hideLoadingState() {
  document.querySelectorAll('[id^="loading-"]').forEach(spinner => {
    spinner.remove();
  });
}

/**
 * Show Error State
 */
function showErrorState(message) {
  console.error('❌ Analytics Error:', message);
  
  // Create error notification
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger alert-dismissible fade show';
  errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
  errorDiv.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <div>${message}</div>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

/**
 * Debounce Function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialize AI Insights Panel
 */
function initializeAIInsights() {
  createAIInsightsPanel();
  setupAnomalyDetection();
}

/**
 * Create AI Insights Panel
 */
function createAIInsightsPanel() {
  const insightsContainer = document.createElement('div');
  insightsContainer.id = 'aiInsightsPanel';
  insightsContainer.className = 'ai-insights-panel';
  insightsContainer.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 350px;
    max-height: calc(100vh - 100px);
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow-y: auto;
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(insightsContainer);
  
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.id = 'aiInsightsToggle';
  toggleButton.className = 'btn btn-primary';
  toggleButton.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1001;
    border-radius: 50px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  `;
  toggleButton.innerHTML = '<i class="fas fa-brain"></i>';
  
  document.body.appendChild(toggleButton);
  
  // Toggle functionality
  let isOpen = false;
  toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    insightsContainer.style.transform = isOpen ? 'translateX(0)' : 'translateX(400px)';
    toggleButton.style.right = isOpen ? '380px' : '20px';
  });
}

/**
 * Setup Anomaly Detection
 */
function setupAnomalyDetection() {
  // Simulate anomaly detection with periodic checks
  setInterval(async () => {
    try {
      const anomalies = await detectCurrentAnomalies();
      if (anomalies.length > 0) {
        displayAnomalyAlerts(anomalies);
      }
    } catch (error) {
      console.error('Anomaly detection error:', error);
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Detect Current Anomalies
 */
async function detectCurrentAnomalies() {
  // Simulate anomaly detection logic
  const currentMetrics = analyticsData.realTimeMetrics;
  const anomalies = [];
  
  // Example anomaly checks
  if (currentMetrics.avgWaitTime > 30) {
    anomalies.push({
      type: 'operational',
      severity: 'high',
      title: 'Unusual Wait Time Spike',
      description: `Average wait time is ${currentMetrics.avgWaitTime} minutes`,
      timestamp: new Date(),
      actions: ['Deploy additional staff', 'Open more service points']
    });
  }
  
  if (currentMetrics.emergencyAlerts > 8) {
    anomalies.push({
      type: 'clinical',
      severity: 'critical',
      title: 'High Emergency Alert Volume',
      description: `${currentMetrics.emergencyAlerts} emergency alerts active`,
      timestamp: new Date(),
      actions: ['Activate emergency protocol', 'Contact specialists']
    });
  }
  
  return anomalies;
}

/**
 * Display Anomaly Alerts
 */
function displayAnomalyAlerts(anomalies) {
  anomalies.forEach(anomaly => {
    const alert = document.createElement('div');
    alert.className = `alert alert-${anomaly.severity === 'critical' ? 'danger' : 'warning'} alert-dismissible fade show`;
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      min-width: 400px;
      max-width: 600px;
    `;
    
    alert.innerHTML = `
      <div class="d-flex align-items-start">
        <i class="fas fa-${anomaly.severity === 'critical' ? 'exclamation-triangle' : 'exclamation-circle'} me-3 mt-1"></i>
        <div class="flex-grow-1">
          <h6 class="mb-1">${anomaly.title}</h6>
          <p class="mb-2">${anomaly.description}</p>
          <small class="text-muted">${anomaly.timestamp.toLocaleTimeString()}</small>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 10000);
  });
}

/**
 * Start Real-time Updates
 */
function startRealTimeUpdates() {
  // Initial load
  updateRealTimeMetrics();
  
  // Update every 5 seconds
  realTimeUpdater = setInterval(updateRealTimeMetrics, 5000);
}

/**
 * Update Real-time Metrics
 */
async function updateRealTimeMetrics() {
  try {
    // Simulate real-time data fetch
    const realTimeData = {
      activePatients: Math.floor(Math.random() * 50) + 120,
      emergencyAlerts: Math.floor(Math.random() * 8) + 2,
      avgWaitTime: Math.floor(Math.random() * 15) + 15,
      bedAvailability: Math.floor(Math.random() * 20) + 80,
      criticalPatients: Math.floor(Math.random() * 5) + 3
    };
    
    analyticsData.realTimeMetrics = realTimeData;
    
    // Update real-time display elements
    updateRealTimeDisplay(realTimeData);
    
  } catch (error) {
    console.error('Real-time update error:', error);
  }
}

/**
 * Update Real-time Display
 */
function updateRealTimeDisplay(data) {
  // Update any real-time metrics displays
  const realTimeElements = {
    activePatients: document.getElementById('activePatients'),
    emergencyAlerts: document.getElementById('emergencyAlerts'),
    avgWaitTime: document.getElementById('avgWaitTime'),
    bedAvailability: document.getElementById('bedAvailability')
  };
  
  Object.keys(realTimeElements).forEach(key => {
    const element = realTimeElements[key];
    if (element && data[key] !== undefined) {
      element.textContent = data[key];
    }
  });
}

/**
 * Show Advanced Stage Modal
 */
function showAdvancedStageModal(stageData) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${stageData.stage} - Detailed Analysis</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-4">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">Key Metrics</h6>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-6">
                      <div class="text-center">
                        <div class="h4 text-primary">${stageData.patients.toLocaleString()}</div>
                        <small class="text-muted">Total Patients</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-center">
                        <div class="h4 text-info">${stageData.avgTime} days</div>
                        <small class="text-muted">Average Duration</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-center">
                        <div class="h4 text-success">${((stageData.completionRate || 0.9) * 100).toFixed(1)}%</div>
                        <small class="text-muted">Completion Rate</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-center">
                        <div class="h4 text-warning">${(stageData.satisfactionScore || 4.0).toFixed(1)}/5.0</div>
                        <small class="text-muted">Satisfaction</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">Common Issues</h6>
                </div>
                <div class="card-body">
                  ${stageData.commonIssues ? `
                    <ul class="list-unstyled mb-0">
                      ${stageData.commonIssues.map(issue => `
                        <li class="mb-2">
                          <i class="fas fa-exclamation-circle text-warning me-2"></i>
                          ${issue}
                        </li>
                      `).join('')}
                    </ul>
                  ` : '<p class="text-muted mb-0">No common issues identified</p>'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" onclick="exportStageAnalysis('${stageData.id}')">
            <i class="fas fa-download me-1"></i>Export Analysis
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  
  // Clean up when modal is hidden
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}

/**
 * Export Stage Analysis
 */
function exportStageAnalysis(stageId) {
  const stageData = analyticsData.patientJourney.journeyStages?.find(s => s.id === stageId);
  if (!stageData) return;
  
  const analysisData = {
    stage: stageData.stage,
    metrics: {
      patients: stageData.patients,
      avgTime: stageData.avgTime,
      completionRate: stageData.completionRate || 0.9,
      satisfactionScore: stageData.satisfactionScore || 4.0
    },
    issues: stageData.commonIssues || [],
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stageData.stage.replace(/\s+/g, '_')}_analysis.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export for global access
window.AnalyticsDashboard = {
  loadAnalyticsData,
  updatePatientJourney,
  updateMedicalTrends,
  updateAllCharts,
  exportDashboardData,
  initializeAdvancedFeatures,
  patientJourneyViz: () => patientJourneyViz,
  startRealTimeUpdates,
  stopRealTimeUpdates: () => clearInterval(realTimeUpdater)
};

// Advanced Dashboard Features

/**
 * Initialize Advanced Features
 */
function initializeAdvancedFeatures() {
  initializeDateRangeFilter();
  initializeRealTimeUpdates();
  initializeAdvancedSearch();
  initializeThemeToggle();
  createAdvancedDoctorAnalysis();
  console.log('🚀 Advanced dashboard features initialized');
}

/**
 * Date Range Filter Implementation
 */
function initializeDateRangeFilter() {
  const dateRangeElements = {
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    applyFilter: document.getElementById('applyDateFilter'),
    quickFilters: document.querySelectorAll('.quick-date-filter')
  };
  
  // Set default date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  if (dateRangeElements.startDate) {
    dateRangeElements.startDate.value = startDate.toISOString().split('T')[0];
  }
  if (dateRangeElements.endDate) {
    dateRangeElements.endDate.value = endDate.toISOString().split('T')[0];
  }
  
  // Quick filter buttons
  dateRangeElements.quickFilters.forEach(button => {
    button.addEventListener('click', function() {
      const range = this.dataset.range;
      setQuickDateRange(range);
      refreshDashboardData();
    });
  });
  
  // Apply custom date range
  if (dateRangeElements.applyFilter) {
    dateRangeElements.applyFilter.addEventListener('click', function() {
      refreshDashboardData();
      showSuccessNotification('Date range updated successfully!');
    });
  }
}

/**
 * Set Quick Date Range
 */
function setQuickDateRange(range) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch(range) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }
  
  const startEl = document.getElementById('startDate');
  const endEl = document.getElementById('endDate');
  if (startEl) startEl.value = startDate.toISOString().split('T')[0];
  if (endEl) endEl.value = endDate.toISOString().split('T')[0];
}

/**
 * Refresh Dashboard Data
 */
function refreshDashboardData() {
  showLoadingState('Refreshing dashboard data...');
  
  // Simulate data refresh delay
  setTimeout(() => {
    loadAnalyticsData();
  }, 1000);
}

/**
 * Export Dashboard Data
 */
function exportDashboardData(format) {
  showLoadingState('Preparing export...');
  
  try {
    const exportData = {
      overview: analyticsData.overview,
      patientJourney: analyticsData.patientJourney,
      medicalTrends: analyticsData.medicalTrends,
      doctorPerformance: analyticsData.doctorPerformance,
      exportDate: new Date().toISOString(),
      dateRange: {
        start: document.getElementById('startDate')?.value,
        end: document.getElementById('endDate')?.value
      }
    };
    
    if (format === 'json') {
      exportToJSON(exportData);
    } else if (format === 'csv') {
      exportToCSV(exportData);
    }
    
    hideLoadingState();
    showSuccessNotification(`Dashboard data exported as ${format.toUpperCase()} successfully!`);
  } catch (error) {
    hideLoadingState();
    showErrorState('Failed to export dashboard data');
    console.error('Export error:', error);
  }
}

/**
 * Export to JSON
 */
function exportToJSON(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'healthcare-analytics-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export to CSV
 */
function exportToCSV(data) {
  let csvContent = '';
  
  // Overview data
  csvContent += 'Healthcare Analytics Report\n\n';
  csvContent += 'Overview Metrics\n';
  csvContent += 'Metric,Value,Change\n';
  csvContent += `Total Patients,${data.overview.totalPatients},${data.overview.changes?.patients}%\n`;
  csvContent += `Active Consultations,${data.overview.activeConsultations},${data.overview.changes?.consultations}%\n`;
  csvContent += `Average Satisfaction,${data.overview.avgSatisfaction},${data.overview.changes?.satisfaction}%\n`;
  csvContent += `Critical Alerts,${data.overview.criticalAlerts},${data.overview.changes?.alerts}%\n\n`;
  
  // Patient Journey data
  if (data.patientJourney.journeyStages) {
    csvContent += 'Patient Journey Stages\n';
    csvContent += 'Stage,Patients,Average Time (days)\n';
    data.patientJourney.journeyStages.forEach(stage => {
      csvContent += `${stage.stage},${stage.patients},${stage.avgTime}\n`;
    });
    csvContent += '\n';
  }
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'healthcare-analytics-data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Real-time Updates Implementation
 */
function initializeRealTimeUpdates() {
  // Simulate real-time updates every 30 seconds
  setInterval(() => {
    const realTimeToggle = document.getElementById('realTimeToggle');
    if (realTimeToggle && realTimeToggle.checked) {
      updateRealTimeData();
    }
  }, 30000);
}

/**
 * Update Real-time Data
 */
function updateRealTimeData() {
  // Simulate real-time data changes
  if (analyticsData.overview) {
    // Simulate small changes in metrics
    analyticsData.overview.activeConsultations += Math.floor(Math.random() * 5) - 2;
    analyticsData.overview.criticalAlerts += Math.floor(Math.random() * 3) - 1;
    analyticsData.overview.criticalAlerts = Math.max(0, analyticsData.overview.criticalAlerts);
    
    // Update overview metrics
    updateOverviewMetrics(analyticsData.overview);
    
    // Show real-time update notification
    showRealtimeUpdateNotification();
  }
}

/**
 * Show Real-time Update Notification
 */
function showRealtimeUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'realtime-notification';
  notification.innerHTML = `
    <div class="alert alert-info alert-dismissible fade show position-fixed" 
         style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
      <i class="fas fa-sync-alt fa-spin me-2"></i>
      Dashboard updated with latest data
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

/**
 * Advanced Search and Filter Implementation
 */
function initializeAdvancedSearch() {
  const searchInput = document.getElementById('dashboardSearch');
  const filterButtons = document.querySelectorAll('.filter-button');
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function(e) {
      const query = e.target.value.toLowerCase();
      filterDashboardContent(query);
    }, 300));
  }
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.dataset.category;
      toggleCategoryFilter(category);
    });
  });
}

/**
 * Filter Dashboard Content
 */
function filterDashboardContent(query) {
  const cards = document.querySelectorAll('.analytics-card, .card');
  
  cards.forEach(card => {
    const cardText = card.textContent.toLowerCase();
    const isVisible = query === '' || cardText.includes(query);
    
    card.style.display = isVisible ? 'block' : 'none';
    
    if (isVisible && query !== '') {
      card.style.animation = 'fadeIn 0.3s ease-in';
    }
  });
}

/**
 * Toggle Category Filter
 */
function toggleCategoryFilter(category) {
  const button = document.querySelector(`[data-category="${category}"]`);
  if (!button) return;
  
  const isActive = button.classList.contains('active');
  
  // Toggle button state
  button.classList.toggle('active');
  
  // Filter content by category
  const cards = document.querySelectorAll('.analytics-card, .card');
  cards.forEach(card => {
    const cardCategory = card.dataset.category;
    
    if (isActive) {
      // Show all if deactivating
      card.style.display = 'block';
    } else {
      // Hide non-matching categories
      card.style.display = cardCategory === category ? 'block' : 'none';
    }
  });
}

/**
 * Theme Toggle Implementation
 */
function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('dashboardTheme') || 'light';
  
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeToggle) {
    themeToggle.checked = savedTheme === 'dark';
    
    // Theme toggle event
    themeToggle.addEventListener('change', function() {
      const newTheme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('dashboardTheme', newTheme);
      
      // Update chart colors for new theme
      updateChartsForTheme(newTheme);
      
      showSuccessNotification(`Switched to ${newTheme} theme`);
    });
  }
}

/**
 * Update Charts for Theme
 */
function updateChartsForTheme(theme) {
  const textColor = theme === 'dark' ? '#ffffff' : '#374151';
  const gridColor = theme === 'dark' ? '#374151' : '#f3f4f6';
  
  Object.values(charts).forEach(chart => {
    if (chart && chart.options) {
      // Update text colors
      if (chart.options.scales) {
        Object.values(chart.options.scales).forEach(scale => {
          if (scale.ticks) scale.ticks.color = textColor;
          if (scale.title) scale.title.color = textColor;
          if (scale.grid) scale.grid.color = gridColor;
        });
      }
      
      // Update legend colors
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels = {
          ...chart.options.plugins.legend.labels,
          color: textColor
        };
      }
      
      chart.update();
    }
  });
}

/**
 * Enhanced Doctor Performance Analysis
 */
function createAdvancedDoctorAnalysis() {
  // Create comprehensive doctor comparison chart if container exists
  const doctorComparisonChart = document.getElementById('doctorComparisonChart');
  if (doctorComparisonChart) {
    const ctx = doctorComparisonChart.getContext('2d');
    charts.doctorComparison = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Patient Satisfaction', 'Response Time', 'Treatment Success', 'Availability', 'Communication'],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: { borderWidth: 3 },
          point: { radius: 6 }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f0f0f0' },
            ticks: {
              stepSize: 20,
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }
}

/**
 * Show Success Notification
 */
function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show position-fixed" 
         style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
      <i class="fas fa-check-circle me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}
