// 🔹 Toggle Dark/Light Mode + Remember Preference
function toggleMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// 🔹 Apply saved mode when page loads
window.addEventListener('load', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
});

// 🔹 Redirect to Godot game page
function playGame() {
  window.location.href = "game/index.html";
}

// 🔹 Toggle dropdown menu visibility
function toggleMenu() {
  document.querySelector('.menu').classList.toggle('active');
}

// 🔹 Close dropdown when clicking outside
window.onclick = function(event) {
  if (!event.target.matches('.menu, .menu *')) {
    document.querySelector('.menu').classList.remove('active');
  }
};

// 🔹 Logout function (clears session and redirects)
function logoutUser() {
  fetch('/logout') // calls your server.js logout route
    .then(() => window.location.href = 'login.html')
    .catch(err => console.error('Logout failed:', err));
}
