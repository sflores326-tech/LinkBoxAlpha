import {
  collection, doc, getDoc, setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { db } from "./firebase.js";

const EDIT_PASSWORD = "YourStrongPassword123"; // must match firestore.rules
let editMode = false;
let activeTab = null;

const tabsDiv = document.getElementById("tabs");
const itemsDiv = document.getElementById("items");
const passwordModal = document.getElementById("passwordModal");
const unlockBtn = document.getElementById("unlockBtn");

// 🔑 Show password modal
unlockBtn.addEventListener("click", () => {
  passwordModal.classList.remove("hidden");
});
window.closePasswordModal = function() {
  passwordModal.classList.add("hidden");
};

// 🔑 Unlock edit mode
window.enableEdit = function() {
  const pw = document.getElementById("passwordInput").value;
  if (pw === EDIT_PASSWORD) {
    editMode = true;
    passwordModal.classList.add("hidden");
    unlockBtn.remove();
    renderTabs();
    renderItems();
    alert("✅ Edit Mode Enabled");
  } else {
    alert("❌ Wrong password");
  }
};

// 🔄 Real-time listener for tabs order
onSnapshot(collection(db, "tabs"), async () => {
  const orderDoc = await getDoc(doc(db, "meta", "tabsOrder"));
  if (orderDoc.exists()) {
    window.tabsData = orderDoc.data().order;
  } else {
    window.tabsData = [];
  }

  if (!activeTab && window.tabsData.length > 0) {
    activeTab = window.tabsData[0].id;
  }
  renderTabs();
  renderItems();
});

// ✏️ Inline editing helper
function makeEditable(el, initialValue, onSave) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = initialValue;
  input.className = "border p-1 rounded text-sm flex-1";
  el.replaceWith(input);
  input.focus();
  input.select();

  const save = async () => {
    const newValue = input.value.trim();
    if (newValue && newValue !== initialValue) {
      await onSave(newValue);
    }
    input.replaceWith(el);
    el.innerText = newValue || initialValue;
  };

  input.addEventListener("blur", save);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") {
      input.replaceWith(el);
      el.innerText = initialValue;
    }
  });
}

// 🏷️ Render Tabs
function renderTabs() {
  tabsDiv.innerHTML = "";
  window.tabsData?.forEach((tab, index) => {
    const btn = document.createElement("button");
    btn.className = `px-4 py-2 rounded ${
      tab.id === activeTab ? "bg-blue-500 text-white" : "bg-gray-200"
    }`;
    btn.innerText = tab.name;
    btn.onclick = () => { activeTab = tab.id; renderTabs(); renderItems(); };

    if (editMode) {
      // Inline rename
      btn.ondblclick = () => {
        makeEditable(btn, tab.name, async (newName) => {
          tab.name = newName;
          await saveTabsOrder();
        });
      };

      // Drag
      btn.setAttribute("draggable", "true");
      btn.ondragstart = (e) => e.dataTransfer.setData("tabIndex", index);
      btn.ondragover = (e) => e.preventDefault();
      btn.ondrop = async (e) => {
        const fromIndex = parseInt(e.dataTransfer.getData("tabIndex"));
        const toIndex = index;
        if (fromIndex === toIndex) return;
        const reordered = [...window.tabsData];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        window.tabsData = reordered;
        await saveTabsOrder();
      };
    }

    tabsDiv.appendChild(btn);

    if (editMode) {
      const del = document.createElement("button");
      del.innerText = "✕";
      del.className = "ml-1 text-red-500";
      del.onclick = async () => deleteTab(tab.id);
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
    if (editMode) row.setAttribute("draggable", "true");

    row.ondragstart = (e) => e.dataTransfer.setData("itemIndex", idx);
    row.ondragover = (e) => e.preventDefault();
    row.ondrop = async (e) => {
      const fromIndex = parseInt(e.dataTransfer.getData("itemIndex"));
      const toIndex = idx;
      if (fromIndex === toIndex) return;
      const newItems = [...tab.items];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, moved);
      tab.items = newItems;
      await saveTabsOrder();
    };

    // Title
    const titleSpan = document.createElement("span");
    titleSpan.className = "text-blue-600 cursor-pointer";
    titleSpan.innerText = item.title;
    titleSpan.onclick = () => window.open(item.url, "_blank");

    if (editMode) {
      titleSpan.ondblclick = () => {
        makeEditable(titleSpan, item.title, async (newTitle) => {
          tab.items[idx].title = newTitle;
          await saveTabsOrder();
        });
      };
    }

    row.appendChild(titleSpan);

    if (editMode) {
      // URL
      const urlSpan = document.createElement("span");
      urlSpan.className = "ml-2 text-gray-500 text-sm cursor-pointer";
      urlSpan.innerText = item.url;
      urlSpan.ondblclick = () => {
        makeEditable(urlSpan, item.url, async (newUrl) => {
          tab.items[idx].url = newUrl;
          await saveTabsOrder();
        });
      };
      row.appendChild(urlSpan);

      // Delete button
      const del = document.createElement("button");
      del.innerText = "✕";
      del.className = "ml-2 text-red-500 text-sm";
      del.onclick = async () => deleteItem(tab.id, idx);
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

// ➕ Add/Delete Tabs
async function addTab() {
  const newTab = { id: crypto.randomUUID(), name: "New Tab", items: [] };
  window.tabsData.push(newTab);
  activeTab = newTab.id;
  await saveTabsOrder();
  renderTabs();
  renderItems();

  // Immediately editable
  setTimeout(() => {
    const btns = tabsDiv.querySelectorAll("button");
    const newBtn = [...btns].find(b => b.innerText === "New Tab");
    if (newBtn) {
      makeEditable(newBtn, "New Tab", async (newName) => {
        newTab.name = newName;
        await saveTabsOrder();
      });
    }
  }, 150);
}

async function deleteTab(id) {
  window.tabsData = window.tabsData.filter(t => t.id !== id);
  if (activeTab === id && window.tabsData.length > 0) activeTab = window.tabsData[0].id;
  await saveTabsOrder();
  renderTabs();
  renderItems();
}

// ➕ Add/Delete Items
async function addItem(tabId) {
  const tab = window.tabsData.find(t => t.id === tabId);
  const newItem = { title: "New Item", url: "https://example.com" };
  tab.items.push(newItem);
  await saveTabsOrder();
  renderItems();

  // Immediately editable title only
  setTimeout(() => {
    const rows = itemsDiv.querySelectorAll("div");
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return;
    const titleSpan = lastRow.querySelector("span.text-blue-600");
    if (titleSpan) {
      makeEditable(titleSpan, newItem.title, async (newTitle) => {
        newItem.title = newTitle;
        await saveTabsOrder();
      });
    }
  }, 150);
}

async function deleteItem(tabId, index) {
  const tab = window.tabsData.find(t => t.id === tabId);
  tab.items.splice(index, 1);
  await saveTabsOrder();
  renderItems();
}

// 💾 Save tabs order + contents
async function saveTabsOrder() {
  await setDoc(doc(db, "meta", "tabsOrder"), {
    order: window.tabsData,
    editPassword: EDIT_PASSWORD
  });
}
