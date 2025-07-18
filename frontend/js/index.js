 window.addEventListener("DOMContentLoaded", function() {
      if (sessionStorage.getItem("loggedIn") === "true") {
        // Add logout button if already logged in
        const buttonContainer = document.querySelector('.space-y-4');
        const logoutButton = document.createElement('button');
        logoutButton.className = "bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg w-full";
        logoutButton.textContent = "Logout";
        logoutButton.onclick = function() {
          sessionStorage.removeItem("loggedIn");
          location.reload();
        };
        buttonContainer.appendChild(logoutButton);
      }
    });