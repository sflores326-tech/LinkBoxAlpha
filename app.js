import {
  collection, addDoc, deleteDoc, doc,
  updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { db } from "./firebase.js";

const EDIT_PASSWORD = "YourStrongPassword123"; // must match Firestore rules
let editMode = false;
let activeTab = null;

const tabsDiv = document.getElementById("tabs");
const itemsDiv = document.getElementById("items");

// 🔑 Enable edit mode
window.enableEdit = function() {
  const pw = document.getElementById("passwordInput").value;
  if (pw === EDIT_PASSWORD) {
    editMode = true;
    document.getElementById("edit-controls").innerHTML =
      `<p class="text-green-600 font-bold">Edit Mode Enabled ✅</p>`;
    renderTabs();
  } else {
    alert("Wrong password!");
  }
};

// 🔄 Real-time listener
onSnapshot(collection(db, "tabs"), (snapshot) => {
  const tabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  window.tabsData = tabs;
  if (!activeTab && tabs.length > 0) activeTab = tabs[0].id;
  renderTabs();
  renderItems();
});

// 🏷️ Render Tabs
function renderTabs() {
  tabsDiv.innerHTML = "";
  window.tabsData?.forEach(tab => {
    const btn = document.createElement("button");
    btn.className = `px-4 py-2 rounded ${
      tab.id === activeTab ? "bg-blue-500 text-white" : "bg-gray-200"
    }`;
    btn.innerText = tab.name;
    btn.onclick = () => { activeTab = tab.id; renderTabs(); renderItems(); };
    tabsDiv.appendChild(btn);

    if (editMode) {
      const del = document.createElement("button");
      del.innerText = "✕";
      del.className = "ml-1 text-red-500";
      del.onclick = () => deleteTab(tab.id);
      tabsDiv.appendChild(del);
    }
  });

  if (editMode) {
    const addBtn = document.createElement("button");
    addBtn.className = "px-4 py-2 bg-green-500 text-white rounded";
    addBtn.innerText = "+ Tab";
    addBtn.onclick = addTab;
    tabsDiv.appendChild(addBtn);
  }
}

// 📋 Render Items
function renderItems() {
  itemsDiv.innerHTML = "";
  const tab = window.tabsData?.find(t => t.id === activeTab);
  if (!tab) return;

  tab.items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "flex justify-between items-center bg-gray-100 p-2 rounded";

    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.className = "text-blue-600";
    link.innerText = item.title;

    row.appendChild(link);

    if (editMode) {
      const del = document.createElement("button");
      del.innerText = "✕";
      del.className = "text-red-500 text-sm";
      del.onclick = () => deleteItem(tab.id, idx);
      row.appendChild(del);
    }

    itemsDiv.appendChild(row);
  });

  if (editMode) {
    const addBtn = document.createElement("button");
    addBtn.className = "mt-3 px-3 py-1 bg-blue-500 text-white rounded";
    addBtn.innerText = "+ Item";
    addBtn.onclick = () => addItem(tab.id);
    itemsDiv.appendChild(addBtn);
  }
}

// ➕ Add/Delete
async function addTab() {
  await addDoc(collection(db, "tabs"), { name: "New Tab", items: [], editPassword: EDIT_PASSWORD });
}
async function deleteTab(id) {
  await deleteDoc(doc(db, "tabs", id));
}
async function addItem(tabId) {
  const tab = window.tabsData.find(t => t.id === tabId);
  const tabRef = doc(db, "tabs", tabId);
  await updateDoc(tabRef, { items: [...tab.items, { title: "New Item", url: "https://example.com" }], editPassword: EDIT_PASSWORD });
}
async function deleteItem(tabId, index) {
  const tab = window.tabsData.find(t => t.id === tabId);
  const newItems = [...tab.items];
  newItems.splice(index, 1);
  const tabRef = doc(db, "tabs", tabId);
  await updateDoc(tabRef, { items: newItems, editPassword: EDIT_PASSWORD });
}
