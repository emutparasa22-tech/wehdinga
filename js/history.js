// history.js - Historical Data and Export Functionality

const historyBody = document.getElementById("historyBody");
const dateFromInput = document.getElementById("dateFromInput");
const dateToInput = document.getElementById("dateToInput");
const filterBtn = document.getElementById("filterBtn");
const sortSelect = document.getElementById("sortSelect");

console.log("history.js loading...");
console.log("DOM Elements check:");
console.log("historyBody:", historyBody);
console.log("dateFromInput:", dateFromInput);
console.log("dateToInput:", dateToInput);
console.log("filterBtn:", filterBtn);

let historyData = [];
let currentSensorData = null;
// Note: thresholds are loaded in app.js as window.thresholds - we'll use that
let minDate = null;
let maxDate = null;

// Flatpickr instances
let fromPicker = null;
let toPicker = null;

// Pagination variables
let currentPage = 1;
let recordsPerPage = 10;
let filteredData = [];

// Check if database is available
if (typeof window.database === 'undefined') {
  console.error("Firebase database not initialized!");
} else {
  console.log("Firebase database available in history.js");
}

// ============== THRESHOLDS ARE LOADED IN APP.JS ===============
// We use window.thresholds which is set by app.js
// No need to load them again here

// ============== HELPER FUNCTION: GET COLOR BASED ON THRESHOLD ===============
function getColorClass(parameter, value) {
  if (!window.thresholds || !window.thresholds[parameter] || value === undefined || value === null) {
    return '';
  }

  const threshold = window.thresholds[parameter];
  const { safeMin, safeMax, warnMin, warnMax } = threshold;

  if (value >= safeMin && value <= safeMax) {
    return 'status-safe';
  }
  
  if ((value >= warnMin && value < safeMin) || (value > safeMax && value <= warnMax)) {
    return 'status-caution';
  }
  
  if (value < warnMin || value > warnMax) {
    return 'status-critical';
  }

  return '';
}

// ============== LOAD CURRENT SENSOR DATA ===============
window.database.ref("sensors").on("value", snapshot => {
  currentSensorData = snapshot.val();
  console.log("Current sensor data:", currentSensorData);
});

// ============== LOAD HISTORICAL DATA ===============
window.database.ref("history").limitToLast(500).on("value", snapshot => {
  historyData = [];

  snapshot.forEach(child => {
    const data = child.val();

    // Handle both 'timestamp' (number) and 'time' (string) formats
    let timestamp;
    
    if (data.timestamp && typeof data.timestamp === "number") {
      timestamp = data.timestamp;
    } else if (data.time && typeof data.time === "string") {
      timestamp = new Date(data.time).getTime();
      
      if (isNaN(timestamp)) {
        console.warn("Could not parse time string:", data.time);
        return;
      }
    } else {
      console.warn("Record has no valid timestamp or time field:", data);
      return;
    }

    const cleanData = {
      temperature: data.temperature,
      ph: data.ph,
      salinity: data.salinity,
      turbidity: data.turbidity,
      do: data.do,
      timestamp: timestamp
    };

    historyData.push(cleanData);
  });

  console.log("Total history records loaded:", historyData.length);
  
  if (historyData.length > 0) {
    console.log("Sample record:", historyData[0]);
    initializeDatePickers();
  } else {
    console.warn("No valid history data found!");
  }
});

// ============== INITIALIZE FLATPICKR DATE PICKERS ===============
function initializeDatePickers() {
  // Set date range to full year 2026
  minDate = new Date(2026, 0, 1); // January 1, 2026
  maxDate = new Date(2026, 11, 31); // December 31, 2026

  console.log("Date range:", minDate.toLocaleDateString(), "to", maxDate.toLocaleDateString());

  // Get dates that have data
  const datesWithData = new Set();
  historyData.forEach(d => {
    const date = new Date(d.timestamp);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    datesWithData.add(dateStr);
  });

  console.log("Dates with data:", datesWithData.size);

  // Check if dark mode is active
  const isDarkMode = document.body.classList.contains('dark');

  // Initialize "Start Date" picker
  fromPicker = flatpickr(dateFromInput, {
    dateFormat: "M d, Y",
    minDate: minDate,
    maxDate: maxDate,
    defaultDate: null,
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      // Mark days that have data
      const date = dayElem.dateObj;
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (datesWithData.has(dateStr)) {
        dayElem.classList.add('has-data');
      } else {
        dayElem.classList.add('no-data');
      }
      
      // Disable dates that are after the selected end date (if any)
      if (toPicker && toPicker.selectedDates.length > 0) {
        const endDate = toPicker.selectedDates[0];
        if (date > endDate) {
          dayElem.classList.add('flatpickr-disabled');
        }
      }
    },
    onMonthChange: function(selectedDates, dateStr, instance) {
      // Refresh calendar when month changes to apply constraints
      setTimeout(() => instance.redraw(), 0);
    },
    onYearChange: function(selectedDates, dateStr, instance) {
      // Refresh calendar when year changes to apply constraints
      setTimeout(() => instance.redraw(), 0);
    },
    onReady: function(selectedDates, dateStr, instance) {
      if (isDarkMode) {
        instance.calendarContainer.classList.add('dark-mode-calendar');
      }
    }
  });

  // Initialize "End Date" picker
  toPicker = flatpickr(dateToInput, {
    dateFormat: "M d, Y",
    minDate: minDate,
    maxDate: maxDate,
    defaultDate: null,
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      // Mark days that have data
      const date = dayElem.dateObj;
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (datesWithData.has(dateStr)) {
        dayElem.classList.add('has-data');
      } else {
        dayElem.classList.add('no-data');
      }
      
      // Disable dates that are before the selected start date (if any)
      if (fromPicker && fromPicker.selectedDates.length > 0) {
        const startDate = fromPicker.selectedDates[0];
        if (date < startDate) {
          dayElem.classList.add('flatpickr-disabled');
        }
      }
    },
    onMonthChange: function(selectedDates, dateStr, instance) {
      // Refresh calendar when month changes to apply constraints
      setTimeout(() => instance.redraw(), 0);
    },
    onYearChange: function(selectedDates, dateStr, instance) {
      // Refresh calendar when year changes to apply constraints
      setTimeout(() => instance.redraw(), 0);
    },
    onReady: function(selectedDates, dateStr, instance) {
      if (isDarkMode) {
        instance.calendarContainer.classList.add('dark-mode-calendar');
      }
    }
  });

  console.log("Date pickers initialized successfully!");
}

// ============== APPLY FILTER ===============
filterBtn.addEventListener("click", () => {
  const dateFromValue = dateFromInput.value;
  const dateToValue = dateToInput.value;

  console.log("Filter applied - Start Date:", dateFromValue, "End Date:", dateToValue);

  // UPDATED VALIDATION: Both dates are required
  if (!dateFromValue || !dateToValue) {
    alert("Please select both start date and end date");
    return;
  }

  // Parse selected dates
  const dateFrom = new Date(dateFromValue);
  const dateTo = new Date(dateToValue);

  if (dateFrom > dateTo) {
    alert("Start date cannot be after end date");
    return;
  }

  // Filter data for DATE RANGE
  let filtered = historyData.filter(item => {
    const itemDate = new Date(item.timestamp);
    
    // Set time to start of day for comparison
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const fromDateOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
    const toDateOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
    
    return itemDateOnly >= fromDateOnly && itemDateOnly <= toDateOnly;
  });

  console.log("Historical records matching filter:", filtered.length);

  // Sort data
  const sortOrder = sortSelect.value;
  filtered.sort((a, b) => {
    if (sortOrder === "oldest") {
      return a.timestamp - b.timestamp;
    } else {
      return b.timestamp - a.timestamp;
    }
  });

  console.log("Total filtered results:", filtered.length, "records");
  
  // Store filtered data and reset to page 1
  filteredData = filtered;
  currentPage = 1;
  
  renderTable();
  renderPagination();
});

// ============== ADD EVENT LISTENERS FOR DATE SELECTION ===============
// When start date changes, refresh end date picker to show proper constraints
dateFromInput.addEventListener("change", () => {
  if (toPicker) {
    setTimeout(() => toPicker.redraw(), 100);
  }
});

// When end date changes, refresh start date picker to show proper constraints
dateToInput.addEventListener("change", () => {
  if (fromPicker) {
    setTimeout(() => fromPicker.redraw(), 100);
  }
});

// ============== RENDER HISTORICAL DATA TABLE WITH PAGINATION ===============
function renderTable() {
  historyBody.innerHTML = "";

  if (filteredData.length === 0) {
    historyBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <i class="fas fa-info-circle" style="font-size: 2em; color: #0ea5e9; margin-bottom: 10px;"></i>
          <div style="font-size: 1.1em; font-weight: 600; color: #334155; margin-top: 10px;">No Data Available</div>
          <div style="font-size: 0.95em; color: #64748b; margin-top: 5px;">There are no records for the selected date range</div>
        </td>
      </tr>
    `;
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    if (paginationInfo) paginationInfo.innerHTML = '';
    if (paginationControls) paginationControls.innerHTML = '';
    
    updateExportButton();
    return;
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredData.length);
  const pageData = filteredData.slice(startIndex, endIndex);

  // Render rows for current page
  pageData.forEach(d => {
    const date = new Date(d.timestamp).toLocaleString();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${date}</strong></td>
      <td class="${getColorClass('temperature', d.temperature)}">${d.temperature !== undefined ? d.temperature.toFixed(1) : "--"}</td>
      <td class="${getColorClass('ph', d.ph)}">${d.ph !== undefined ? d.ph.toFixed(2) : "--"}</td>
      <td class="${getColorClass('salinity', d.salinity)}">${d.salinity !== undefined ? d.salinity.toFixed(1) : "--"}</td>
      <td class="${getColorClass('turbidity', d.turbidity)}">${d.turbidity !== undefined ? d.turbidity.toFixed(1) : "--"}</td>
      <td class="${getColorClass('do', d.do)}">${d.do !== undefined ? d.do.toFixed(1) : "--"}</td>
    `;
    historyBody.appendChild(row);
  });

  // Update info display
  updatePaginationInfo(startIndex + 1, endIndex, filteredData.length);
  
  updateExportButton();
}

// ============== UPDATE PAGINATION INFO ===============
function updatePaginationInfo(start, end, total) {
  const infoElement = document.getElementById('paginationInfo');
  if (infoElement) {
    infoElement.textContent = `Showing ${start}-${end} of ${total} records`;
  }
}

// ============== RENDER PAGINATION CONTROLS ===============
function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginationContainer = document.getElementById('paginationControls');
  
  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  // Previous button
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i> Previous
    </button>
  `;

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
}

// ============== GO TO PAGE FUNCTION ===============
function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderTable();
  renderPagination();
  
  // Scroll to top of table
  const table = document.querySelector('.history-table');
  if (table) {
    table.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============== SUBMENU SWITCHING ===============
function showDataView() {
  const dataSection = document.getElementById('dataViewSection');
  const analyticsSection = document.getElementById('analyticsSection');
  
  if (dataSection) dataSection.style.display = 'block';
  if (analyticsSection) analyticsSection.style.display = 'none';
  
  // Update active submenu
  document.querySelectorAll('.submenu-item').forEach(item => item.classList.remove('active'));
  const dataViewTab = document.getElementById('dataViewTab');
  if (dataViewTab) dataViewTab.classList.add('active');
}

function showAnalytics() {
  const dataSection = document.getElementById('dataViewSection');
  const analyticsSection = document.getElementById('analyticsSection');
  
  if (dataSection) dataSection.style.display = 'none';
  if (analyticsSection) analyticsSection.style.display = 'block';
  
  // Update active submenu
  document.querySelectorAll('.submenu-item').forEach(item => item.classList.remove('active'));
  const analyticsTab = document.getElementById('analyticsTab');
  if (analyticsTab) analyticsTab.classList.add('active');
}

// ============== EXPORT FUNCTIONALITY ===============

// Enable/disable export button based on filtered data
function updateExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    if (filteredData.length > 0) {
      exportBtn.disabled = false;
      exportBtn.style.opacity = '1';
      exportBtn.style.cursor = 'pointer';
    } else {
      exportBtn.disabled = true;
      exportBtn.style.opacity = '0.5';
      exportBtn.style.cursor = 'not-allowed';
    }
  }
}

// Toggle export dropdown menu
document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      exportMenu.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.export-dropdown')) {
        exportMenu.classList.remove('show');
      }
    });
  }
});

// Generate timestamp for filename
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

// Calculate summary statistics
function calculateStats(data) {
  const params = ['temperature', 'ph', 'salinity', 'turbidity', 'do'];
  const stats = {};
  
  params.forEach(param => {
    const values = data.map(d => d[param]).filter(v => v !== undefined && v !== null);
    if (values.length > 0) {
      stats[param] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
      };
    }
  });
  
  return stats;
}

// Main export function
function exportData(format) {
  // Close dropdown menu
  const exportMenu = document.getElementById('exportMenu');
  if (exportMenu) exportMenu.classList.remove('show');
  
  // Check if data is available
  if (filteredData.length === 0) {
    alert('No data to export. Please apply a date filter first.');
    return;
  }
  
  // Show loading overlay
  const loadingOverlay = document.getElementById('exportLoading');
  if (loadingOverlay) loadingOverlay.classList.add('show');
  
  // Get date range for filename and header
  const dateFrom = dateFromInput.value || 'N/A';
  const dateTo = dateToInput.value || 'N/A';
  const timestamp = getTimestamp();
  const filename = `fishda_history_${timestamp}`;
  
  // Delay to show loading animation
  setTimeout(() => {
    try {
      if (format === 'csv') {
        exportToCSV(filename, dateFrom, dateTo);
      } else if (format === 'excel') {
        exportToExcel(filename, dateFrom, dateTo);
      } else if (format === 'pdf') {
        exportToPDF(filename, dateFrom, dateTo);
      }
      
      // Hide loading and show success
      if (loadingOverlay) loadingOverlay.classList.remove('show');
      showExportSuccess(format);
      
    } catch (error) {
      console.error('Export error:', error);
      if (loadingOverlay) loadingOverlay.classList.remove('show');
      alert('Error generating export file. Please try again.');
    }
  }, 500);
}

// Export to CSV
function exportToCSV(filename, dateFrom, dateTo) {
  let csv = '';
  
  // Add header info
  csv += `FISHDA Historical Data Export\n`;
  csv += `Export Date: ${new Date().toLocaleString()}\n`;
  csv += `Date Range: ${dateFrom} to ${dateTo}\n`;
  csv += `Total Records: ${filteredData.length}\n\n`;
  
  // Add column headers
  csv += 'Date & Time,Temperature (°C),pH,Salinity (ppt),Turbidity (NTU),DO (mg/L)\n';
  
  // Add data rows
  filteredData.forEach(item => {
    const date = new Date(item.timestamp).toLocaleString();
    csv += `${date},`;
    csv += `${item.temperature !== undefined ? item.temperature.toFixed(1) : 'N/A'},`;
    csv += `${item.ph !== undefined ? item.ph.toFixed(2) : 'N/A'},`;
    csv += `${item.salinity !== undefined ? item.salinity.toFixed(1) : 'N/A'},`;
    csv += `${item.turbidity !== undefined ? item.turbidity.toFixed(1) : 'N/A'},`;
    csv += `${item.do !== undefined ? item.do.toFixed(1) : 'N/A'}\n`;
  });
  
  // Add summary statistics
  csv += '\n--- Summary Statistics ---\n';
  csv += 'Parameter,Minimum,Maximum,Average\n';
  
  const stats = calculateStats(filteredData);
  const paramLabels = {
    temperature: 'Temperature (°C)',
    ph: 'pH',
    salinity: 'Salinity (ppt)',
    turbidity: 'Turbidity (NTU)',
    do: 'DO (mg/L)'
  };
  
  Object.keys(stats).forEach(param => {
    csv += `${paramLabels[param]},`;
    csv += `${stats[param].min.toFixed(2)},`;
    csv += `${stats[param].max.toFixed(2)},`;
    csv += `${stats[param].avg.toFixed(2)}\n`;
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

// Export to Excel
function exportToExcel(filename, dateFrom, dateTo) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data array
  const data = [];
  
  // Add header info
  data.push(['FISHDA Historical Data Export']);
  data.push(['Export Date:', new Date().toLocaleString()]);
  data.push(['Date Range:', `${dateFrom} to ${dateTo}`]);
  data.push(['Total Records:', filteredData.length]);
  data.push([]); // Empty row
  
  // Add column headers
  data.push(['Date & Time', 'Temperature (°C)', 'pH', 'Salinity (ppt)', 'Turbidity (NTU)', 'DO (mg/L)']);
  
  // Add data rows
  filteredData.forEach(item => {
    data.push([
      new Date(item.timestamp).toLocaleString(),
      item.temperature !== undefined ? parseFloat(item.temperature.toFixed(1)) : 'N/A',
      item.ph !== undefined ? parseFloat(item.ph.toFixed(2)) : 'N/A',
      item.salinity !== undefined ? parseFloat(item.salinity.toFixed(1)) : 'N/A',
      item.turbidity !== undefined ? parseFloat(item.turbidity.toFixed(1)) : 'N/A',
      item.do !== undefined ? parseFloat(item.do.toFixed(1)) : 'N/A'
    ]);
  });
  
  // Add summary statistics
  data.push([]); // Empty row
  data.push(['--- Summary Statistics ---']);
  data.push(['Parameter', 'Minimum', 'Maximum', 'Average']);
  
  const stats = calculateStats(filteredData);
  const paramLabels = {
    temperature: 'Temperature (°C)',
    ph: 'pH',
    salinity: 'Salinity (ppt)',
    turbidity: 'Turbidity (NTU)',
    do: 'DO (mg/L)'
  };
  
  Object.keys(stats).forEach(param => {
    data.push([
      paramLabels[param],
      parseFloat(stats[param].min.toFixed(2)),
      parseFloat(stats[param].max.toFixed(2)),
      parseFloat(stats[param].avg.toFixed(2))
    ]);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Date & Time
    { wch: 15 }, // Temperature
    { wch: 10 }, // pH
    { wch: 15 }, // Salinity
    { wch: 15 }, // Turbidity
    { wch: 12 }  // DO
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Historical Data');
  
  // Download Excel file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export to PDF
function exportToPDF(filename, dateFrom, dateTo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(14, 165, 233);
  doc.text('FISHDA Historical Data', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 14, 34);
  doc.text(`Total Records: ${filteredData.length}`, 14, 40);
  
  // Prepare table data
  const tableData = filteredData.map(item => [
    new Date(item.timestamp).toLocaleString(),
    item.temperature !== undefined ? item.temperature.toFixed(1) : 'N/A',
    item.ph !== undefined ? item.ph.toFixed(2) : 'N/A',
    item.salinity !== undefined ? item.salinity.toFixed(1) : 'N/A',
    item.turbidity !== undefined ? item.turbidity.toFixed(1) : 'N/A',
    item.do !== undefined ? item.do.toFixed(1) : 'N/A'
  ]);
  
  // Add main data table
  doc.autoTable({
    startY: 48,
    head: [['Date & Time', 'Temp (°C)', 'pH', 'Salinity (ppt)', 'Turbidity (NTU)', 'DO (mg/L)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Calculate summary statistics
  const stats = calculateStats(filteredData);
  const statsData = [];
  const paramLabels = {
    temperature: 'Temperature (°C)',
    ph: 'pH',
    salinity: 'Salinity (ppt)',
    turbidity: 'Turbidity (NTU)',
    do: 'DO (mg/L)'
  };
  
  Object.keys(stats).forEach(param => {
    statsData.push([
      paramLabels[param],
      stats[param].min.toFixed(2),
      stats[param].max.toFixed(2),
      stats[param].avg.toFixed(2)
    ]);
  });
  
  // Add summary statistics table
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(14, 165, 233);
  doc.text('Summary Statistics', 14, finalY);
  
  doc.autoTable({
    startY: finalY + 5,
    head: [['Parameter', 'Minimum', 'Maximum', 'Average']],
    body: statsData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Download PDF
  doc.save(`${filename}.pdf`);
}

// Show success message
function showExportSuccess(format) {
  const formatNames = {
    csv: 'CSV',
    excel: 'Excel',
    pdf: 'PDF'
  };
  
  // Create success notification
  const notification = document.createElement('div');
  notification.className = 'export-success';
  notification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${formatNames[format]} file downloaded successfully!</span>
  `;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Make functions global
window.goToPage = goToPage;
window.showDataView = showDataView;
window.showAnalytics = showAnalytics;
window.exportData = exportData;

console.log("✅ history.js fully loaded");