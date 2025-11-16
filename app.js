// -----------------------------
// FIREBASE SETUP

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { getDatabase, ref, push, set, onChildAdded } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjW_3cYR8apPFMmZqLqZh_9i2bN-1IEmY",
  authDomain: "college-finder-279aa.firebaseapp.com",
  databaseURL: "https://college-finder-279aa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "college-finder-279aa",
  storageBucket: "college-finder-279aa.firebasestorage.app",
  messagingSenderId: "94401695690",
  appId: "1:94401695690:web:cc08b09173d329de944933",
  measurementId: "G-R8D5FF0HEH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// -----------------------------
// UI ELEMENTS
// -----------------------------
const welcomeTxt = document.getElementById("welcomeTxt");
const sidebarUser = document.getElementById("sidebar-user");
const btnAuth = document.getElementById("btn-auth");


// -----------------------------
// LOGIN / SIGNUP POPUP
// -----------------------------
btnAuth.onclick = () => {
  let email = prompt("Enter Email:");
  if (!email) return;

  let password = prompt("Enter Password:");
  if (!password) return;

  // Try login first
  signInWithEmailAndPassword(auth, email, password)
    .then(() => alert("Logged in successfully!"))
    .catch(() => {
      // Auto signup if account does not exist
      createUserWithEmailAndPassword(auth, email, password)
        .then(() => alert("Account created and logged in!"))
        .catch(err => alert("Error: " + err.message));
    });
};


// -----------------------------
// LOGOUT ON CLICK
// -----------------------------
document.getElementById("welcomeTxt").onclick = () => {
  if (auth.currentUser) {
    if (confirm("Logout?")) signOut(auth);
  }
};


// -----------------------------
// AUTH STATE WATCHER
// -----------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    welcomeTxt.textContent = user.email;
    sidebarUser.textContent = user.email;

    loadMessages(user.uid);

  } else {
    welcomeTxt.textContent = "Not signed in";
    sidebarUser.textContent = "—";
  }
});


// -----------------------------
// TAB SWITCHING
// -----------------------------
window.switchTab = function (tabName, btn) {
  let cards = document.querySelectorAll("[data-section]");
  cards.forEach(c => c.style.display = "none");

  let activeCards = document.querySelector(`[data-section='${tabName}']`);
  if (activeCards) activeCards.style.display = "block";

  document.querySelectorAll(".tab-button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};


// -----------------------------
// MESSAGING SYSTEM
// -----------------------------
const messageInput = document.getElementById("msgText");
const messagesList = document.getElementById("messages-list");
const sendBtn = document.getElementById("sendBtn");

function loadMessages(uid) {
  const msgRef = ref(db, "messages/" + uid);

  onChildAdded(msgRef, (snapshot) => {
    let data = snapshot.val();

    let bubble = document.createElement("div");
    bubble.className = "msg " + (data.sender === "admin" ? "admin" : "user");
    bubble.textContent = data.text;

    messagesList.appendChild(bubble);
    messagesList.scrollTop = messagesList.scrollHeight;
  });
}

sendBtn.onclick = () => {
  if (!auth.currentUser) {
    alert("Login first!");
    return;
  }

  let txt = messageInput.value.trim();
  if (txt === "") return;

  const uid = auth.currentUser.uid;
  const msgRef = ref(db, "messages/" + uid);

  push(msgRef, {
    sender: "user",
    text: txt,
    time: Date.now()
  });

  messageInput.value = "";
};
