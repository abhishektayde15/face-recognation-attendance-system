// DOM Elements
const studentForm = document.getElementById('add-student-form');
const studentList = document.getElementById('student-list');
const noStudentsMessage = document.getElementById('no-students');
const statusMessage = document.getElementById('status-message');

// Filter elements
const filterCourse = document.getElementById('filter-course');
const filterSemester = document.getElementById('filter-semester');
const filterSection = document.getElementById('filter-section');

// Load students on page load
document.addEventListener('DOMContentLoaded', loadStudents);

// Add event listeners
studentForm.addEventListener('submit', addStudent);
filterCourse.addEventListener('change', applyFilters);
filterSemester.addEventListener('change', applyFilters);
filterSection.addEventListener('change', applyFilters);

// Function to show status message
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'text-white');
  statusMessage.classList.add(isError ? 'bg-red-500' : 'bg-green-500', 'text-white');
  
  // Show message
  statusMessage.classList.remove('hidden');
  
  // Hide after 5 seconds (increased from 3 seconds)
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 5000);
}

// Function to add a new student
function addStudent(event) {
  event.preventDefault();
  
  const form = document.getElementById('add-student-form');
  const formData = new FormData(form);
  
  // Debug the file input
  const fileInput = document.getElementById('student_image');
  console.log('File input:', fileInput);
  console.log('Has files:', fileInput.files.length > 0);
  if (fileInput.files.length > 0) {
    console.log('File name:', fileInput.files[0].name);
    console.log('File size:', fileInput.files[0].size);
  }
  
  // Show loading message
  showStatus('Adding student, please wait...');
  
  // Use XMLHttpRequest for file upload
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:5000/api/students');
  
  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.error) {
          showStatus(response.error, true);
        } else {
          showStatus('Student added successfully');
          form.reset();
          loadStudents();
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        console.log('Raw response:', xhr.responseText);
        showStatus('Error parsing server response', true);
      }
    } else {
      console.error('Request failed:', xhr.status, xhr.statusText);
      console.log('Response text:', xhr.responseText);
      showStatus(`Request failed with status ${xhr.status}`, true);
    }
  };
  
  xhr.onerror = function() {
    console.error('Network error');
    showStatus('Network error occurred', true);
  };
  
  xhr.send(formData);
}
// Function to load students with optional filters
function loadStudents() {
  // Show loading indicator
  studentList.innerHTML = '<tr><td colspan="5" class="py-4 text-center">Loading students...</td></tr>';
  
  // Get filter values
  const course = filterCourse.value;
  const semester = filterSemester.value;
  const section = filterSection.value;
  
  // Build query parameters
  let url = 'http://localhost:5000/api/students';
  const params = [];
  
  if (course) params.push(`course=${encodeURIComponent(course)}`);
  if (semester) params.push(`semester=${encodeURIComponent(semester)}`);
  if (section) params.push(`section=${encodeURIComponent(section)}`);
  
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  
  // Fetch students data
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showStatus(data.error, true);
        return;
      }
      
      displayStudents(data.students || []);
    })
    .catch(error => {
      console.error('Error:', error);
      showStatus('Failed to load students', true);
    });
}

// Function to display students in the table
function displayStudents(students) {
  // Clear current list
  studentList.innerHTML = '';
  
  if (students.length === 0) {
    noStudentsMessage.classList.remove('hidden');
    studentList.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500">No students found</td></tr>';
  } else {
    noStudentsMessage.classList.add('hidden');
    
    students.forEach(student => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-2 px-4 border-b">${student.name}</td>
        <td class="py-2 px-4 border-b">${student.roll_number}</td>
        <td class="py-2 px-4 border-b">${student.course}</td>
        <td class="py-2 px-4 border-b">${student.semester}</td>
        <td class="py-2 px-4 border-b">${student.section}</td>
      `;
      studentList.appendChild(row);
    });
  }
}

// Function to apply filters
function applyFilters() {
  loadStudents();
}