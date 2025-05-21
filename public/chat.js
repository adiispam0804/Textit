const username = localStorage.getItem("username") || "Guest";
let selectedUser = localStorage.getItem("selectedUser") || null;

const backendURL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://textit-aaj7.onrender.com';

const socket = io(backendURL, {
  query: { username },
});

// DOM Elements
const messageContainer = document.getElementById("message-container");
const inputField = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const themeToggle = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;
const logoutBtn = document.getElementById("logout-btn");
const usersList = document.getElementById("users-list");
const userSearchInput = document.getElementById("user-search");
const chatUserNameEl = document.getElementById("chat-user-name");
const typingIndicator = document.getElementById("typing-indicator");

let allUsers = [];

document.getElementById("current-user").textContent = username;

// Load theme and selected user
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    htmlElement.classList.add("dark");
  }

  if (selectedUser) {
    chatUserNameEl.textContent = selectedUser;
    fetchChatHistory();
  }
});

// Theme toggle
themeToggle?.addEventListener("click", () => {
  htmlElement.classList.toggle("dark");
  localStorage.setItem("theme", htmlElement.classList.contains("dark") ? "dark" : "light");
});

// Logout
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("selectedUser"); // clear selected user on logout
  window.location.href = "index.html";
});

// Send message
sendButton?.addEventListener("click", async () => {
  const text = inputField.value.trim();
  if (!text || !selectedUser) {
    alert("Please select a user to chat with.");
    return;
  }

  const message = { from: username, to: selectedUser, text };
  appendMessage("You", text);
  socket.emit("private-message", message);
  inputField.value = "";

  try {
    const res = await fetch(`${backendURL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      console.error("Failed to save message", await res.text());
    }
  } catch (error) {
    console.error("Error saving message:", error);
  }
});

// Typing
inputField.addEventListener("input", () => {
  if (selectedUser) {
    socket.emit("typing", { from: username, to: selectedUser });
  }
});

// Receive message
socket.on("receive-message", async ({ from, text, time }) => {
  if (from === selectedUser) {
    appendMessage(from, text, time);
  } else {
    console.log(`New message from ${from}: ${text}`);
  }
});

// Typing indicator
let typingTimeout;
socket.on("typing", (from) => {
  if (from === selectedUser) {
    typingIndicator.textContent = `${from} is typing...`;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typingIndicator.textContent = "";
    }, 2000);
  }
});

// Update user list
socket.on("user-list", (users) => {
  allUsers = users.filter((u) => u !== username);
  renderUserList(allUsers);
});

// Render user list
function renderUserList(users) {
  usersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    li.classList.add("cursor-pointer", "p-2", "hover:bg-gray-200", "dark:hover:bg-gray-700");

    if (user === selectedUser) {
      li.classList.add("font-bold");
    }

    li.addEventListener("click", () => {
      selectedUser = user;
      localStorage.setItem("selectedUser", selectedUser);
      chatUserNameEl.textContent = selectedUser;
      fetchChatHistory();
    });
    usersList.appendChild(li);
  });
}

// Fetch chat history for selected user
async function fetchChatHistory() {
  if (!selectedUser) return;

  try {
    const res = await fetch(`${backendURL}/api/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages');

    const messages = await res.json();

    const filteredMessages = messages.filter(
      (m) =>
        (m.from_user === username && m.to_user === selectedUser) ||
        (m.from_user === selectedUser && m.to_user === username)
    );

    messageContainer.innerHTML = "";

    filteredMessages.forEach((msg) => {
      const sender = msg.from_user === username ? "You" : msg.from_user;
      appendMessage(sender, msg.text, msg.timestamp);
    });

    scrollToBottom();
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

// Append message to chat container
function appendMessage(sender, text, timestamp = null) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "mb-2");

  // Style differently for You vs others
  if (sender === "You") {
    messageDiv.classList.add("text-right", "text-blue-600");
  } else {
    messageDiv.classList.add("text-left", "text-gray-800");
  }

  // Format timestamp
  let timeString = "";
  if (timestamp) {
    const date = new Date(timestamp);
    timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  messageDiv.innerHTML = `
    <strong>${sender}</strong>: ${text} 
    <span class="text-xs text-gray-400 ml-2">${timeString}</span>
  `;

  messageContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Auto-scroll chat to bottom
function scrollToBottom() {
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

