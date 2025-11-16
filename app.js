
// app.js (module) — put in repo root next to index.html
// Uses Firebase modular SDK via CDN imports

// ----------------- FIREBASE IMPORTS (modular) -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onChildAdded,
  onValue,
  off
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// ----------------- YOUR FIREBASE CONFIG -----------------
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Admin email
const ADMIN_EMAIL = "mithun@admin.com";

// DOM refs
const welcomeTxt = document.getElementById('welcomeTxt');
const btnAuth = document.getElementById('btn-auth');
const authModal = document.getElementById('authModal');
const authEmail = document.getElementById('authEmail');
const authPass = document.getElementById('authPass');
const authLogin = document.getElementById('authLogin');
const authSignup = document.getElementById('authSignup');
const authClose = document.getElementById('authClose');
const sidebarUser = document.getElementById('sidebar-user');
const btnLogout = document.getElementById('btn-logout');

const chatMessages = document.getElementById('chat-messages');
const userChatList = document.getElementById('user-chat-list');
const chatSend = document.getElementById('chat-send');
const chatInput = document.getElementById('chat-input');

const adminUserList = document.getElementById('admin-user-list');
const adminChatMessages = document.getElementById('admin-chat-messages');
const adminChatHeader = document.getElementById('admin-chat-header');
const adminChatInput = document.getElementById('admin-chat-input');
const adminChatSend = document.getElementById('admin-chat-send');

let currentUser = null;
let currentUserUid = null;
let currentAdminChatUid = null;

// TAB switching (delegation)
document.getElementById('sidebar').addEventListener('click', function(e){
  const btn = e.target.closest('.tab-button');
  if(!btn) return;
  const tab = btn.dataset.tab;
  if(!tab) return;
  // hide all sections
  document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
  const target = document.getElementById(tab);
  if(target) target.style.display='block';
  // active
  document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
});

// AUTH modal open/close
btnAuth.addEventListener('click', ()=> authModal.style.display='flex');
authClose.addEventListener('click', ()=> authModal.style.display='none');

// Signup
authSignup.addEventListener('click', async ()=>{
  const email = authEmail.value.trim();
  const pass = authPass.value.trim();
  if(!email || !pass) return alert('Enter email & password');
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // create users record so admin list has it
    await set(ref(db, 'users/' + cred.user.uid), { email: email, createdAt: Date.now() });
    authModal.style.display = 'none';
    alert('Account created and signed in.');
  }catch(err){
    alert(err.message || err);
  }
});

// Login
authLogin.addEventListener('click', async ()=>{
  const email = authEmail.value.trim();
  const pass = authPass.value.trim();
  if(!email || !pass) return alert('Enter email & password');
  try{
    await signInWithEmailAndPassword(auth, email, pass);
    authModal.style.display = 'none';
  }catch(err){
    alert(err.message || err);
  }
});

// Logout
btnLogout.addEventListener('click', async ()=>{
  if(confirm('Logout?')) {
    try{
      await signOut(auth);
    }catch(e){ console.error(e); }
  }
});

// auth state
onAuthStateChanged(auth, (user)=>{
  currentUser = user;
  if(user){
    welcomeTxt.textContent = user.email;
    sidebarUser.textContent = user.email;
    currentUserUid = user.uid;
    injectMessagesTab();
    if(user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()){
      injectAdminTab();
      // show admin by default
      document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
      document.getElementById('admin').style.display='block';
    } else {
      document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
      document.getElementById('messages').style.display='block';
    }
    // ensure users record exists
    set(ref(db, 'users/' + user.uid), { email: user.email, createdAt: Date.now() })
      .catch(()=>{}); // ignore
    loadUserChat();
  } else {
    welcomeTxt.textContent = 'Not signed in';
    sidebarUser.textContent = '—';
    currentUserUid = null;
    // remove injected tabs if present
    const mbtn = document.querySelector('[data-tab="messages"]'); if(mbtn) mbtn.remove();
    const abtn = document.querySelector('[data-tab="admin"]'); if(abtn) abtn.remove();
    // show home
    document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
    document.getElementById('home').style.display='block';
  }
});

// inject Messages tab
function injectMessagesTab(){
  if(document.querySelector('[data-tab="messages"]')) return;
  const btn = document.createElement('button');
  btn.className = 'tab-button';
  btn.dataset.tab = 'messages';
  btn.textContent = '💬 Messages';
  btn.addEventListener('click', ()=> {
    document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
    document.getElementById('messages').style.display='block';
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
  document.getElementById('sidebar').appendChild(btn);
}

// inject Admin tab
function injectAdminTab(){
  if(document.querySelector('[data-tab="admin"]')) return;
  const btn = document.createElement('button');
  btn.className = 'tab-button';
  btn.dataset.tab = 'admin';
  btn.textContent = '🛠 Admin';
  btn.addEventListener('click', ()=> {
    document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
    document.getElementById('admin').style.display='block';
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    loadAdminUsers();
  });
  document.getElementById('sidebar').appendChild(btn);
}

// ---------------- FLIPBOARDS ----------------
const FLIPS = [
  { city:'Chennai', title:'Engineering', link:'engineering_colleges_in_chennai.html' },
  { city:'Chennai', title:'Medical', link:'medical_college_in_chennai.html' },
  { city:'Chennai', title:'Arts & Science', link:'arts-science_college_chennai.html' },
  { city:'Pondicherry', title:'Engineering', link:'engineering_pondy.html' },
  { city:'Pondicherry', title:'Medical', link:'medical_pondyy.html' },
  { city:'Pondicherry', title:'Arts & Science', link:'arts_pondy.html' },
  { city:'Coimbatore', title:'Engineering', link:'engineering_coimbatore.html' },
  { city:'Coimbatore', title:'Medical', link:'medical_college_coimbatore.html' },
  { city:'Coimbatore', title:'Arts & Science', link:'arts_science_coimbatore.html' },
  { city:'Trichy', title:'Engineering', link:'engineering-trichy.html' },
  { city:'Trichy', title:'Medical', link:'medical-trichy.html' },
  { city:'Trichy', title:'Arts & Science', link:'arts-and-science-trichy.html' },
  { city:'Trichy', title:'Aviation', link:'aviation-trichy.html' },
  { city:'Madurai', title:'Aviation', link:'aviaaon-maduur.html' },
  { city:'Madurai', title:'Engineering', link:'engeerg-ma.html' },
  { city:'Salem', title:'Engineering', link:'salem-engineering.html' }
];

function renderFlipboards(){
  const grid = document.getElementById('flip-grid');
  grid.innerHTML = '';
  FLIPS.forEach(item=>{
    const d = document.createElement('div'); d.className='flip';
    d.innerHTML = `<div style="font-weight:700">${item.city}</div><div style="margin-top:6px">${item.title}</div>`;
    const btn = document.createElement('button'); btn.className='view-btn'; btn.textContent='View';
    btn.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if(!currentUserUid){ authModal.style.display='flex'; return; }
      // open the specific link (user must be logged in)
      window.open(item.link, '_blank');
    });
    d.appendChild(btn);
    d.addEventListener('click', ()=> {
      const map = { Chennai:'chennai', Pondicherry:'pondy', Coimbatore:'coimbatore', Trichy:'trichy', Madurai:'madurai', Salem:'salem' };
      const id = map[item.city] || 'home';
      document.querySelectorAll('[data-section]').forEach(s=>s.style.display='none');
      const el = document.getElementById(id);
      if(el) el.style.display='block';
    });
    grid.appendChild(d);
  });
}
renderFlipboards();

// ---------------- CITY SAMPLE DATA ----------------
const SAMPLE = {
  "Chennai": { "Engineering":["IIT Madras","SSN College of Engineering","Anna University - CEG"], "Medical":["Madras Medical College","Stanley Medical College"], "Arts & Science":["Loyola College","Madras Christian College"] },
  "Coimbatore": { "Engineering":["PSG College of Technology","Coimbatore Institute of Technology"], "Medical":["Coimbatore Medical College"], "Arts & Science":["PSG College of Arts & Science"] },
  "Pondicherry": { "Engineering":["(sample)"], "Medical":["JIPMER"], "Arts & Science":["Pondy Arts College"] },
  "Trichy": { "Engineering":["NIT Trichy","Saranathan College"], "Medical":["KAPV Medical College"], "Arts & Science":["Bishop Heber College"] },
  "Madurai": { "Engineering":["Thiagarajar College of Engineering"], "Medical":["Madurai Medical College"], "Arts & Science":["The American College"] },
  "Salem": { "Engineering":["Sona College of Technology"], "Medical":["Vinayaka Missions Medical College"], "Arts & Science":["Sona Arts and Science College"] }
};

function renderCityLists(){
  ['chennai','coimbatore','pondy','trichy','madurai','salem'].forEach(id=>{
    const key = id === 'pondy' ? 'Pondicherry' : id.charAt(0).toUpperCase() + id.slice(1);
    const cont = document.getElementById(id + '-content');
    cont.innerHTML = '';
    const obj = SAMPLE[key] || {};
    Object.keys(obj).forEach(cat=>{
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `<strong>${cat}</strong><div class="small">${obj[cat].length} colleges</div>`;
      obj[cat].forEach(c=>{
        const r = document.createElement('div'); r.style.padding='8px'; r.style.borderBottom='1px solid #f0f0f0';
        r.innerHTML = `<div style="font-weight:700">${c}</div><div class="small">— sample info</div>`;
        const v = document.createElement('button'); v.className='view-btn'; v.textContent='View';
        v.onclick = (ev)=> { ev.stopPropagation(); if(!currentUserUid){ authModal.style.display='flex'; return; } alert('Open details for ' + c); };
        r.appendChild(v);
        card.appendChild(r);
      });
      cont.appendChild(card);
    });
  });
}
renderCityLists();

// ---------------- USER CHAT ----------------
function loadUserChat(){
  if(!currentUserUid) return;
  userChatList.innerHTML = '<div style="font-weight:700">Your Chat</div><div class="small" style="margin-top:6px">Messages with admin</div>';
  chatMessages.innerHTML = '';
  const userRef = ref(db, 'chats/' + currentUserUid);
  // remove previous listener if any
  off(userRef);
  onChildAdded(userRef, (snap)=>{
    const m = snap.val();
    const el = document.createElement('div');
    el.className = 'msg ' + (m.from === 'admin' ? 'admin' : 'user');
    el.innerHTML = `<div>${escapeHtml(m.text)}</div><div style="color:#666;font-size:11px;margin-top:6px">${new Date(m.time).toLocaleString()}</div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatSend.onclick = function(){
    const txt = chatInput.value.trim();
    if(!txt) return;
    push(ref(db, 'chats/' + currentUserUid), { from:'user', text: txt, time: Date.now() });
    chatInput.value = '';
  };
}

// ---------------- ADMIN UI ----------------
function loadAdminUsers(){
  adminUserList.innerHTML = '<div style="font-weight:700">Users</div>';
  const usersRef = ref(db, 'users');
  off(usersRef);
  onValue(usersRef, (snap)=>{
    const usersObj = snap.val() || {};
    adminUserList.innerHTML = '<div style="font-weight:700">Users</div>';
    Object.keys(usersObj).forEach(uid=>{
      const u = usersObj[uid];
      const row = document.createElement('div');
      row.style.padding='8px'; row.style.borderBottom='1px solid #eee'; row.style.cursor='pointer';
      row.innerHTML = `<div style="font-weight:700">${escapeHtml(u.email||uid)}</div><div class="small">uid: ${uid}</div>`;
      row.onclick = ()=> openAdminChat(uid, u.email);
      adminUserList.appendChild(row);
    });
  });
}

function openAdminChat(uid, email){
  currentAdminChatUid = uid;
  adminChatHeader.innerHTML = `<strong>${escapeHtml(email||uid)}</strong>`;
  adminChatMessages.innerHTML = '';
  const chatRef = ref(db, 'chats/' + uid);
  off(chatRef);
  onChildAdded(chatRef, (snap)=>{
    const m = snap.val();
    const el = document.createElement('div');
    el.className = 'msg ' + (m.from === 'admin' ? 'admin' : 'user');
    el.innerHTML = `<div>${escapeHtml(m.text)}</div><div style="color:#666;font-size:11px;margin-top:6px">${new Date(m.time).toLocaleString()}</div>`;
    adminChatMessages.appendChild(el);
    adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
  });

  adminChatSend.onclick = function(){
    const t = adminChatInput.value.trim();
    if(!t || !currentAdminChatUid) return;
    push(ref(db, 'chats/' + currentAdminChatUid), { from:'admin', text: t, time: Date.now() });
    adminChatInput.value = '';
  };
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

console.log('app.js loaded');
