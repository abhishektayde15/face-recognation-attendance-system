document.addEventListener('DOMContentLoaded', function() {
    console.log("Student Registration JS Loaded");
    
    // Tab switching
    const registerTab = document.getElementById('register-tab');
    const manageTab = document.getElementById('manage-tab');
    const subjectsTab = document.getElementById('subjects-tab');
    
    const registerPanel = document.getElementById('register-panel');
    const managePanel = document.getElementById('manage-panel');
    const subjectsPanel = document.getElementById('subjects-panel');
    
    registerTab.addEventListener('click', function(e) {
      e.preventDefault();
      // Update tabs
      registerTab.classList.remove('bg-gray-200');
      registerTab.classList.add('bg-white', 'text-blue-500');
      manageTab.classList.remove('bg-white', 'text-blue-500');
      manageTab.classList.add('bg-gray-200', 'text-gray-700');
      subjectsTab.classList.remove('bg-white', 'text-blue-500');
      subjectsTab.classList.add('bg-gray-200', 'text-gray-700');
      
      // Show/hide panels
      registerPanel.classList.remove('hidden');
      managePanel.classList.add('hidden');
      subjectsPanel.classList.add('hidden');
      
      updateStatus('Register tab shown');
    });
    
    manageTab.addEventListener('click', function(e) {
      e.preventDefault();
      // Update tabs
      manageTab.classList.remove('bg-gray-200');
      manageTab.classList.add('bg-white', 'text-blue-500');
      registerTab.classList.remove('bg-white', 'text-blue-500');
      registerTab.classList.add('bg-gray-200', 'text-gray-700');
      subjectsTab.classList.remove('bg-white', 'text-blue-500');
      subjectsTab.classList.add('bg-gray-200', 'text-gray-700');
      
      // Show/hide panels
      managePanel.classList.remove('hidden');
      registerPanel.classList.add('hidden');
      subjectsPanel.classList.add('hidden');
      
      // Load students
      loadStudents();
      updateStatus('Manage tab shown');
    });
    
    subjectsTab.addEventListener('click', function(e) {
      e.preventDefault();
      // Update tabs
      subjectsTab.classList.remove('bg-gray-200');
      subjectsTab.classList.add('bg-white', 'text-blue-500');
      registerTab.classList.remove('bg-white', 'text-blue-500');
      registerTab.classList.add('bg-gray-200', 'text-gray-700');
      manageTab.classList.remove('bg-white', 'text-blue-500');
      manageTab.classList.add('bg-gray-200', 'text-gray-700');
      
      // Show/hide panels
      subjectsPanel.classList.remove('hidden');
      registerPanel.classList.add('hidden');
      managePanel.classList.add('hidden');
      
      // Load subjects
      loadSubjects();
      updateStatus('Subjects tab shown');
    });
    
    // Photo selection and preview
    const photoInput = document.getElementById('photo');
    const photoButton = document.getElementById('select-photo');
    const photoPreview = document.getElementById('preview-img');
    
    photoButton.addEventListener('click', function() {
      photoInput.click();
    });
    
    photoInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          photoPreview.src = e.target.result;
          photoPreview.classList.remove('hidden');
          photoPreview.parentElement.querySelector('svg').classList.add('hidden');
        };
        reader.readAsDataURL(this.files[0]);
        updateStatus('Photo selected');
      }
    });
    
    // Student Form Submission
    const studentForm = document.getElementById('student-form');
    const registerResult = document.getElementById('register-result');
    
    studentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Create FormData (handles file uploads)
      const formData = new FormData(studentForm);
      
      // Show loading state
      registerResult.innerHTML = '<div class="p-4 text-blue-700 bg-blue-100 rounded">Registering student...</div>';
      registerResult.classList.remove('hidden');
      
      // Submit form
      fetch('/api/students', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.student) {
          // Success
          registerResult.innerHTML = `<div class="p-4 text-green-700 bg-green-100 rounded">
            <p class="font-bold">Success!</p>
            <p>${data.message}</p>
          </div>`;
          
          // Reset form
          studentForm.reset();
          
          // Reset photo preview
          photoPreview.src = '';
          photoPreview.classList.add('hidden');
          photoPreview.parentElement.querySelector('svg').classList.remove('hidden');
          
          updateStatus('Student registered');
        } else {
          // Error
          registerResult.innerHTML = `<div class="p-4 text-red-700 bg-red-100 rounded">
            <p class="font-bold">Error!</p>
            <p>${data.message || 'Failed to register student. Please try again.'}</p>
          </div>`;
          
          updateStatus('Registration failed');
        }
      })
      .catch(error => {
        console.error('Error registering student:', error);
        registerResult.innerHTML = `<div class="p-4 text-red-700 bg-red-100 rounded">
          <p class="font-bold">Error!</p>
          <p>Failed to register student. Please try again later.</p>
        </div>`;
        
        updateStatus('Registration error');
      });
    });
    
    // Subject Form Submission
    const subjectForm = document.getElementById('subject-form');
    const subjectResult = document.getElementById('subject-result');
    
    subjectForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Create FormData
      const formData = new FormData(subjectForm);
      
      // Show loading state
      subjectResult.innerHTML = '<div class="p-4 text-blue-700 bg-blue-100 rounded">Adding subject...</div>';
      subjectResult.classList.remove('hidden');
      
      // Submit form
      fetch('/api/subjects/add', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.subject) {
          // Success
          subjectResult.innerHTML = `<div class="p-4 text-green-700 bg-green-100 rounded">
            <p class="font-bold">Success!</p>
            <p>${data.message}</p>
          </div>`;
          
          // Reset form
          subjectForm.reset();
          
          // Reload subjects
          loadSubjects();
          
          updateStatus('Subject added');
        } else {
          // Error
          subjectResult.innerHTML = `<div class="p-4 text-red-700 bg-red-100 rounded">
            <p class="font-bold">Error!</p>
            <p>${data.message || 'Failed to add subject. Please try again.'}</p>
          </div>`;
          
          updateStatus('Subject add failed');
        }
      })
      .catch(error => {
        console.error('Error adding subject:', error);
        subjectResult.innerHTML = `<div class="p-4 text-red-700 bg-red-100 rounded">
          <p class="font-bold">Error!</p>
          <p>Failed to add subject. Please try again later.</p>
        </div>`;
        
        updateStatus('Subject add error');
      });
    });
    
    // Load and display students
    function loadStudents() {
      const studentsTable = document.getElementById('students-table');
      const noStudentsMessage = document.getElementById('no-students-message');
      const filterCourse = document.getElementById('filter-course');
      const filterSemester = document.getElementById('filter-semester');
      const filterSection = document.getElementById('filter-section');
      
      // Show loading state
      studentsTable.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
            Loading students...
          </td>
        </tr>
      `;
      noStudentsMessage.classList.add('hidden');
      
      // Build URL with filters
      let url = '/api/students';
      const params = [];
      
      if (filterCourse.value) {
        params.push(`course=${encodeURIComponent(filterCourse.value)}`);
      }
      
      if (filterSemester.value) {
        params.push(`semester=${encodeURIComponent(filterSemester.value)}`);
      }
      
      if (filterSection.value) {
        params.push(`section=${encodeURIComponent(filterSection.value)}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      // Fetch students
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.students && data.students.length > 0) {
            // Clear table
            studentsTable.innerHTML = '';
            
            // Add students to table
            data.students.forEach(student => {
              const row = document.createElement('tr');
              
              // Create photo cell content
              let photoCell = 'No photo';
              if (student.photo_path) {
                photoCell = `<img src="/known_images/${student.photo_path}" alt="${student.name}" class="h-10 w-10 object-cover rounded">`;
              }
              
              row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.roll_number}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.enrollment_number}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.course}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.semester}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.section}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${photoCell}</td>
              `;
              
              studentsTable.appendChild(row);
            });
            
            updateStatus(`${data.students.length} students loaded`);
          } else {
            // No students found
            studentsTable.innerHTML = '';
            noStudentsMessage.classList.remove('hidden');
            
            updateStatus('No students found');
          }
        })
        .catch(error => {
          console.error('Error loading students:', error);
          studentsTable.innerHTML = `
            <tr>
              <td colspan="7" class="px-6 py-4 text-center text-sm text-red-500">
                Error loading students. Please try again.
              </td>
            </tr>
          `;
          
          updateStatus('Student load error');
        });
    }
    
    // Load and display subjects
    function loadSubjects() {
      const subjectsContainer = document.getElementById('subjects-container');
      const viewCourse = document.getElementById('view-course');
      const viewSemester = document.getElementById('view-semester');
      
      // Show loading state
      subjectsContainer.innerHTML = `
        <div class="text-center py-4 text-gray-500">
          Loading subjects...
        </div>
      `;
      
      // Build URL with filters
      let url = '/api/subjects';
      const params = [];
      
      if (viewCourse.value) {
        params.push(`course=${encodeURIComponent(viewCourse.value)}`);
      }
      
      if (viewSemester.value) {
        params.push(`semester=${encodeURIComponent(viewSemester.value)}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      // Fetch subjects
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.subjects && data.subjects.length > 0) {
            // Display subjects
            let html = '';
            html += `<div class="p-3 border rounded">`;
            html += `<h3 class="font-medium mb-2">Subjects</h3>`;
            html += `<div class="flex flex-wrap gap-2">`;
            
            data.subjects.forEach(subject => {
              html += `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">${subject}</span>`;
            });
            
            html += `</div></div>`;
            
            // Display in container
            subjectsContainer.innerHTML = html;
            
            updateStatus(`${data.subjects.length} subjects loaded`);
          } else {
            // No subjects found
            subjectsContainer.innerHTML = `
              <div class="text-center py-4 text-gray-500">
                No subjects found for the selected filters. Please add subjects first.
              </div>
            `;
            
            updateStatus('No subjects found');
          }
        })
        .catch(error => {
          console.error('Error loading subjects:', error);
          subjectsContainer.innerHTML = `
            <div class="text-center py-4 text-red-500">
              Error loading subjects. Please try again.
            </div>
          `;
          
          updateStatus('Subject load error');
        });
    }
    
    // Load courses for all dropdowns
    function loadCourses() {
      // Get all course dropdowns
      const courseDropdowns = [
        document.getElementById('filter-course'),
        document.getElementById('view-course'),
        document.getElementById('subject-course')
      ];
      
      // Fetch courses
      fetch('/api/courses')
        .then(response => response.json())
        .then(data => {
          if (data.courses && data.courses.length > 0) {
            // Populate all dropdowns
            courseDropdowns.forEach(dropdown => {
              if (dropdown) {
                // Keep the first option (All Courses)
                const firstOption = dropdown.options[0];
                dropdown.innerHTML = '';
                dropdown.appendChild(firstOption);
                
                // Add courses
                data.courses.forEach(course => {
                  const option = document.createElement('option');
                  option.value = course;
                  option.textContent = course;
                  dropdown.appendChild(option);
                });
              }
            });
            
            updateStatus('Courses loaded');
          }
        })
        .catch(error => {
          console.error('Error loading courses:', error);
        });
    }
    
    // Filter change events
    document.getElementById('filter-course').addEventListener('change', loadStudents);
    document.getElementById('filter-semester').addEventListener('change', loadStudents);
    document.getElementById('filter-section').addEventListener('change', loadStudents);
    
    document.getElementById('view-course').addEventListener('change', loadSubjects);
    document.getElementById('view-semester').addEventListener('change', loadSubjects);
    
    // Refresh buttons
    document.getElementById('refresh-students').addEventListener('click', loadStudents);
    document.getElementById('refresh-subjects').addEventListener('click', loadSubjects);
    
    // Helper function to update status
    function updateStatus(message) {
      document.getElementById('status').textContent = message;
      console.log("Status:", message);
    }
    
    // Initial load
    loadCourses();
    updateStatus('Initialized');
  });