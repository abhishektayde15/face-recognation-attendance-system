    document.addEventListener('DOMContentLoaded', function() {
      // Toggle mobile menu
      const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
      const menuItems = document.getElementById('menu-items');
      
      if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
          menuItems.classList.toggle('hidden');
        });
      }
      
      // Tab switching
      const tabAdd = document.getElementById('tab-add');
      const tabView = document.getElementById('tab-view');
      const addStudentForm = document.getElementById('add-student-form');
      const viewStudentsTable = document.getElementById('view-students-table');
      
      tabAdd.addEventListener('click', function() {
        tabAdd.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', 'font-medium');
        tabAdd.classList.remove('text-gray-600');
        tabView.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600', 'font-medium');
        tabView.classList.add('text-gray-600');
        
        addStudentForm.classList.remove('hidden');
        viewStudentsTable.classList.add('hidden');
      });
      
      tabView.addEventListener('click', function() {
        tabView.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', 'font-medium');
        tabView.classList.remove('text-gray-600');
        tabAdd.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600', 'font-medium');
        tabAdd.classList.add('text-gray-600');
        
        viewStudentsTable.classList.remove('hidden');
        addStudentForm.classList.add('hidden');
        
        // Load students when switching to the view tab
        fetchStudents();
      });
      
      // Photo preview
      const studentPhoto = document.getElementById('student-photo');
      const photoPreview = document.getElementById('photo-preview');
      const previewImage = document.getElementById('preview-image');
      
      studentPhoto.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          
          reader.onload = function(e) {
            previewImage.src = e.target.result;
            photoPreview.classList.remove('hidden');
          }
          
          reader.readAsDataURL(this.files[0]);
        }
      });
      
      // Form submission
      const studentForm = document.getElementById('student-form');
      
      studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('student-name').value;
        const rollSuffix = document.getElementById('roll-number').value;
        const course = document.getElementById('student-course').value;
        const semester = document.getElementById('student-semester').value;
        const section = document.getElementById('student-section').value;
        const photo = document.getElementById('student-photo').files[0];
        
        // Validate
        if (!name || !rollSuffix || !course || !semester || !section || !photo) {
          showStatus('Please fill in all fields', true);
          return;
        }
        
        // Format roll number
        const rollNumber = `IC-2K22-${rollSuffix}`;
        
        // Create form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('roll_number', rollNumber);
        formData.append('course', course);
        formData.append('semester', semester);
        formData.append('section', section);
        formData.append('photo', photo);
        
        // Show loading
        showStatus('Adding student...', false, false);
        
        // Send request
        fetch('http://127.0.0.1:5500/api/add-student', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showStatus('Student added successfully!');
            studentForm.reset();
            photoPreview.classList.add('hidden');
          } else {
            showStatus(data.error || 'Failed to add student', true);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showStatus('Error adding student. Please try again.', true);
        });
      });
      
      // Show status message
      function showStatus(message, isError = false, autoHide = true) {
        const statusEl = document.getElementById('status-message');
        statusEl.textContent = message;
        statusEl.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${isError ? 'bg-red-500' : 'bg-green-500'} text-white`;
        statusEl.classList.remove('hidden');
        
        if (autoHide) {
          setTimeout(() => {
            statusEl.classList.add('hidden');
          }, 3000);
        }
      }
      
      // Fetch students
      function fetchStudents() {
        const courseFilter = document.getElementById('filter-course').value;
        const semesterFilter = document.getElementById('filter-semester').value;
        const sectionFilter = document.getElementById('filter-section').value;
        
        const studentsList = document.getElementById('students-list');
        const noStudentsMsg = document.getElementById('no-students');
        
        // Show loading
        studentsList.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">Loading students...</td></tr>';
        
        // Build query params
        const params = new URLSearchParams();
        if (courseFilter) params.append('course', courseFilter);
        if (semesterFilter) params.append('semester', semesterFilter);
        if (sectionFilter) params.append('section', sectionFilter);
        
        // Fetch students
        fetch(`http://127.0.0.1:5500/api/get-students?${params.toString()}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.students && data.students.length > 0) {
              displayStudents(data.students);
              noStudentsMsg.classList.add('hidden');
            } else {
              studentsList.innerHTML = '';
              noStudentsMsg.classList.remove('hidden');
            }
          })
          .catch(error => {
            console.error('Error:', error);
            studentsList.innerHTML = `
              <tr>
                <td colspan="7" class="py-4 text-center text-red-500">
                  Failed to load students. Please try again.
                </td>
              </tr>
            `;
          });
      }
      
      // Display students
      function displayStudents(students) {
        const studentsList = document.getElementById('students-list');
        studentsList.innerHTML = '';
        
        students.forEach(student => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-gray-50';
          
          row.innerHTML = `
            <td class="py-2 px-4 border-b">${student.name}</td>
            <td class="py-2 px-4 border-b">${student.roll_number}</td>
            <td class="py-2 px-4 border-b">${student.course}</td>
            <td class="py-2 px-4 border-b">${student.semester}</td>
            <td class="py-2 px-4 border-b">${student.section}</td>
            <td class="py-2 px-4 border-b text-center">
              <img src="${student.photo_url}" alt="${student.name}" class="w-10 h-10 object-cover rounded-full inline-block">
            </td>
            <td class="py-2 px-4 border-b text-center">
              <button onclick="deleteStudent(${student.id})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
            </td>
          `;
          
          studentsList.appendChild(row);
        });
      }
      
      // Apply filters button
      const applyFiltersBtn = document.getElementById('apply-filters');
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', fetchStudents);
      }
      
      // Delete student function
      window.deleteStudent = function(id) {
        if (confirm('Are you sure you want to delete this student?')) {
          fetch(`http://127.0.0.1:5500/api/delete-student/${id}`, {
            method: 'DELETE'
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showStatus('Student deleted successfully!');
              fetchStudents();
            } else {
              showStatus(data.error || 'Failed to delete student', true);
            }
          })
          .catch(error => {
            console.error('Error:', error);
            showStatus('Error deleting student. Please try again.', true);
          });
        }
      };
    });
