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

// -----------------------------------------------------------------------
// WiFi connection monitoring
// We watch two Firebase paths:
//   system/wifiConnected  – boolean the ESP32 writes after connecting
//   system/wifiSSID       – the SSID the ESP32 is currently connected to
//
// Connection-check timeout: if the ESP32 doesn't confirm success within
// WIFI_CONFIRM_TIMEOUT_MS after a save, we treat it as a failure and
// clear the stored credentials.
// -----------------------------------------------------------------------
const WIFI_CONFIRM_TIMEOUT_MS = 10000; // 45 seconds
let wifiConfirmTimer = null;
let wifiStatusListener = null;

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

// ===================================
// INIT
// ===================================

document.addEventListener('DOMContentLoaded', function () {
  console.log('System Configuration page loaded');

  // Initialize Firebase references
  database = firebase.database();
  configRef    = database.ref('config');
  systemRef    = database.ref('system');
  thresholdsRef = database.ref('thresholds');
  sensorsRef   = database.ref('sensors');
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

  // Start watching ESP32 WiFi connection status immediately
  watchWifiConnectionStatus();
});

// ===================================
// TAB NAVIGATION
// ===================================

function setupTabs() {
  const tabs   = document.querySelectorAll('.config-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
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
  loadWiFiConfig();
  loadThresholds();
  loadAeratorConfig();
  loadSamplingConfig();
  loadNotificationSettings();
}

function loadWiFiConfig() {
  configRef.child('wifi').once('value', (snapshot) => {
    const wifiData = snapshot.val();
    if (wifiData) {
      document.getElementById('wifiSSID').value = wifiData.ssid || '';
    }
  });
}

function loadThresholds() {
  thresholdsRef.once('value', (snapshot) => {
    const thresholds = snapshot.val() || defaultThresholds;
    Object.keys(defaultThresholds).forEach(sensor => {
      const st = thresholds[sensor] || defaultThresholds[sensor];
      document.getElementById(`${sensor}_safeMin`).value = st.safeMin;
      document.getElementById(`${sensor}_safeMax`).value = st.safeMax;
      document.getElementById(`${sensor}_warnMin`).value = st.warnMin;
      document.getElementById(`${sensor}_warnMax`).value = st.warnMax;
    });
  });
}

function loadAeratorConfig() {
  configRef.child('aerator').once('value', (snapshot) => {
    const aeratorData = snapshot.val();
    if (aeratorData) {
      currentConfig.aerator = aeratorData;
      const autoToggle = document.getElementById('aeratorAutoToggle');
      autoToggle.checked = aeratorData.autoMode || false;
      toggleAeratorMode();
      document.getElementById('aeratorDOThreshold').value     = aeratorData.doThreshold     || 5.0;
      document.getElementById('aeratorDOStopThreshold').value = aeratorData.doStopThreshold || 6.5;
      if (aeratorData.schedules && aeratorData.schedules.length > 0) {
        aeratorData.schedules.forEach(s => addSchedule(s.startTime, s.stopTime));
      }
    }
  });
}

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

function loadNotificationSettings() {
  notificationsRef.once('value', (snapshot) => {
    const nd = snapshot.val();
    if (nd) {
      currentConfig.notifications = nd;
      document.getElementById('emailNotificationsToggle').checked  = nd.email          !== false;
      document.getElementById('pushNotificationsToggle').checked   = nd.push           !== false;
      document.getElementById('criticalAlertsToggle').checked      = nd.criticalAlerts !== false;
      document.getElementById('warningAlertsToggle').checked       = nd.warningAlerts  !== false;
      document.getElementById('systemAlertsToggle').checked        = nd.systemAlerts   !== false;
      document.getElementById('dailyReportToggle').checked         = nd.dailyReport    === true;
    }
  });
}

// ===================================
// FORM HANDLERS
// ===================================

function setupFormHandlers() {
  document.getElementById('wifiForm').addEventListener('submit', saveWiFiConfig);
}

// Save WiFi Configuration
function saveWiFiConfig(e) {
  e.preventDefault();

  const ssid     = document.getElementById('wifiSSID').value.trim();
  const password = document.getElementById('wifiPassword').value;

  if (!ssid) {
    showStatusMessage('Please enter a WiFi network name', 'error');
    return;
  }

  if (!confirm('Are you sure you want to save these WiFi settings? The ESP32 will restart to connect to the new network.')) {
    return;
  }

  const wifiConfig = {
    ssid:      ssid,
    password:  password || '',
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  // Show "waiting for confirmation" state immediately
  setWifiStatusChecking('Saving… waiting for ESP32 to reconnect');

  configRef.child('wifi').update(wifiConfig)
    .then(() => {
      showStatusMessage('WiFi settings saved! Waiting for ESP32 to confirm connection…', 'info');
      document.getElementById('wifiPassword').value = '';

      // Start a timeout: if ESP32 doesn't confirm within the window, treat as failed
      startWifiConfirmTimeout(ssid);
    })
    .catch((error) => {
      showStatusMessage('Error saving WiFi settings: ' + error.message, 'error');
      setWifiStatusDisconnected('Failed to save settings');
    });
}

// ===================================
// PASSWORD VISIBILITY TOGGLE
// ===================================

/**
 * Toggles the password field between plain-text and hidden,
 * and swaps the eye / eye-slash icon accordingly.
 */
function togglePasswordVisibility() {
  const input  = document.getElementById('wifiPassword');
  const icon   = document.getElementById('passwordToggleIcon');
  const btn    = document.getElementById('passwordToggleBtn');

  const isHidden = input.type === 'password';

  if (isHidden) {
    // Show password
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
    btn.setAttribute('aria-label', 'Hide password');
    btn.setAttribute('title', 'Hide password');
  } else {
    // Hide password
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
    btn.setAttribute('aria-label', 'Show password');
    btn.setAttribute('title', 'Show password');
  }

  // Keep focus on the input for accessibility
  input.focus();
}

// ===================================
// ESP32 WIFI CONNECTION STATUS
// ===================================

/**
 * Watches system/wifiConnected and system/wifiSSID in Firebase.
 * The ESP32 firmware should write:
 *   system/wifiConnected = true | false
 *   system/wifiSSID      = "<connected SSID>" | ""
 * whenever its connection state changes.
 */
function watchWifiConnectionStatus() {
  // Detach any previous listener first
  if (wifiStatusListener) {
    systemRef.off('value', wifiStatusListener);
  }

  wifiStatusListener = systemRef.on('value', (snapshot) => {
    const systemData = snapshot.val();
    if (!systemData) {
      setWifiStatusChecking('No system data available');
      return;
    }

    const isConnected = systemData.wifiConnected === true;
    const connectedSSID = systemData.wifiSSID || '';

    if (isConnected) {
      // Cancel any pending timeout — connection confirmed!
      clearWifiConfirmTimeout();
      setWifiStatusConnected(connectedSSID);
    } else {
      setWifiStatusDisconnected(
        connectedSSID
          ? `Failed to connect to "${connectedSSID}"`
          : 'ESP32 is not connected to WiFi'
      );
    }
  });
}

/**
 * Starts the "waiting for ESP32 connection confirmation" timer.
 * If the ESP32 doesn't report wifiConnected = true within the timeout,
 * we clear the stored credentials and show a failure message.
 */
function startWifiConfirmTimeout(attemptedSSID) {
  clearWifiConfirmTimeout(); // clear any existing timer

  wifiConfirmTimer = setTimeout(() => {
    // Check one more time before acting
    systemRef.child('wifiConnected').once('value', (snap) => {
      const confirmed = snap.val() === true;
      if (!confirmed) {
        handleWifiConnectionFailure(attemptedSSID);
      }
    });
  }, WIFI_CONFIRM_TIMEOUT_MS);
}

function clearWifiConfirmTimeout() {
  if (wifiConfirmTimer) {
    clearTimeout(wifiConfirmTimer);
    wifiConfirmTimer = null;
  }
}

/**
 * Called when the ESP32 fails (or times-out) to confirm WiFi connection.
 * Clears the SSID and password from Firebase and the form.
 */
function handleWifiConnectionFailure(attemptedSSID) {
  console.warn('WiFi connection failed for SSID:', attemptedSSID, '— clearing credentials.');

  // 1. Clear credentials in Firebase
  configRef.child('wifi').update({
    ssid:      '',
    password:  '',
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  }).catch(err => console.error('Error clearing WiFi credentials:', err));

  // 2. Clear the form fields
  document.getElementById('wifiSSID').value     = '';
  document.getElementById('wifiPassword').value = '';

  // 3. Update status banner
  setWifiStatusDisconnected(`Could not connect to "${attemptedSSID}" — credentials cleared`);

  // 4. Show error message
  showStatusMessage(
    `ESP32 failed to connect to "${attemptedSSID}". The SSID and password have been cleared. Please check your credentials and try again.`,
    'error'
  );
}

// ── Banner state helpers ──────────────────────────────────────────────────────

function setWifiStatusChecking(message) {
  const banner = document.getElementById('wifiConnectionStatus');
  const dot    = document.getElementById('wifiStatusDot');
  const label  = document.getElementById('wifiStatusLabel');
  const ssidEl = document.getElementById('wifiStatusSSID');
  const badge  = document.getElementById('wifiStatusBadge');
  const icon   = document.getElementById('wifiStatusIcon');
  const text   = document.getElementById('wifiStatusText');

  banner.className = 'wifi-connection-status checking';
  dot.style.background = '';   // reset to default CSS colour
  label.textContent   = message || 'Checking connection…';
  ssidEl.textContent  = '';
  badge.className     = 'wifi-status-badge';
  icon.className      = 'fas fa-circle-notch fa-spin';
  text.textContent    = 'Checking';
}

function setWifiStatusConnected(ssid) {
  const banner = document.getElementById('wifiConnectionStatus');
  const label  = document.getElementById('wifiStatusLabel');
  const ssidEl = document.getElementById('wifiStatusSSID');
  const badge  = document.getElementById('wifiStatusBadge');
  const icon   = document.getElementById('wifiStatusIcon');
  const text   = document.getElementById('wifiStatusText');

  banner.className     = 'wifi-connection-status connected';
  label.textContent    = 'ESP32 is connected to WiFi';
  ssidEl.textContent   = ssid ? `Network: ${ssid}` : '';
  badge.className      = 'wifi-status-badge';
  icon.className       = 'fas fa-check-circle';
  text.textContent     = 'Connected';
}

function setWifiStatusDisconnected(reason) {
  const banner = document.getElementById('wifiConnectionStatus');
  const label  = document.getElementById('wifiStatusLabel');
  const ssidEl = document.getElementById('wifiStatusSSID');
  const badge  = document.getElementById('wifiStatusBadge');
  const icon   = document.getElementById('wifiStatusIcon');
  const text   = document.getElementById('wifiStatusText');

  banner.className     = 'wifi-connection-status disconnected';
  label.textContent    = reason || 'ESP32 is not connected to WiFi';
  ssidEl.textContent   = '';
  badge.className      = 'wifi-status-badge';
  icon.className       = 'fas fa-times-circle';
  text.textContent     = 'Disconnected';
}

// ===================================
// SAVE / RESET FUNCTIONS
// ===================================

function saveThresholds() {
  const thresholds = {};

  for (const sensor of Object.keys(defaultThresholds)) {
    const safeMin = parseFloat(document.getElementById(`${sensor}_safeMin`).value);
    const safeMax = parseFloat(document.getElementById(`${sensor}_safeMax`).value);
    const warnMin = parseFloat(document.getElementById(`${sensor}_warnMin`).value);
    const warnMax = parseFloat(document.getElementById(`${sensor}_warnMax`).value);

    if (safeMin >= safeMax) {
      showStatusMessage(`Invalid ${sensor} thresholds: Safe Min must be less than Safe Max`, 'error');
      return;
    }
    if (warnMin >= warnMax) {
      showStatusMessage(`Invalid ${sensor} thresholds: Warning Min must be less than Warning Max`, 'error');
      return;
    }

    thresholds[sensor] = { safeMin, safeMax, warnMin, warnMax };
  }

  if (!confirm('Are you sure you want to save all sensor threshold changes?')) return;

  thresholdsRef.set(thresholds)
    .then(() => showStatusMessage('All sensor thresholds saved successfully!', 'success'))
    .catch(err => showStatusMessage('Error saving thresholds: ' + err.message, 'error'));
}

function resetThresholds() {
  if (!confirm('Are you sure you want to reset all thresholds to default values?')) return;

  Object.keys(defaultThresholds).forEach(sensor => {
    const d = defaultThresholds[sensor];
    document.getElementById(`${sensor}_safeMin`).value = d.safeMin;
    document.getElementById(`${sensor}_safeMax`).value = d.safeMax;
    document.getElementById(`${sensor}_warnMin`).value = d.warnMin;
    document.getElementById(`${sensor}_warnMax`).value = d.warnMax;
  });

  showStatusMessage('Thresholds reset to default values. Click "Save" to apply.', 'info');
}

function saveNotificationSettings() {
  const notificationConfig = {
    email:          document.getElementById('emailNotificationsToggle').checked,
    push:           document.getElementById('pushNotificationsToggle').checked,
    criticalAlerts: document.getElementById('criticalAlertsToggle').checked,
    warningAlerts:  document.getElementById('warningAlertsToggle').checked,
    systemAlerts:   document.getElementById('systemAlertsToggle').checked,
    dailyReport:    document.getElementById('dailyReportToggle').checked,
    updatedAt:      firebase.database.ServerValue.TIMESTAMP
  };

  if (!confirm('Are you sure you want to save the notification settings?')) return;

  notificationsRef.set(notificationConfig)
    .then(() => {
      currentConfig.notifications = notificationConfig;
      showStatusMessage('Notification settings saved successfully!', 'success');
    })
    .catch(err => showStatusMessage('Error saving notification settings: ' + err.message, 'error'));
}

function toggleAeratorMode() {
  const autoToggle   = document.getElementById('aeratorAutoToggle');
  const autoSettings = document.getElementById('aeratorAutoSettings');
  const modeLabel    = document.getElementById('aeratorModeLabel');
  const modeDesc     = document.getElementById('aeratorModeDescription');

  if (autoToggle.checked) {
    autoSettings.style.display = 'block';
    modeLabel.textContent = 'Automatic Mode';
    modeDesc.textContent  = 'Aerator is controlled automatically based on DO levels and schedule';
  } else {
    autoSettings.style.display = 'none';
    modeLabel.textContent = 'Manual Mode';
    modeDesc.textContent  = 'Aerator is controlled manually from the dashboard';
  }
}

function saveAeratorConfig() {
  const autoMode         = document.getElementById('aeratorAutoToggle').checked;
  const doThreshold      = parseFloat(document.getElementById('aeratorDOThreshold').value);
  const doStopThreshold  = parseFloat(document.getElementById('aeratorDOStopThreshold').value);

  if (autoMode && doThreshold >= doStopThreshold) {
    showStatusMessage('Stop threshold must be higher than start threshold', 'error');
    return;
  }

  const schedules = [];
  document.querySelectorAll('.schedule-item').forEach(item => {
    const startTime = item.querySelector('.schedule-start').value;
    const stopTime  = item.querySelector('.schedule-stop').value;
    if (startTime && stopTime) schedules.push({ startTime, stopTime });
  });

  if (!confirm('Are you sure you want to save the aerator configuration changes?')) return;

  const aeratorConfig = {
    autoMode,
    doThreshold,
    doStopThreshold,
    schedules,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  configRef.child('aerator').set(aeratorConfig)
    .then(() => {
      currentConfig.aerator = aeratorConfig;
      showStatusMessage('Aerator configuration saved successfully!', 'success');
    })
    .catch(err => showStatusMessage('Error saving aerator configuration: ' + err.message, 'error'));
}

function addSchedule(startTime = '06:00', stopTime = '18:00') {
  scheduleCounter++;
  const container   = document.getElementById('scheduleContainer');
  const scheduleDiv = document.createElement('div');
  scheduleDiv.className = 'schedule-item';
  scheduleDiv.id = `schedule-${scheduleCounter}`;

  scheduleDiv.innerHTML = `
    <div class="schedule-item-header">Schedule #${scheduleCounter}</div>
    <div style="display:flex;gap:12px;align-items:flex-end;width:100%;">
      <div class="form-group" style="flex:1;margin:0;">
        <label>Start Time</label>
        <input type="time" class="schedule-start" value="${startTime}">
      </div>
      <div class="form-group" style="flex:1;margin:0;">
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

function removeSchedule(id) {
  const el = document.getElementById(`schedule-${id}`);
  if (el) el.remove();
}

function saveSamplingInterval() {
  const interval = parseInt(document.getElementById('samplingInterval').value);

  if (!confirm('Are you sure you want to save the sampling interval changes?')) return;

  const samplingConfig = {
    interval,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  configRef.child('sampling').set(samplingConfig)
    .then(() => {
      currentConfig.sampling.interval = interval;
      showStatusMessage('Sampling interval saved successfully!', 'success');
      updateIntervalPreview();
    })
    .catch(err => showStatusMessage('Error saving sampling interval: ' + err.message, 'error'));
}

function updateIntervalPreview() {
  const interval = parseInt(document.getElementById('samplingInterval').value);
  const preview  = document.getElementById('samplingIntervalPreview');
  const hours    = Math.floor(interval / 3600);
  const minutes  = Math.floor(interval / 60);

  let timeText;
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
  configRef.on('value', () => {
    console.log('Configuration updated');
  });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function showStatusMessage(message, type) {
  const container = document.getElementById('statusMessageContainer');
  container.innerHTML = '';

  const messageDiv = document.createElement('div');
  messageDiv.className = `status-message ${type}`;

  const icon = type === 'success' ? 'fa-check-circle'
             : type === 'error'   ? 'fa-exclamation-circle'
             :                      'fa-info-circle';

  messageDiv.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  container.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.opacity = '0';
    messageDiv.style.transition = 'opacity 0.3s ease';
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '--';
  const date     = new Date(timestamp);
  const diffMs   = Date.now() - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins  < 1)  return 'Just now';
  if (diffMins  < 60) return `${diffMins} min${diffMins  > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays  < 7)  return `${diffDays} day${diffDays  > 1 ? 's' : ''} ago`;
  return date.toLocaleString();
}

console.log('System Configuration script loaded successfully');