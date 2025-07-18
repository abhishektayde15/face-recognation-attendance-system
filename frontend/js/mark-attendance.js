
    // Add event listeners only after the document is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Document fully loaded');
      
      // Mobile menu toggle functionality
      const menuToggle = document.getElementById('mobile-menu-toggle');
      const menuItems = document.getElementById('menu-items');
      
      if (menuToggle) {
        menuToggle.addEventListener('click', function() {
          if (menuItems.classList.contains('hidden')) {
            menuItems.classList.remove('hidden');
          } else {
            menuItems.classList.add('hidden');
          }
        });
      }
      
      // Attach event listener to submit button(upload)
      document.getElementById('upload-btn').addEventListener('click', function(event) {
        console.log('Submit button clicked');
        event.preventDefault();
        uploadPhotos();// for taking photo from frontend nad send backend for face reco
        return false;
      });
      
      // Store attendance button
      document.getElementById('store-btn').addEventListener('click', function(event) {
  console.log('Store attendance clicked');
  event.preventDefault();
  storeAttendance();
  return false;
});
      
      // Set default date to today
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      document.getElementById('attendance-date').value = formattedDate;
      
      // Allow navigation to all pages in the navigation menu
      document.querySelectorAll('nav a').forEach(link => {
        // Add event listener to clear the navigation warning
        link.addEventListener('click', function() {
          // Clear the navigation warning when clicking on a navigation link
          window.onbeforeunload = null;
          console.log('Navigation warning cleared for:', this.href);
        });
      });
      
      // For all other links (not in navigation), prevent default action
      document.querySelectorAll('a:not(nav a)').forEach(link => {
        if (link.getAttribute('target') !== '_blank') {
          link.addEventListener('click', function(event) {
            // Only allow specific links to work
            if (!this.href.includes('terminal-results.html')) {
              event.preventDefault();
              console.log('Non-nav link click prevented:', this.href);
            } else {
              // Clear warning for allowed links
              window.onbeforeunload = null;
            }
          });
        }
      });
      
      // Add event listeners to all back buttons to clear navigation warnings
      document.querySelectorAll('button[onclick^="backToStep"]').forEach(button => {
        button.addEventListener('click', function() {
          // Don't clear the warning when just navigating between steps
          // The warning should remain active during the attendance process
          console.log('Navigating between steps - warning remains active');
        });
      });
      
      // Add warning when leaving the page before storing attendance
      window.onbeforeunload = function(e) {
        // Only show warning if we're on step 5 (results) and haven't stored attendance yet
        if (document.getElementById('step5').style.display === 'block' && 
            !document.getElementById('store-btn').disabled) {
            
            const message = "You haven't stored the attendance yet. Are you sure you want to leave?";
            e.returnValue = message;
            return message;
        }
      };
    });

    // Global variables
    let selectedCourse = '';
    let recognizedStudents = [];
    let recognizedStudentDetails = [];
    
    // Helper functions
    function updateStatus(message) {
      document.getElementById('status').textContent = message;
      console.log('Status:', message);
    }
    
    function showStep(step) {
      console.log('Showing step:', step);
      // Hide all steps
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = 'none';
      document.getElementById('step3').style.display = 'none';
      document.getElementById('step4').style.display = 'none';
      document.getElementById('step5').style.display = 'none';
      
      // Show requested step
      document.getElementById('step' + step).style.display = 'block';
    }
    
    function goToStep(step) {
      console.log('Going to step:', step);
      
      // If going to step 4, validate subject selection
      if (step === 4) {
        const subject = document.getElementById('subject').value;
        if (!subject) {
          alert('Please select a subject');
          return;
        }
      }
      
      showStep(step);
    }
    
    function backToStep(step) {
      console.log('Going back to step:', step);
      showStep(step);
      if (step === 1) {
        selectedCourse = '';
        document.querySelectorAll('.course-btn').forEach(btn => {
          btn.classList.remove('bg-green-100');
        });
      }
    }
    
    // Step 1: Course Selection
    function selectCourse(course) {
      console.log('Course selected:', course);
      selectedCourse = course;
      
      // Highlight selected course
      document.querySelectorAll('.course-btn').forEach(btn => {
        if (btn.textContent === course) {
          btn.classList.add('bg-green-100');
        } else {
          btn.classList.remove('bg-green-100');
        }
      });
      
      // Move to step 2
      showStep(2);
      updateStatus('Course selected: ' + course);
    }
    
    // Step 2: Check semester and section
    function checkStepTwo() {
      const semester = document.getElementById('semester').value;
      const section = document.getElementById('section').value;
      
      console.log('Semester:', semester, 'Section:', section);
      
      if (semester && section) {
        // Load subjects for the course and semester
        fetchSubjects(selectedCourse, semester);
        
        // Continue to step 3
        showStep(3);
        updateStatus('Semester and section selected');
      }
    }
    
    // Load subjects for the course and semester
    function fetchSubjects(course, semester) {
      updateStatus('Loading subjects...');
      fetch(`http://localhost:5500/api/subjects?course=${course}&semester=${semester}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load subjects');
          }
          return response.json();
        })
        .then(data => {
          console.log('API Response:', data); // Debug line
          const subjectSelect = document.getElementById('subject');
          
          // Clear previous options except the first one
          while (subjectSelect.options.length > 1) {
            subjectSelect.remove(1);
          }
          
          // Add new options
          if (data.subjects && data.subjects.length > 0) {
            data.subjects.forEach(subject => {
              const option = document.createElement('option');
              option.value = subject;  // Changed from subject.subject_name
              option.textContent = subject;  // Changed from subject.subject_name
              subjectSelect.appendChild(option);
            });
            updateStatus('Subjects loaded');
          } else {
            // Add some default subjects if none are found
            const defaultSubjects = ['Operating Systems', 'Cloud Computing', 'SAD', 'HCI'];
            defaultSubjects.forEach(subject => {
              const option = document.createElement('option');
              option.value = subject;
              option.textContent = subject;
              subjectSelect.appendChild(option);
            });
            updateStatus('Using default subjects');
          }
        })
        .catch(error => {
          console.error('Error loading subjects:', error);
          // Add some default subjects as a fallback
          const subjectSelect = document.getElementById('subject');
          const defaultSubjects = ['Operating Systems', 'Cloud Computing', 'SAD', 'HCI'];
          
          // Clear previous options except the first one
          while (subjectSelect.options.length > 1) {
            subjectSelect.remove(1);
          }
          
          defaultSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
          });
          
          updateStatus('Using default subjects due to error');
        });
    }
    
    // Step 4: Upload photos with fetch API
    function uploadPhotos() {
      console.log('uploadPhotos called - clearing previous results at ' + new Date().toISOString());
      
      // Reset all stored data
      recognizedStudents = [];
      recognizedStudentDetails = [];
      
      // Get values
      const semester = document.getElementById('semester').value;
      const section = document.getElementById('section').value;
      const subject = document.getElementById('subject').value;
      const photos = document.getElementById('photos').files;
      
      console.log('Upload data - Course:', selectedCourse, 'Semester:', semester, 'Section:', section, 'Subject:', subject, 'Photos count:', photos.length);
      
      // Validate
      if (!selectedCourse || !semester || !section || !subject || photos.length === 0) {
        alert('Please fill in all fields and upload at least one photo.');
        return;
      }
      
      // Show loading indicator
      document.getElementById('loading-indicator').style.display = 'flex';
      
      // Show results section with loading message
      showStep(5);
      document.getElementById('results-content').innerHTML = '<p class="text-gray-600">Processing attendance... Please wait.</p>';
      updateStatus('Processing attendance...');
      
      // Create form data
      const formData = new FormData();
      formData.append('course', selectedCourse);
      formData.append('semester', semester);
      formData.append('section', section);
      formData.append('subject', subject);
      
      for (let i = 0; i < photos.length; i++) {
        formData.append('photos', photos[i]);
        console.log(`Adding photo: ${photos[i].name}, size: ${photos[i].size}`);
      }
      
      // Add a randomized parameter to prevent caching
      const nocache = Math.random().toString(36).substring(7);
      const url = `http://localhost:5500/api/attendance?nocache=${nocache}`;
      
      // Send API request with fetch
      fetch(url, {
        method: 'POST',
        body: formData,
        cache: 'no-store'  // Tell fetch not to cache
      })
      .then(response => {
        // Hide loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
        
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || 'Error processing attendance');
          });
        }
        return response.json();
      })
      .then(data => {
        // Log with timestamp to verify fresh data
        console.log(`Response received at ${new Date().toISOString()}:`, data);
        
        const studentsFound = data.students || [];
        const studentsDetails = data.student_details || [];
        
        // Store for later use when storing attendance
        recognizedStudents = studentsFound;
        recognizedStudentDetails = studentsDetails;
      
        // Display results with enhanced debugging and visualization
        const resultsContent = document.getElementById('results-content');
        
        // Add processing timestamp at the top
        let html = `<div class="bg-gray-100 p-2 mb-4 text-xs">
          <strong>Processing Time:</strong> ${data.processed_at || 'Unknown'}<br>
          <strong>Request ID:</strong> ${data.request_id || 'Unknown'}
        </div>`;
        
        // Add debug info
        html += `<div class="bg-blue-50 p-2 mb-4 text-xs">
            <strong>Debug:</strong> Processing ${studentsFound.length} students<br>
            <strong>Course:</strong> ${selectedCourse}, <strong>Semester:</strong> ${semester}, <strong>Section:</strong> ${section}
        </div>`;
        
        // Use studentsFound for display
        const numIdentified = studentsFound.length || 0;
        
        if (numIdentified > 0) {
          html += '<div class="mb-4">';
          html += `<div class="font-semibold text-green-600 mb-2">Success! Identified ${numIdentified} students.</div>`;
          html += '</div>';
          
          // Create table for student details
          html += '<div class="mt-4">';
          html += '<div class="font-semibold text-gray-800 mb-2">Students Present:</div>';
          
          // Create table with student details
          html += '<table class="w-full border-collapse mt-2 mb-4">';
          html += `<thead>
              <tr class="bg-gray-100">
                  <th class="border px-2 py-1 text-left">Name</th>
                  <th class="border px-2 py-1 text-left">Roll Number</th>
                  <th class="border px-2 py-1 text-left">Course</th>
                  <th class="border px-2 py-1 text-center">Action</th>
              </tr>
          </thead>
          <tbody>`;
          
          studentsFound.forEach((student, index) => {
            html += `<tr id="student-row-${index}" data-student-id="${student.id}">
                <td class="border px-2 py-1">${student.name || 'Unknown'}</td>
                <td class="border px-2 py-1">${student.roll_number || ''}</td>
                <td class="border px-2 py-1">${student.course || ''}</td>
                <td class="border px-2 py-1 text-center">
                  <button onclick="removeStudent(${index})" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Remove</button>
                </td>
            </tr>`;
          });
          
          html += '</tbody></table>';
          html += '</div>';
          
          resultsContent.innerHTML = html;
        } else {
          resultsContent.innerHTML = html + '<div class="text-red-500 font-semibold">No students found in the photo(s).</div>';
        }
        
        // Add the remove function
        window.removeStudent = function(index) {
          // Remove from array
          recognizedStudents.splice(index, 1);
          
          // Remove visual row
          document.getElementById('student-row-'+index).style.display = 'none';
          
          // Update count
          const countElement = document.querySelector('.text-green-600');
          if (countElement) {
            countElement.textContent = 'Success! Identified ' + recognizedStudents.length + ' students.';
          }
        };
        
        updateStatus('Completed');
      })
      .catch(error => {
        console.error('Error:', error);
        // Hide loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
        
        document.getElementById('results-content').innerHTML = `
          <div class="text-red-500 font-semibold">Error processing attendance</div>
          <div class="mt-2 text-gray-600">${error.message}</div>
          <div class="mt-4">
            <p>Please check:</p>
            <ul class="list-disc pl-5 mt-2">
              <li>Flask backend is running</li>
              <li>Photos are clear with visible faces</li>
              <li>Students are registered in the system</li>
            </ul>
          </div>
        `;
        
        updateStatus('Error');
      });
    }
    
    // Reset form for new attendance
    function resetForm() {
      // Clear the navigation warning since this is intentional navigation
      window.onbeforeunload = null;
      
      selectedCourse = '';
      document.getElementById('semester').value = '';
      document.getElementById('section').value = '';
      document.getElementById('subject').value = '';
      document.getElementById('photos').value = '';
      
      // Reset recognized students
      recognizedStudents = [];
      recognizedStudentDetails = [];
      
      // Reset store button
      const storeBtn = document.getElementById('store-btn');
      if (storeBtn) {
        storeBtn.disabled = false;
        storeBtn.classList.remove('bg-gray-400');
        storeBtn.classList.add('bg-green-600', 'hover:bg-green-700');
      }
      
      document.querySelectorAll('.course-btn').forEach(btn => {
        btn.classList.remove('bg-green-100');
      });
      
      showStep(1);
      updateStatus('Ready');
    }
    
    // Store attendance in the database
    function storeAttendance() {
  console.log('storeAttendance called');
  
  // Get current values from form (be careful with element IDs)
  const course = selectedCourse; // Use the global variable you already have
  const semester = document.getElementById('semester').value;
  const section = document.getElementById('section').value;
  const subject = document.getElementById('subject').value;
  
  // For date, check if the element exists and has a value
  let date;
  const dateElement = document.getElementById('attendance-date');
  if (dateElement && dateElement.value) {
    date = dateElement.value;
  } else {
    // Fallback to today's date if no date element or value
    date = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
  
  // Check if we have students
  if (!recognizedStudents || recognizedStudents.length === 0) {
    alert('No students to mark attendance for!');
    return;
  }
  
  // Log for debugging
  console.log('Form values:', { course, semester, section, subject, date });
  console.log('Students:', recognizedStudents);
  
  // Get student IDs from the recognized students array
  const studentIds = recognizedStudents.map(student => student.id);
  
  // Add debugging
  if (!studentIds.length) {
    console.error('No student IDs found in recognizedStudents');
    alert('No student IDs found. Cannot record attendance.');
    return;
  }
  
  console.log('Storing attendance for students:', studentIds);
  
  // Show status
  updateStatus('Storing attendance...');
  
  fetch('http://127.0.0.1:5500/api/store-attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_ids: studentIds,
    subject: subject,
    course: course,
    semester: semester,
    section: section,
    date: date
  })
})
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Response data:', data);
    if (data.success) {
      updateStatus('Attendance stored successfully');
      alert(data.message || 'Attendance stored successfully');
    } else {
      updateStatus('Error storing attendance');
      alert(data.error || 'Error storing attendance');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    updateStatus('Error storing attendance');
    alert('Error storing attendance: ' + error.message);
  });
}

