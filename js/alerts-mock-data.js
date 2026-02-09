// ========================================
// MOCK DATA FOR ALERTS SYSTEM
// Bangus Pond Monitor - Sample Alerts Data
// ========================================
// This file contains sample data for testing the alerts system
// In production, this will be replaced with Firebase real-time data
// ========================================

// ACTIVE ALERTS - Current alerts that need attention
const mockActiveAlerts = [
  {
    id: 'alert_001',
    parameter: 'DO',
    value: 2.3,
    threshold: 'Min: 4.0',
    severity: 'critical',
    message: 'Dissolved Oxygen critically low - Immediate action required',
    timestamp: Date.now() - 300000, // 5 minutes ago
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan'
  },
  {
    id: 'alert_002',
    parameter: 'Temperature',
    value: 35.2,
    threshold: 'Max: 32.0',
    severity: 'warning',
    message: 'Water temperature above optimal range',
    timestamp: Date.now() - 900000, // 15 minutes ago
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan'
  },
  {
    id: 'alert_003',
    parameter: 'pH',
    value: 9.4,
    threshold: 'Max: 8.5',
    severity: 'warning',
    message: 'pH level elevated - Monitor closely',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan'
  },
  {
    id: 'alert_004',
    parameter: 'Turbidity',
    value: 85,
    threshold: 'Max: 50',
    severity: 'warning',
    message: 'Water turbidity higher than normal',
    timestamp: Date.now() - 3600000, // 1 hour ago
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan'
  },
  {
    id: 'alert_005',
    parameter: 'Salinity',
    value: 1.2,
    threshold: 'Min: 5.0',
    severity: 'critical',
    message: 'Salinity critically low - Check water source',
    timestamp: Date.now() - 7200000, // 2 hours ago
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan'
  }
];

// HISTORY ALERTS - Past alerts that have been acknowledged or resolved
const mockHistoryAlerts = [
  // Recent history (last 24 hours)
  {
    id: 'hist_001',
    parameter: 'DO',
    value: 3.8,
    threshold: 'Min: 4.0',
    severity: 'warning',
    message: 'Dissolved Oxygen slightly below optimal range',
    timestamp: Date.now() - 14400000, // 4 hours ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 10800000, // 3 hours ago
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Aerator activated, levels normalized'
  },
  {
    id: 'hist_002',
    parameter: 'Temperature',
    value: 33.5,
    threshold: 'Max: 32.0',
    severity: 'warning',
    message: 'Water temperature elevated during afternoon',
    timestamp: Date.now() - 28800000, // 8 hours ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 25200000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Temperature decreased naturally in evening'
  },
  
  // Yesterday
  {
    id: 'hist_003',
    parameter: 'pH',
    value: 6.2,
    threshold: 'Min: 6.5',
    severity: 'warning',
    message: 'pH level below recommended range',
    timestamp: Date.now() - 86400000, // 1 day ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 82800000,
    acknowledgedBy: 'admin@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'pH adjusted with lime treatment'
  },
  {
    id: 'hist_004',
    parameter: 'Salinity',
    value: 36.5,
    threshold: 'Max: 35.0',
    severity: 'critical',
    message: 'Salinity critically high - Seawater intrusion suspected',
    timestamp: Date.now() - 90000000, // ~1 day ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 86400000,
    acknowledgedBy: 'admin@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Freshwater added to dilute salinity'
  },
  {
    id: 'hist_005',
    parameter: 'Turbidity',
    value: 95,
    threshold: 'Max: 50',
    severity: 'critical',
    message: 'Extremely high turbidity - Heavy rainfall runoff',
    timestamp: Date.now() - 129600000, // 1.5 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 126000000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Water settling naturally, feeding suspended'
  },
  
  // 2-3 days ago
  {
    id: 'hist_006',
    parameter: 'DO',
    value: 2.1,
    threshold: 'Min: 4.0',
    severity: 'critical',
    message: 'Critical oxygen depletion - Early morning',
    timestamp: Date.now() - 172800000, // 2 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 169200000,
    acknowledgedBy: 'admin@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Emergency aeration applied, fish survival confirmed'
  },
  {
    id: 'hist_007',
    parameter: 'Temperature',
    value: 20.5,
    threshold: 'Min: 22.0',
    severity: 'warning',
    message: 'Water temperature dropped overnight',
    timestamp: Date.now() - 194400000, // ~2.25 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 190800000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Temperature normalized during day'
  },
  {
    id: 'hist_008',
    parameter: 'pH',
    value: 9.1,
    threshold: 'Max: 8.5',
    severity: 'critical',
    message: 'pH spike detected - Algae bloom suspected',
    timestamp: Date.now() - 216000000, // 2.5 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 212400000,
    acknowledgedBy: 'admin@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Algae treatment applied, pH stabilized'
  },
  {
    id: 'hist_009',
    parameter: 'Salinity',
    value: 3.8,
    threshold: 'Min: 5.0',
    severity: 'warning',
    message: 'Salinity lower than optimal',
    timestamp: Date.now() - 259200000, // 3 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 255600000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Salinity adjusted with salt addition'
  },
  
  // 4-7 days ago
  {
    id: 'hist_010',
    parameter: 'DO',
    value: 3.5,
    threshold: 'Min: 4.0',
    severity: 'warning',
    message: 'Dissolved Oxygen below optimal - Dense cloud cover',
    timestamp: Date.now() - 345600000, // 4 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 342000000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Supplemental aeration provided'
  },
  {
    id: 'hist_011',
    parameter: 'Turbidity',
    value: 65,
    threshold: 'Max: 50',
    severity: 'warning',
    message: 'Increased turbidity after feeding',
    timestamp: Date.now() - 388800000, // 4.5 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 385200000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Normal post-feeding turbidity, cleared within 2 hours'
  },
  {
    id: 'hist_012',
    parameter: 'Temperature',
    value: 34.8,
    threshold: 'Max: 32.0',
    severity: 'critical',
    message: 'Extreme heat warning - Midday peak',
    timestamp: Date.now() - 432000000, // 5 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 428400000,
    acknowledgedBy: 'admin@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Water exchange performed, shade nets deployed'
  },
  {
    id: 'hist_013',
    parameter: 'pH',
    value: 6.4,
    threshold: 'Min: 6.5',
    severity: 'warning',
    message: 'pH slightly acidic',
    timestamp: Date.now() - 475200000, // 5.5 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 471600000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'pH correction applied'
  },
  {
    id: 'hist_014',
    parameter: 'Salinity',
    value: 32.5,
    threshold: 'Max: 30.0',
    severity: 'warning',
    message: 'Salinity elevated - Dry season effects',
    timestamp: Date.now() - 518400000, // 6 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 514800000,
    acknowledgedBy: 'user@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Freshwater top-up performed'
  },
  {
    id: 'hist_015',
    parameter: 'DO',
    value: 14.2,
    threshold: 'Max: 12.0',
    severity: 'warning',
    message: 'Dissolved Oxygen supersaturation - Algae bloom',
    timestamp: Date.now() - 561600000, // 6.5 days ago
    acknowledged: true,
    acknowledgedAt: Date.now() - 558000000,
    acknowledgedBy: 'admin@example.com',
    pond: 'Pond A',
    location: 'Binmaley, Pangasinan',
    resolution: 'Algae managed, DO levels normalized'
  }
];

// ALERT STATISTICS (for dashboard/reporting)
const mockAlertStatistics = {
  last24Hours: {
    total: 7,
    critical: 3,
    warning: 4,
    byParameter: {
      DO: 2,
      Temperature: 2,
      Salinity: 1,
      pH: 1,
      Turbidity: 1
    }
  },
  last7Days: {
    total: 21,
    critical: 8,
    warning: 13,
    byParameter: {
      DO: 5,
      Temperature: 5,
      Salinity: 4,
      pH: 4,
      Turbidity: 3
    }
  },
  last30Days: {
    total: 68,
    critical: 24,
    warning: 44,
    byParameter: {
      DO: 18,
      Temperature: 16,
      Salinity: 12,
      pH: 13,
      Turbidity: 9
    }
  },
  mostCommonIssue: 'DO',
  peakAlertTime: '04:00-06:00 AM', // Early morning DO issues
  averageResponseTime: 45 // minutes
};

// THRESHOLD CONFIGURATION (current system limits)
const mockThresholdConfig = {
  DO: {
    critical: { min: 3.0, max: 15.0 },
    warning: { min: 4.0, max: 12.0 },
    optimal: { min: 5.0, max: 8.0 },
    unit: 'mg/L'
  },
  Temperature: {
    critical: { min: 20.0, max: 35.0 },
    warning: { min: 22.0, max: 32.0 },
    optimal: { min: 26.0, max: 30.0 },
    unit: '°C'
  },
  Salinity: {
    critical: { min: 0.0, max: 35.0 },
    warning: { min: 5.0, max: 30.0 },
    optimal: { min: 15.0, max: 25.0 },
    unit: 'ppt'
  },
  Turbidity: {
    critical: { min: 0.0, max: 100.0 },
    warning: { min: 0.0, max: 50.0 },
    optimal: { min: 0.0, max: 30.0 },
    unit: 'NTU'
  },
  pH: {
    critical: { min: 6.0, max: 9.0 },
    warning: { min: 6.5, max: 8.5 },
    optimal: { min: 7.0, max: 8.0 },
    unit: ''
  }
};

// NOTIFICATION SETTINGS (for future Firebase integration)
const mockNotificationSettings = {
  email: {
    enabled: true,
    recipients: ['admin@example.com', 'operator@example.com'],
    criticalOnly: false,
    digest: true, // Send daily digest
    digestTime: '08:00' // 8 AM
  },
  sms: {
    enabled: true,
    recipients: ['+639123456789', '+639987654321'],
    criticalOnly: true, // Only send SMS for critical alerts
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '06:00'
    }
  },
  push: {
    enabled: true,
    criticalOnly: false,
    sound: true,
    vibrate: true
  }
};

// EXPORT FOR USE IN APPLICATION
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockActiveAlerts,
    mockHistoryAlerts,
    mockAlertStatistics,
    mockThresholdConfig,
    mockNotificationSettings
  };
}

// For browser usage
if (typeof window !== 'undefined') {
  window.mockAlertsData = {
    activeAlerts: mockActiveAlerts,
    historyAlerts: mockHistoryAlerts,
    statistics: mockAlertStatistics,
    thresholds: mockThresholdConfig,
    notifications: mockNotificationSettings
  };
  
  console.log('Mock Alerts Data loaded successfully');
  console.log('Active Alerts:', mockActiveAlerts.length);
  console.log('History Alerts:', mockHistoryAlerts.length);
}