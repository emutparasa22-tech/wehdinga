
// ========================================
// ALERTS PAGE JAVASCRIPT
// ========================================

// Global variables
let activeAlerts = [];
let historyAlerts = [];
let currentTab = 'active';

// Initialize alerts page
document.addEventListener('DOMContentLoaded', function() {
  initializeAlertsPage();
  setupDateFilters();
});

// Initialize the alerts page
function initializeAlertsPage() {
  console.log('Initializing Alerts Page...');
  
  // Load alerts from Firebase
  loadActiveAlerts();
  loadHistoryAlerts();
  
  // Set up real-time listeners
  setupRealtimeAlertListeners();
  
  // Check for threshold violations
  checkThresholds();
}

// Switch between tabs
function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  const tabButtons = document.querySelectorAll('.alerts-tab-btn');
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update tab content
  const tabContents = document.querySelectorAll('.alerts-tab-content');
  tabContents.forEach(content => {
    if (content.id === tabName + 'Tab') {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Load active alerts from Firebase
function loadActiveAlerts() {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available, using demo data');
    displayDemoActiveAlerts();
    return;
  }
  
  const alertsRef = firebase.database().ref('alerts/active');
  
  alertsRef.on('value', (snapshot) => {
    activeAlerts = [];
    
    snapshot.forEach((childSnapshot) => {
      const alert = {
        id: childSnapshot.key,
        ...childSnapshot.val()
      };
      activeAlerts.push(alert);
    });
    
    console.log('Active alerts loaded:', activeAlerts.length);
    displayActiveAlerts();
    updateActiveAlertsCount();
  });
}

// Load history alerts from Firebase
function loadHistoryAlerts() {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available, using demo data');
    displayDemoHistoryAlerts();
    return;
  }
  
  const historyRef = firebase.database().ref('alerts/history');
  
  historyRef.orderByChild('timestamp').limitToLast(100).on('value', (snapshot) => {
    historyAlerts = [];
    
    snapshot.forEach((childSnapshot) => {
      const alert = {
        id: childSnapshot.key,
        ...childSnapshot.val()
      };
      historyAlerts.push(alert);
    });
    
    // Sort by timestamp descending (newest first)
    historyAlerts.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log('History alerts loaded:', historyAlerts.length);
    displayHistoryAlerts();
  });
}

// Display active alerts
function displayActiveAlerts() {
  const alertsList = document.getElementById('activeAlertsList');
  
  // Apply filters
  const filteredAlerts = filterActiveAlerts();
  
  if (filteredAlerts.length === 0) {
    alertsList.innerHTML = `
      <div class="no-alerts">
        <i class="fas fa-check-circle"></i>
        <p>No active alerts at this time</p>
        <span>Your pond water quality is within normal parameters</span>
      </div>
    `;
    document.getElementById('acknowledgeAllBtn').disabled = true;
    return;
  }
  
  document.getElementById('acknowledgeAllBtn').disabled = false;
  
  alertsList.innerHTML = filteredAlerts.map(alert => createAlertCard(alert, true)).join('');
}

// Display history alerts
function displayHistoryAlerts() {
  const historyList = document.getElementById('historyAlertsList');
  
  // Apply filters
  const filteredHistory = filterHistoryAlerts();
  
  if (filteredHistory.length === 0) {
    historyList.innerHTML = `
      <div class="no-alerts">
        <i class="fas fa-inbox"></i>
        <p>No alert history available</p>
        <span>Past alerts will appear here once they are acknowledged or resolved</span>
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = filteredHistory.map(alert => createAlertCard(alert, false)).join('');
}

// Create alert card HTML
function createAlertCard(alert, isActive) {
  const severity = alert.severity || 'warning';
  const parameter = alert.parameter || 'Unknown';
  const value = alert.value || '--';
  const threshold = alert.threshold || '--';
  const timestamp = formatTimestamp(alert.timestamp);
  const icon = getParameterIcon(parameter);
  const unit = getParameterUnit(parameter);
  
  let statusBadge = '';
  if (!isActive && alert.acknowledged) {
    statusBadge = '<span class="alert-severity-badge resolved">Acknowledged</span>';
  } else {
    statusBadge = `<span class="alert-severity-badge ${severity}">${severity}</span>`;
  }
  
  let actions = '';
  if (isActive) {
    actions = `
      <div class="alert-actions">
        <button class="alert-btn alert-btn-acknowledge" onclick="acknowledgeAlert('${alert.id}')">
          <i class="fas fa-check"></i> Acknowledge
        </button>
        <button class="alert-btn alert-btn-dismiss" onclick="dismissAlert('${alert.id}')">
          <i class="fas fa-times"></i> Dismiss
        </button>
      </div>
    `;
  } else if (alert.acknowledged) {
    actions = `
      <div class="alert-acknowledged">
        <i class="fas fa-check-circle"></i> 
        Acknowledged on ${formatTimestamp(alert.acknowledgedAt)}
      </div>
    `;
  }
  
  const cardClass = !isActive && alert.acknowledged ? 'resolved' : severity;
  
  return `
    <div class="alert-card ${cardClass}" data-alert-id="${alert.id}">
      <div class="alert-header">
        <div class="alert-title-group">
          <div class="alert-icon">
            <i class="${icon}"></i>
          </div>
          <div class="alert-title-text">
            <h3 class="alert-title">${alert.message || `${parameter} ${severity.toUpperCase()}`}</h3>
            <p class="alert-parameter">${parameter}</p>
          </div>
        </div>
        ${statusBadge}
      </div>
      
      <div class="alert-body">
        <div class="alert-info-item">
          <span class="alert-info-label">Current Value</span>
          <span class="alert-info-value ${severity}-value">${value} ${unit}</span>
        </div>
        <div class="alert-info-item">
          <span class="alert-info-label">Threshold</span>
          <span class="alert-info-value">${threshold} ${unit}</span>
        </div>
        <div class="alert-info-item">
          <span class="alert-info-label">Severity</span>
          <span class="alert-info-value">${severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
        </div>
      </div>
      
      <div class="alert-footer">
        <div class="alert-timestamp">
          <i class="fas fa-clock"></i>
          ${timestamp}
        </div>
        ${actions}
      </div>
    </div>
  `;
}

// Get parameter icon
function getParameterIcon(parameter) {
  const icons = {
    'DO': 'fas fa-wind',
    'Temperature': 'fas fa-thermometer-half',
    'Salinity': 'fas fa-tint',
    'Turbidity': 'fas fa-eye',
    'pH': 'fas fa-flask'
  };
  return icons[parameter] || 'fas fa-exclamation-triangle';
}

// Get parameter unit
function getParameterUnit(parameter) {
  const units = {
    'DO': 'mg/L',
    'Temperature': '°C',
    'Salinity': 'ppt',
    'Turbidity': 'NTU',
    'pH': ''
  };
  return units[parameter] || '';
}

// Format timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  const options = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

// Filter active alerts
function filterActiveAlerts() {
  const severityFilter = document.getElementById('severityFilter').value;
  const parameterFilter = document.getElementById('parameterFilter').value;
  
  return activeAlerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesParameter = parameterFilter === 'all' || alert.parameter === parameterFilter;
    return matchesSeverity && matchesParameter;
  });
}

// Filter history alerts
function filterHistoryAlerts() {
  const dateFrom = document.getElementById('dateFromFilter').value;
  const dateTo = document.getElementById('dateToFilter').value;
  const severity = document.getElementById('historySeverityFilter').value;
  const parameter = document.getElementById('historyParameterFilter').value;
  
  return historyAlerts.filter(alert => {
    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
      if (alert.timestamp < fromDate) return false;
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
      if (alert.timestamp > toDate) return false;
    }
    
    // Severity filter
    if (severity !== 'all' && alert.severity !== severity) return false;
    
    // Parameter filter
    if (parameter !== 'all' && alert.parameter !== parameter) return false;
    
    return true;
  });
}

// Apply filters
function filterAlerts() {
  displayActiveAlerts();
}

function filterHistory() {
  displayHistoryAlerts();
}

// Acknowledge single alert
function acknowledgeAlert(alertId) {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available');
    alert('This is a demo. In production, this would acknowledge the alert.');
    return;
  }
  
  const alert = activeAlerts.find(a => a.id === alertId);
  if (!alert) return;
  
  // Move to history
  const historyRef = firebase.database().ref('alerts/history').push();
  historyRef.set({
    ...alert,
    acknowledged: true,
    acknowledgedAt: Date.now()
  }).then(() => {
    // Remove from active
    firebase.database().ref('alerts/active/' + alertId).remove();
    console.log('Alert acknowledged:', alertId);
  }).catch(error => {
    console.error('Error acknowledging alert:', error);
    alert('Failed to acknowledge alert. Please try again.');
  });
}

// Dismiss alert
function dismissAlert(alertId) {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available');
    alert('This is a demo. In production, this would dismiss the alert.');
    return;
  }
  
  if (confirm('Are you sure you want to dismiss this alert without acknowledging it?')) {
    firebase.database().ref('alerts/active/' + alertId).remove()
      .then(() => {
        console.log('Alert dismissed:', alertId);
      })
      .catch(error => {
        console.error('Error dismissing alert:', error);
        alert('Failed to dismiss alert. Please try again.');
      });
  }
}

// Acknowledge all alerts
function acknowledgeAll() {
  if (activeAlerts.length === 0) return;
  
  if (!confirm(`Are you sure you want to acknowledge all ${activeAlerts.length} active alerts?`)) {
    return;
  }
  
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available');
    alert('This is a demo. In production, this would acknowledge all alerts.');
    return;
  }
  
  const acknowledgedTime = Date.now();
  const promises = [];
  
  activeAlerts.forEach(alert => {
    // Add to history
    const historyRef = firebase.database().ref('alerts/history').push();
    promises.push(
      historyRef.set({
        ...alert,
        acknowledged: true,
        acknowledgedAt: acknowledgedTime
      })
    );
    
    // Remove from active
    promises.push(
      firebase.database().ref('alerts/active/' + alert.id).remove()
    );
  });
  
  Promise.all(promises)
    .then(() => {
      console.log('All alerts acknowledged');
    })
    .catch(error => {
      console.error('Error acknowledging all alerts:', error);
      alert('Failed to acknowledge all alerts. Please try again.');
    });
}

// Export history to CSV
function exportHistory() {
  const filteredHistory = filterHistoryAlerts();
  
  if (filteredHistory.length === 0) {
    alert('No alerts to export');
    return;
  }
  
  // Create CSV content
  const headers = ['Timestamp', 'Parameter', 'Severity', 'Value', 'Threshold', 'Message', 'Acknowledged'];
  const rows = filteredHistory.map(alert => [
    new Date(alert.timestamp).toLocaleString(),
    alert.parameter,
    alert.severity,
    alert.value,
    alert.threshold,
    alert.message || '',
    alert.acknowledged ? 'Yes' : 'No'
  ]);
  
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alerts_history_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Setup date filters with default values
function setupDateFilters() {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const dateToFilter = document.getElementById('dateToFilter');
  const dateFromFilter = document.getElementById('dateFromFilter');
  
  if (dateToFilter) {
    dateToFilter.value = today.toISOString().split('T')[0];
  }
  
  if (dateFromFilter) {
    dateFromFilter.value = oneWeekAgo.toISOString().split('T')[0];
  }
}

// Update active alerts count badge
function updateActiveAlertsCount() {
  const count = activeAlerts.length;
  const badge = document.getElementById('activeAlertsCount');
  
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// Setup real-time alert listeners
function setupRealtimeAlertListeners() {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available for real-time updates');
    return;
  }
  
  // Listen for sensor data changes to check thresholds
  const sensorRef = firebase.database().ref('sensorData/latest');
  sensorRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      checkThresholds(snapshot.val());
    }
  });
}

// Check sensor values against thresholds
function checkThresholds(sensorData) {
  if (!sensorData && typeof firebase !== 'undefined' && firebase.database) {
    // Fetch latest sensor data if not provided
    firebase.database().ref('sensorData/latest').once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          checkThresholds(snapshot.val());
        }
      });
    return;
  }
  
  if (!sensorData) return;
  
  // Define thresholds (you can load these from Firebase config)
  const thresholds = {
    DO: { critical: { min: 3, max: 15 }, warning: { min: 4, max: 12 } },
    Temperature: { critical: { min: 20, max: 35 }, warning: { min: 22, max: 32 } },
    Salinity: { critical: { min: 0, max: 35 }, warning: { min: 5, max: 30 } },
    Turbidity: { critical: { min: 0, max: 100 }, warning: { min: 0, max: 50 } },
    pH: { critical: { min: 6.0, max: 9.0 }, warning: { min: 6.5, max: 8.5 } }
  };
  
  // Check each parameter
  Object.keys(thresholds).forEach(param => {
    const value = sensorData[param];
    if (value === undefined || value === null) return;
    
    const threshold = thresholds[param];
    let severity = null;
    let thresholdValue = '';
    
    // Check critical thresholds
    if (value < threshold.critical.min) {
      severity = 'critical';
      thresholdValue = `Min: ${threshold.critical.min}`;
    } else if (value > threshold.critical.max) {
      severity = 'critical';
      thresholdValue = `Max: ${threshold.critical.max}`;
    }
    // Check warning thresholds
    else if (value < threshold.warning.min) {
      severity = 'warning';
      thresholdValue = `Min: ${threshold.warning.min}`;
    } else if (value > threshold.warning.max) {
      severity = 'warning';
      thresholdValue = `Max: ${threshold.warning.max}`;
    }
    
    // Create alert if threshold violated
    if (severity && typeof firebase !== 'undefined' && firebase.database) {
      createAlert(param, value, thresholdValue, severity);
    }
  });
}

// Create new alert
function createAlert(parameter, value, threshold, severity) {
  if (typeof firebase === 'undefined' || !firebase.database) {
    return;
  }
  
  // Check if similar alert already exists
  const existingAlert = activeAlerts.find(a => 
    a.parameter === parameter && 
    a.severity === severity &&
    Date.now() - a.timestamp < 300000 // Within last 5 minutes
  );
  
  if (existingAlert) return; // Don't create duplicate
  
  const alertRef = firebase.database().ref('alerts/active').push();
  const alert = {
    parameter: parameter,
    value: value.toFixed(2),
    threshold: threshold,
    severity: severity,
    message: `${parameter} ${severity === 'critical' ? 'critically' : ''} out of range`,
    timestamp: Date.now()
  };
  
  alertRef.set(alert)
    .then(() => {
      console.log('Alert created:', parameter, severity);
    })
    .catch(error => {
      console.error('Error creating alert:', error);
    });
}

// Demo data functions (for testing without Firebase)
function displayDemoActiveAlerts() {
  activeAlerts = [
    {
      id: 'demo1',
      parameter: 'DO',
      value: 2.8,
      threshold: 'Min: 4',
      severity: 'critical',
      message: 'Dissolved Oxygen critically low',
      timestamp: Date.now() - 600000 // 10 minutes ago
    },
    {
      id: 'demo2',
      parameter: 'Temperature',
      value: 34.5,
      threshold: 'Max: 32',
      severity: 'warning',
      message: 'Temperature above recommended range',
      timestamp: Date.now() - 1800000 // 30 minutes ago
    }
  ];
  
  displayActiveAlerts();
  updateActiveAlertsCount();
}

function displayDemoHistoryAlerts() {
  historyAlerts = [
    {
      id: 'hist1',
      parameter: 'pH',
      value: 9.2,
      threshold: 'Max: 8.5',
      severity: 'warning',
      message: 'pH level above recommended range',
      timestamp: Date.now() - 86400000, // 1 day ago
      acknowledged: true,
      acknowledgedAt: Date.now() - 82800000
    },
    {
      id: 'hist2',
      parameter: 'Salinity',
      value: 38,
      threshold: 'Max: 35',
      severity: 'critical',
      message: 'Salinity critically high',
      timestamp: Date.now() - 172800000, // 2 days ago
      acknowledged: true,
      acknowledgedAt: Date.now() - 169200000
    }
  ];
  
  displayHistoryAlerts();
}

console.log('Alerts.js loaded successfully');