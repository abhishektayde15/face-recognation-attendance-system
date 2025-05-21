// DOM Elements
const studentList = document.getElementById('student-list');
const noStudentsMessage = document.getElementById('no-students');
const statusMessage = document.getElementById('status-message');

// Filter elements
const filterCourse = document.getElementById('filter-course');
const filterSemester = document.getElementById('filter-semester');
const filterSection = document.getElementById('filter-section');
const applyFiltersBtn = document.getElementById('apply-filters');

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const menuItems = document.getElementById('menu-items');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      menuItems.classList.toggle('hidden');
    });
  }
  
  // Parse URL parameters for initial filtering
  const urlParams = new URLSearchParams(window.location.search);
  const courseParam = urlParams.get('course');
  const semesterParam = urlParams.get('semester');
  const sectionParam = urlParams.get('section');
  
  // Set initial filter values if provided in URL
  if (courseParam) filterCourse.value = courseParam;
  if (semesterParam) filterSemester.value = semesterParam;
  if (sectionParam) filterSection.value = sectionParam;
  
  // Load students based on initial filters
  loadStudents();
});

// Add event listeners
applyFiltersBtn.addEventListener('click', loadStudents);

// Function to show status message
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'text-white');
  statusMessage.classList.add(isError ? 'bg-red-500' : 'bg-green-500', 'text-white');
  
  // Show message
  statusMessage.classList.remove('hidden');
  
  // Hide after 5 seconds
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 5000);
}

// Function to load students with optional filters
function loadStudents() {
  // Show loading indicator
  studentList.innerHTML = '<tr><td colspan="5" class="py-4 text-center">Loading students...</td></tr>';
  
  // Get filter values
  const course = filterCourse.value;
  const semester = filterSemester.value;
  const section = filterSection.value;
  
  console.log("Applying filters:", { course, semester, section });
  
  // Build query parameters
  let url = 'http://localhost:5000/api/students';
  const params = [];
  
  if (course) params.push(`course=${encodeURIComponent(course)}`);
  if (semester) params.push(`semester=${encodeURIComponent(semester)}`);
  if (section) params.push(`section=${encodeURIComponent(section)}`);
  
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  
  console.log("Fetching URL:", url);
  
  // Fetch students data
  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log("API response:", data);
      
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