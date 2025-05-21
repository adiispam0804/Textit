const username = localStorage.getItem("username") || "Guest";
let selectedUser = localStorage.getItem("selectedUser") || null;
const socket = io("http://localhost:3000", {
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
    const res = await fetch("http://localhost:3000/api/messages", {
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
  renderUsersList(allUsers);

  if (allUsers.length > 0 && !selectedUser) {
    document.querySelector("#users-list li")?.click();
  }
});

// Render user list
function renderUsersList(users) {
  usersList.innerHTML = "";
  if (users.length === 0) {
    usersList.innerHTML = '<li class="p-4 text-gray-500 dark:text-gray-400">No users online</li>';
    return;
  }

  users.forEach((user) => {
    const li = document.createElement("li");
    li.className =
      "p-4 hover:bg-gray-200 dark:hover:bg-[#3a3f47] cursor-pointer border-b border-gray-300 dark:border-[#4f545c]";
    li.innerHTML = `
      <div>
        <div class="font-semibold">${user}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Online</div>
      </div>
    `;

    li.addEventListener("click", () => {
      selectedUser = user;
      localStorage.setItem("selectedUser", user);
      chatUserNameEl.textContent = user;
      messageContainer.innerHTML = "";
      fetchChatHistory();
    });

    usersList.appendChild(li);
  });
}

// Search users
userSearchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allUsers.filter((user) => user.toLowerCase().includes(searchTerm));
  renderUsersList(filtered);
});

// Fetch chat history
async function fetchChatHistory() {
  try {
    const response = await fetch("http://localhost:3000/api/messages");
    const messages = await response.json();

    const filtered = messages.filter(
      (msg) =>
        (msg.from_user === username && msg.to_user === selectedUser) ||
        (msg.from_user === selectedUser && msg.to_user === username)
    );

    filtered.forEach(({ from_user, text, timestamp }) => {
      appendMessage(from_user === username ? "You" : from_user, text, timestamp);
    });

    scrollToBottom();
  } catch (error) {
    console.error("Error loading messages:", error);
  }
}


function appendMessage(sender, message, timestamp = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col";

  // If no timestamp passed, use current local time
  let timeStr;
  if (timestamp) {
    // Parse the UTC timestamp string as Date, then convert to local time string
    const utcDate = new Date(timestamp + "Z"); // Add 'Z' to mark as UTC if missing
    timeStr = utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else {
    timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const div = document.createElement("div");
  div.className = `max-w-[70%] px-4 py-2 rounded-lg text-sm ${
    sender === "You"
      ? "self-end bg-[#7289da] text-white ml-auto"
      : "self-start bg-[#4f545c] text-white mr-auto"
  }`;

  div.innerHTML = `<strong>${sender}</strong> <span class="text-xs text-gray-300">(${timeStr})</span><br>${message}`;

  wrapper.appendChild(div);
  messageContainer.appendChild(wrapper);
  scrollToBottom();
}


function scrollToBottom() {
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
