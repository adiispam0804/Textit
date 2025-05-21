const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginForm = document.getElementById('login-form');
const themeToggle = document.getElementById('theme-toggle');

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
});

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      alert("Username and Password can't be empty");
      return;
    }

    try {
      // Explicitly use backend URL
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error('Login failed');

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('username', username);
        window.location.href = 'mainpage.html';
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong during login.');
    }
  });
}
