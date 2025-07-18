
    document.addEventListener('DOMContentLoaded', function() {
      // Toggle mobile menu
      const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
      const menuItems = document.getElementById('menu-items');
      
      if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
          menuItems.classList.toggle('hidden');
        });
      }
      
      // Elements
      const courseSelect = document.getElementById('filter-course');
      const semesterSelect = document.getElementById('filter-semester');
      const sectionSelect = document.getElementById('filter-section');
      const subjectSelect = document.getElementById('filter-subject');
      const startDateInput = document.getElementById('start-date');
      const endDateInput = document.getElementById('end-date');
      const applyFiltersBtn = document.getElementById('apply-filters');
      const exportPdfBtn = document.getElementById('export-pdf');
      const exportExcelBtn = document.getElementById('export-excel');
      const attendanceList = document.getElementById('attendance-list');
      const noRecordsMsg = document.getElementById('no-records');
      
      // Current attendance data
      let currentAttendanceData = [];
      
      // Show status message
      function showStatus(message, isError = false) {
        const statusEl = document.getElementById('status-message');
        statusEl.textContent = message;
        statusEl.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${isError ? 'bg-red-500' : 'bg-green-500'} text-white`;
        statusEl.classList.remove('hidden');
        
        setTimeout(() => {
          statusEl.classList.add('hidden');
        }, 3000);
      }
      
      // Format date for display
      function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Fetch attendance records
      function fetchAttendanceRecords() {
        const course = courseSelect.value;
        const semester = semesterSelect.value;
        const section = sectionSelect.value;
        const subject = subjectSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Show loading
        attendanceList.innerHTML = `
          <tr>
            <td colspan="8" class="py-4 text-center text-gray-500">
              Loading attendance records...
            </td>
          </tr>
        `;
        
        // Build query params
        const params = new URLSearchParams();
        if (course) params.append('course', course);
        if (semester) params.append('semester', semester);
        if (section) params.append('section', section);
        if (subject) params.append('subject', subject);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        // Make API request
        fetch(`http://127.0.0.1:5500/api/get-attendance?${params.toString()}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            if (data.success && data.data && data.data.length > 0) {
              // Store data for export
              currentAttendanceData = data.data;
              displayAttendanceRecords(data.data);
              noRecordsMsg.classList.add('hidden');
            } else {
              attendanceList.innerHTML = '';
              noRecordsMsg.classList.remove('hidden');
              currentAttendanceData = [];
            }
          })
          .catch(error => {
            console.error('Error fetching attendance records:', error);
            showStatus(`Error: ${error.message}`, true);
            attendanceList.innerHTML = `
              <tr>
                <td colspan="8" class="py-4 text-center text-red-500">
                  Failed to load attendance records. Please try again.
                </td>
              </tr>
            `;
          });
      }
      
      // Display attendance records
      function displayAttendanceRecords(records) {
        attendanceList.innerHTML = '';
        
        records.forEach(record => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-gray-50';
          
          row.innerHTML = `
            <td class="py-2 px-4 border-b">${record.name || '-'}</td>
            <td class="py-2 px-4 border-b">${record.roll_no || '-'}</td>
            <td class="py-2 px-4 border-b">${record.course || '-'}</td>
            <td class="py-2 px-4 border-b">${record.semester || '-'}</td>
            <td class="py-2 px-4 border-b">${record.section || '-'}</td>
            <td class="py-2 px-4 border-b">${record.subject || '-'}</td>
            <td class="py-2 px-4 border-b">${formatDate(record.date)}</td>
            <td class="py-2 px-4 border-b">
              <span class="px-2 py-1 rounded-full text-xs ${record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${record.present ? 'Present' : 'Absent'}
              </span>
            </td>
          `;
          
          attendanceList.appendChild(row);
        });
      }
      
      // Export to PDF
      function exportToPDF() {
        if (currentAttendanceData.length === 0) {
          showStatus('No data to export. Please retrieve attendance records first.', true);
          return;
        }
        
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          // Add title
          doc.setFontSize(18);
          doc.text('Attendance Report', 14, 22);
          
          // Add filter information
          doc.setFontSize(11);
          const filters = [];
          if (courseSelect.value) filters.push(`Course: ${courseSelect.value}`);
          if (semesterSelect.value) filters.push(`Semester: ${semesterSelect.value}`);
          if (sectionSelect.value) filters.push(`Section: ${sectionSelect.value}`);
          if (subjectSelect.value) filters.push(`Subject: ${subjectSelect.value}`);
          
          doc.text(`Filters: ${filters.join(', ') || 'None'}`, 14, 32);
          doc.text(`Date Range: ${startDateInput.value} to ${endDateInput.value}`, 14, 40);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 48);
          
          // Create table
          const tableColumn = ["Name", "Roll No", "Course", "Semester", "Section", "Subject", "Date", "Status"];
          const tableRows = [];
          
          currentAttendanceData.forEach(record => {
            const status = record.present ? 'Present' : 'Absent';
            const dateStr = formatDate(record.date);
            
            tableRows.push([
              record.name || '-',
              record.roll_no || '-',
              record.course || '-',
              record.semester || '-',
              record.section || '-',
              record.subject || '-',
              dateStr,
              status
            ]);
          });
          
          doc.autoTable({
            startY: 55,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] }
          });
          
          // Save PDF
          doc.save('attendance-report.pdf');
          showStatus('PDF exported successfully!');
        } catch (error) {
          console.error('Error exporting PDF:', error);
          showStatus('Failed to export PDF. Check console for details.', true);
        }
      }
      
      // Export to Excel
      function exportToExcel() {
        if (currentAttendanceData.length === 0) {
          showStatus('No data to export. Please retrieve attendance records first.', true);
          return;
        }
        
        try {
          // Prepare data
          const excelData = currentAttendanceData.map(record => ({
            'Name': record.name || '',
            'Roll Number': record.roll_no || '',
            'Course': record.course || '',
            'Semester': record.semester || '',
            'Section': record.section || '',
            'Subject': record.subject || '',
            'Date': formatDate(record.date),
            'Status': record.present ? 'Present' : 'Absent'
          }));
          
          // Create worksheet
          const ws = XLSX.utils.json_to_sheet(excelData);
          
          // Create workbook
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
          
          // Generate Excel file
          XLSX.writeFile(wb, 'attendance-report.xlsx');
          showStatus('Excel exported successfully!');
        } catch (error) {
          console.error('Error exporting Excel:', error);
          showStatus('Failed to export Excel. Check console for details.', true);
        }
      }
      
      // Event listeners
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', fetchAttendanceRecords);
      }
      
      if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
      }
      
      if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
      }
      
      // Set default dates if not already set
      if (startDateInput && !startDateInput.value) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        startDateInput.value = oneMonthAgo.toISOString().split('T')[0];
      }
      
      if (endDateInput && !endDateInput.value) {
        const today = new Date();
        endDateInput.value = today.toISOString().split('T')[0];
      }
    });
 