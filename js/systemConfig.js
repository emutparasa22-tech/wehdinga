// ===================================
// SYSTEM CONFIGURATION JAVASCRIPT
// ===================================

// Firebase references
let database;
let configRef;
let systemRef;
let thresholdsRef;
let sensorsRef;
let notificationsRef;

// Current configuration state
let currentConfig = {
  wifi: {
    ssid: '',
    password: '',
    connected: false
  },
  aerator: {
    autoMode: false,
    doThreshold: 5.0,
    doStopThreshold: 6.5,
    schedules: []
  },
  sampling: {
    interval: 300 // seconds (5 minutes default)
  },
  notifications: {
    email: true,
    push: true,
    criticalAlerts: true,
    warningAlerts: true,
    systemAlerts: true,
    dailyReport: false
  }
};

let scheduleCounter = 0;

// Default thresholds
const defaultThresholds = {
  do: {
    safeMin: 5.0,
    safeMax: 9.0,
    warnMin: 4.0,
    warnMax: 10.0
  },
  temperature: {
    safeMin: 26.0,
    safeMax: 32.0,
    warnMin: 24.0,
    warnMax: 34.0
  },
  ph: {
    safeMin: 7.5,
    safeMax: 8.5,
    warnMin: 7.0,
    warnMax: 9.0
  },
  salinity: {
    safeMin: 15.0,
    safeMax: 25.0,
    warnMin: 12.0,
    warnMax: 28.0
  },
  turbidity: {
    safeMin: 20.0,
    safeMax: 50.0,
    warnMin: 10.0,
    warnMax: 70.0
  }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('System Configuration page loaded');
  
  // Initialize Firebase references
  database = firebase.database();
  configRef = database.ref('config');
  systemRef = database.ref('system');
  thresholdsRef = database.ref('thresholds');
  sensorsRef = database.ref('sensors');
  notificationsRef = database.ref('notifications');

  // Setup tab navigation
  setupTabs();

  // Load current configuration
  loadConfiguration();

  // Setup form handlers
  setupFormHandlers();

  // Listen for real-time updates
  listenForUpdates();

  // Update interval preview
  updateIntervalPreview();
});

// ===================================
// TAB NAVIGATION
// ===================================

function setupTabs() {
  const tabs = document.querySelectorAll('.config-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and panels
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding panel
      this.classList.add('active');
      document.getElementById(tabName + '-panel').classList.add('active');
    });
  });
}

// ===================================
// LOAD CONFIGURATION
// ===================================

function loadConfiguration() {
  console.log('Loading configuration from Firebase...');
  
  // Load WiFi configuration
  loadWiFiConfig();
  
  // Load thresholds
  loadThresholds();
  
  // Load aerator configuration
  loadAeratorConfig();
  
  // Load sampling interval
  loadSamplingConfig();
  
  // Load notification settings
  loadNotificationSettings();
}

// Load WiFi Configuration
function loadWiFiConfig() {
  configRef.child('wifi').once('value', (snapshot) => {
    const wifiData = snapshot.val();
    if (wifiData) {
      document.getElementById('wifiSSID').value = wifiData.ssid || '';
    }
  });
}

// Load Thresholds
function loadThresholds() {
  thresholdsRef.once('value', (snapshot) => {
    const thresholds = snapshot.val() || defaultThresholds;
    
    // Populate threshold inputs
    Object.keys(defaultThresholds).forEach(sensor => {
      const sensorThresholds = thresholds[sensor] || defaultThresholds[sensor];
      
      document.getElementById(`${sensor}_safeMin`).value = sensorThresholds.safeMin;
      document.getElementById(`${sensor}_safeMax`).value = sensorThresholds.safeMax;
      document.getElementById(`${sensor}_warnMin`).value = sensorThresholds.warnMin;
      document.getElementById(`${sensor}_warnMax`).value = sensorThresholds.warnMax;
    });
  });
}

// Load Aerator Configuration
function loadAeratorConfig() {
  configRef.child('aerator').once('value', (snapshot) => {
    const aeratorData = snapshot.val();
    if (aeratorData) {
      currentConfig.aerator = aeratorData;
      
      // Set toggle state
      const autoToggle = document.getElementById('aeratorAutoToggle');
      autoToggle.checked = aeratorData.autoMode || false;
      toggleAeratorMode();
      
      // Set threshold values
      document.getElementById('aeratorDOThreshold').value = aeratorData.doThreshold || 5.0;
      document.getElementById('aeratorDOStopThreshold').value = aeratorData.doStopThreshold || 6.5;
      
      // Load schedules
      if (aeratorData.schedules && aeratorData.schedules.length > 0) {
        aeratorData.schedules.forEach(schedule => {
          addSchedule(schedule.startTime, schedule.stopTime);
        });
      }
    }
  });
}

// Load Sampling Configuration
function loadSamplingConfig() {
  configRef.child('sampling').once('value', (snapshot) => {
    const samplingData = snapshot.val();
    if (samplingData && samplingData.interval) {
      currentConfig.sampling.interval = samplingData.interval;
      document.getElementById('samplingInterval').value = samplingData.interval;
      updateIntervalPreview();
    }
  });
}

// Load Notification Settings
function loadNotificationSettings() {
  notificationsRef.once('value', (snapshot) => {
    const notificationData = snapshot.val();
    if (notificationData) {
      currentConfig.notifications = notificationData;
      
      // Set toggle states
      document.getElementById('emailNotificationsToggle').checked = notificationData.email !== false;
      document.getElementById('pushNotificationsToggle').checked = notificationData.push !== false;
      document.getElementById('criticalAlertsToggle').checked = notificationData.criticalAlerts !== false;
      document.getElementById('warningAlertsToggle').checked = notificationData.warningAlerts !== false;
      document.getElementById('systemAlertsToggle').checked = notificationData.systemAlerts !== false;
      document.getElementById('dailyReportToggle').checked = notificationData.dailyReport === true;
    }
  });
}

// ===================================
// FORM HANDLERS
// ===================================

function setupFormHandlers() {
  // WiFi Form
  const wifiForm = document.getElementById('wifiForm');
  wifiForm.addEventListener('submit', saveWiFiConfig);
}

// Save WiFi Configuration
function saveWiFiConfig(e) {
  e.preventDefault();
  
  const ssid = document.getElementById('wifiSSID').value;
  const password = document.getElementById('wifiPassword').value;
  
  if (!ssid) {
    showStatusMessage('Please enter a WiFi network name', 'error');
    return;
  }
  
  // Confirmation dialog
  if (!confirm('Are you sure you want to save these WiFi settings? The ESP32 will restart to connect to the new network.')) {
    return;
  }
  
  const wifiConfig = {
    ssid: ssid,
    password: password || '', // Empty string if no password provided
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  
  configRef.child('wifi').update(wifiConfig)
    .then(() => {
      showStatusMessage('WiFi settings saved! ESP32 will restart to connect...', 'success');
      document.getElementById('wifiPassword').value = ''; // Clear password field
    })
    .catch((error) => {
      showStatusMessage('Error saving WiFi settings: ' + error.message, 'error');
    });
}

// Save Thresholds
function saveThresholds() {
  const thresholds = {};
  
  // Collect all threshold values
  Object.keys(defaultThresholds).forEach(sensor => {
    thresholds[sensor] = {
      safeMin: parseFloat(document.getElementById(`${sensor}_safeMin`).value),
      safeMax: parseFloat(document.getElementById(`${sensor}_safeMax`).value),
      warnMin: parseFloat(document.getElementById(`${sensor}_warnMin`).value),
      warnMax: parseFloat(document.getElementById(`${sensor}_warnMax`).value)
    };
    
    // Validate thresholds
    if (thresholds[sensor].safeMin >= thresholds[sensor].safeMax) {
      showStatusMessage(`Invalid ${sensor} thresholds: Safe Min must be less than Safe Max`, 'error');
      return;
    }
    if (thresholds[sensor].warnMin >= thresholds[sensor].warnMax) {
      showStatusMessage(`Invalid ${sensor} thresholds: Warning Min must be less than Warning Max`, 'error');
      return;
    }
  });
  
  // Confirmation dialog - ADDED
  if (!confirm('Are you sure you want to save all sensor threshold changes?')) {
    return;
  }
  
  // Save to Firebase
  thresholdsRef.set(thresholds)
    .then(() => {
      showStatusMessage('All sensor thresholds saved successfully!', 'success');
    })
    .catch((error) => {
      showStatusMessage('Error saving thresholds: ' + error.message, 'error');
    });
}

// Reset Thresholds to Defaults
function resetThresholds() {
  if (confirm('Are you sure you want to reset all thresholds to default values?')) {
    Object.keys(defaultThresholds).forEach(sensor => {
      const defaults = defaultThresholds[sensor];
      document.getElementById(`${sensor}_safeMin`).value = defaults.safeMin;
      document.getElementById(`${sensor}_safeMax`).value = defaults.safeMax;
      document.getElementById(`${sensor}_warnMin`).value = defaults.warnMin;
      document.getElementById(`${sensor}_warnMax`).value = defaults.warnMax;
    });
    
    showStatusMessage('Thresholds reset to default values. Click "Save" to apply.', 'info');
  }
}

// Save Notification Settings
function saveNotificationSettings() {
  const notificationConfig = {
    email: document.getElementById('emailNotificationsToggle').checked,
    push: document.getElementById('pushNotificationsToggle').checked,
    criticalAlerts: document.getElementById('criticalAlertsToggle').checked,
    warningAlerts: document.getElementById('warningAlertsToggle').checked,
    systemAlerts: document.getElementById('systemAlertsToggle').checked,
    dailyReport: document.getElementById('dailyReportToggle').checked,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  
  // Confirmation dialog
  if (!confirm('Are you sure you want to save the notification settings?')) {
    return;
  }
  
  notificationsRef.set(notificationConfig)
    .then(() => {
      currentConfig.notifications = notificationConfig;
      showStatusMessage('Notification settings saved successfully!', 'success');
    })
    .catch((error) => {
      showStatusMessage('Error saving notification settings: ' + error.message, 'error');
    });
}

// Toggle Aerator Mode
function toggleAeratorMode() {
  const autoToggle = document.getElementById('aeratorAutoToggle');
  const autoSettings = document.getElementById('aeratorAutoSettings');
  const modeLabel = document.getElementById('aeratorModeLabel');
  const modeDescription = document.getElementById('aeratorModeDescription');
  
  if (autoToggle.checked) {
    autoSettings.style.display = 'block';
    modeLabel.textContent = 'Automatic Mode';
    modeDescription.textContent = 'Aerator is controlled automatically based on DO levels and schedule';
  } else {
    autoSettings.style.display = 'none';
    modeLabel.textContent = 'Manual Mode';
    modeDescription.textContent = 'Aerator is controlled manually from the dashboard';
  }
}

// Save Aerator Configuration
function saveAeratorConfig() {
  const autoMode = document.getElementById('aeratorAutoToggle').checked;
  const doThreshold = parseFloat(document.getElementById('aeratorDOThreshold').value);
  const doStopThreshold = parseFloat(document.getElementById('aeratorDOStopThreshold').value);
  
  // Validation
  if (autoMode && doThreshold >= doStopThreshold) {
    showStatusMessage('Stop threshold must be higher than start threshold', 'error');
    return;
  }
  
  // Collect all schedules
  const schedules = [];
  const scheduleItems = document.querySelectorAll('.schedule-item');
  scheduleItems.forEach(item => {
    const startTime = item.querySelector('.schedule-start').value;
    const stopTime = item.querySelector('.schedule-stop').value;
    if (startTime && stopTime) {
      schedules.push({
        startTime: startTime,
        stopTime: stopTime
      });
    }
  });
  
  // Confirmation dialog
  if (!confirm('Are you sure you want to save the aerator configuration changes?')) {
    return;
  }
  
  const aeratorConfig = {
    autoMode: autoMode,
    doThreshold: doThreshold,
    doStopThreshold: doStopThreshold,
    schedules: schedules,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  
  configRef.child('aerator').set(aeratorConfig)
    .then(() => {
      currentConfig.aerator = aeratorConfig;
      showStatusMessage('Aerator configuration saved successfully!', 'success');
    })
    .catch((error) => {
      showStatusMessage('Error saving aerator configuration: ' + error.message, 'error');
    });
}

// Add Schedule Function
function addSchedule(startTime = '06:00', stopTime = '18:00') {
  scheduleCounter++;
  const container = document.getElementById('scheduleContainer');
  
  const scheduleDiv = document.createElement('div');
  scheduleDiv.className = 'schedule-item';
  scheduleDiv.id = `schedule-${scheduleCounter}`;
  
  scheduleDiv.innerHTML = `
    <div class="schedule-item-header">Schedule #${scheduleCounter}</div>
    <div style="display: flex; gap: 12px; align-items: flex-end; width: 100%;">
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Start Time</label>
        <input type="time" class="schedule-start" value="${startTime}">
      </div>
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Stop Time</label>
        <input type="time" class="schedule-stop" value="${stopTime}">
      </div>
      <button type="button" class="btn-remove" onclick="removeSchedule(${scheduleCounter})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  container.appendChild(scheduleDiv);
}

// Remove Schedule Function
function removeSchedule(id) {
  const scheduleItem = document.getElementById(`schedule-${id}`);
  if (scheduleItem) {
    scheduleItem.remove();
  }
}

// Save Sampling Interval
function saveSamplingInterval() {
  const interval = parseInt(document.getElementById('samplingInterval').value);
  
  // Confirmation dialog
  if (!confirm('Are you sure you want to save the sampling interval changes?')) {
    return;
  }
  
  const samplingConfig = {
    interval: interval,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  
  configRef.child('sampling').set(samplingConfig)
    .then(() => {
      currentConfig.sampling.interval = interval;
      showStatusMessage('Sampling interval saved successfully!', 'success');
      updateIntervalPreview();
    })
    .catch((error) => {
      showStatusMessage('Error saving sampling interval: ' + error.message, 'error');
    });
}

// Update Interval Preview
function updateIntervalPreview() {
  const interval = parseInt(document.getElementById('samplingInterval').value);
  const preview = document.getElementById('samplingIntervalPreview');
  
  const minutes = Math.floor(interval / 60);
  const hours = Math.floor(interval / 3600);
  
  let timeText = '';
  if (hours >= 1) {
    timeText = hours + ' hour' + (hours > 1 ? 's' : '');
  } else {
    timeText = minutes + ' minute' + (minutes > 1 ? 's' : '');
  }
  
  preview.textContent = `Data will be recorded every ${timeText}`;
}

// ===================================
// REAL-TIME UPDATES
// ===================================

function listenForUpdates() {
  // Listen for configuration changes
  configRef.on('value', (snapshot) => {
    console.log('Configuration updated');
  });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Show Status Message
function showStatusMessage(message, type) {
  const container = document.getElementById('statusMessageContainer');
  
  // Clear existing messages
  container.innerHTML = '';
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `status-message ${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'error' ? 'fa-exclamation-circle' : 
               'fa-info-circle';
  
  messageDiv.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(messageDiv);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);
}

// Format Timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return '--';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString();
  }
}

console.log('System Configuration script loaded successfully');