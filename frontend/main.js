document.addEventListener("DOMContentLoaded", function() {
  console.log("✅ Main JS Loaded");
  
  // Get DOM elements
  const courseSection = document.getElementById("course-section");
  const courseCards = document.querySelectorAll(".course-card");
  const semSection = document.getElementById("sem-section");
  const uploadSection = document.getElementById("upload-section");
  const semesterSelect = document.getElementById("semester");
  const sectionSelect = document.getElementById("section");
  const submitButton = document.getElementById("submit-button");
  const resultSection = document.getElementById("result");
  const resultMessage = document.getElementById("result-message");
  const resultContent = document.getElementById("result-content");
  const photoInput = document.getElementById("photo-upload");
  const newAttendanceButton = document.getElementById("new-attendance-button");
  const statusIndicator = document.getElementById("status-indicator");
  
  // Add these functions to update the status
  function updateStatus(message) {
    if (statusIndicator) {
      statusIndicator.textContent = message;
      console.log("Status:", message);
    }
  }
  
  // Log elements to verify they're found
  console.log("Elements found:", {
    courseSection, semSection, uploadSection, 
    submitButton, resultSection, resultMessage
  });
  
  // State tracking variables
  let selectedCourse = "";
  let isProcessing = false;
  
  // Step 1: Course selection
  courseCards.forEach(card => {
    card.addEventListener("click", function(event) {
      event.preventDefault(); // Prevent any default behavior
      
      // Don't allow changes if processing
      if (isProcessing) {
        console.log("Processing in progress, ignoring course change");
        updateStatus("Locked - Processing in progress");
        return;
      }
      
      selectedCourse = this.textContent.trim();
      console.log("Selected course:", selectedCourse);
      updateStatus("Course selected: " + selectedCourse);
      
      // Highlight selected card
      courseCards.forEach(c => c.classList.remove("bg-green-100"));
      this.classList.add("bg-green-100");
      
      // Show semester section
      semSection.classList.remove("hidden");
      
      // Reset other sections
      uploadSection.classList.add("hidden");
      resultSection.classList.add("hidden");
      
      // Reset form
      semesterSelect.value = "";
      sectionSelect.value = "";
      photoInput.value = "";
    });
  });
  
  // Step 2: Semester and section selection
  function checkDropdowns() {
    if (semesterSelect.value && sectionSelect.value) {
      uploadSection.classList.remove("hidden");
      updateStatus("Ready for photo upload");
    } else {
      uploadSection.classList.add("hidden");
    }
  }
  
  semesterSelect.addEventListener("change", checkDropdowns);
  sectionSelect.addEventListener("change", checkDropdowns);
  
  // Step 3: Submit attendance
  submitButton.addEventListener("click", async function(event) {
    // THIS IS THE CRITICAL FIX - prevent form submission
    event.preventDefault();
    
    // Prevent multiple submissions
    if (isProcessing) {
      console.log("Already processing, please wait");
      updateStatus("Already processing, please wait");
      return;
    }
    
    const semester = semesterSelect.value;
    const section = sectionSelect.value;
    const files = photoInput.files;
    
    if (!semester || !section || files.length === 0) {
      alert("Please fill all fields and upload at least one photo");
      updateStatus("Missing required fields");
      return;
    }
    
    try {
      // Set processing flag
      isProcessing = true;
      console.log("Processing started - UI locked");
      updateStatus("Processing... Please wait");
      
      // Show results section with loading message
      resultSection.classList.remove("hidden");
      resultMessage.textContent = "Processing... Please wait.";
      
      // Create form data
      const formData = new FormData();
      formData.append("semester", semester);
      formData.append("section", section);
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }
      
      console.log("Sending API request...");
      updateStatus("Sending API request...");
      const response = await fetch("http://localhost:5000/api/attendance", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      console.log("API response:", data);
      updateStatus("API response received");
      
      // Ensure result section is visible
      resultSection.classList.remove("hidden");
      
      // Update result content
      if (response.ok) {
        let resultHTML = `<p class="text-green-600 font-medium">${data.message}</p>`;
        resultHTML += `<p class="mt-2">Total students identified: ${data.total_matches}</p>`;
        
        if (data.students && data.students.length > 0) {
          resultHTML += `<div class="mt-4 p-3 bg-gray-50 rounded">
            <p class="font-medium">Students recognized:</p>
            <ul class="list-disc pl-5 mt-2">`;
          
          data.students.forEach(student => {
            resultHTML += `<li>${student}</li>`;
          });
          
          resultHTML += `</ul></div>`;
        }
        
        resultContent.innerHTML = resultHTML;
        updateStatus("Results displayed successfully");
      } else {
        resultContent.innerHTML = `
          <p class="text-red-600 font-medium">Error:</p>
          <p>${data.message || "Unknown error occurred"}</p>
        `;
        updateStatus("Error occurred");
      }
    } catch (error) {
      console.error("API request failed:", error);
      resultContent.innerHTML = `
        <p class="text-red-600 font-medium">Failed to process request</p>
        <p>Please check your server connection and try again.</p>
      `;
      updateStatus("API request failed");
    } finally {
      // Always reset processing flag when done
      isProcessing = false;
      console.log("Processing finished - UI unlocked");
    }
  });
  
  // New attendance button
  newAttendanceButton.addEventListener("click", function(event) {
    // Prevent any default behavior
    event.preventDefault();
    
    // Reset form
    semesterSelect.value = "";
    sectionSelect.value = "";
    photoInput.value = "";
    
    // Show main form sections
    courseSection.classList.remove("hidden");
    semSection.classList.remove("hidden");
    
    // Hide results and upload sections until needed
    resultSection.classList.add("hidden");
    uploadSection.classList.add("hidden");
    
    // Reset course selection
    courseCards.forEach(c => c.classList.remove("bg-green-100"));
    
    updateStatus("Ready for new attendance");
  });
  
  // Initial status
  updateStatus("Ready");
});