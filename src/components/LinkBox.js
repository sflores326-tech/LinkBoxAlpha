import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

const EDIT_PASSWORD = process.env.REACT_APP_EDIT_PASSWORD;

export default function LinkBox() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Load tabs in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tabs"), (snapshot) => {
      const newTabs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTabs(newTabs);
      if (!activeTab && newTabs.length > 0) setActiveTab(newTabs[0].id);
    });
    return () => unsub();
  }, []);

  const enableEdit = () => {
    if (passwordInput === EDIT_PASSWORD) {
      setEditMode(true);
    } else {
      alert("Wrong password!");
    }
  };

  const addTab = async () => {
    if (!editMode) return;
    await addDoc(collection(db, "tabs"), {
      name: "New Tab",
      items: [],
      editPassword: EDIT_PASSWORD,
    });
  };

  const deleteTab = async (id) => {
    if (!editMode) return;
    const tabRef = doc(db, "tabs", id);
    await updateDoc(tabRef, { editPassword: EDIT_PASSWORD });
    await deleteDoc(tabRef);
  };

  const addItem = async (tabId) => {
    if (!editMode) return;
    const tabRef = doc(db, "tabs", tabId);
    const tab = tabs.find((t) => t.id === tabId);
    await updateDoc(tabRef, {
      items: [...tab.items, { title: "New Item", url: "https://example.com" }],
      editPassword: EDIT_PASSWORD,
    });
  };

  const deleteItem = async (tabId, index) => {
    if (!editMode) return;
    const tabRef = doc(db, "tabs", tabId);
    const tab = tabs.find((t) => t.id === tabId);
    const newItems = [...tab.items];
    newItems.splice(index, 1);
    await updateDoc(tabRef, { items: newItems, editPassword: EDIT_PASSWORD });
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {/* Unlock Edit Mode */}
      {!editMode ? (
        <div className="mb-4 flex gap-2">
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={enableEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Unlock Edit
          </button>
        </div>
      ) : (
        <p className="mb-4 text-green-600 font-bold">Edit Mode Enabled ✅</p>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded ${
              tab.id === activeTab
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
        {editMode && (
          <button
            onClick={addTab}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            + Tab
          </button>
        )}
      </div>

      {/* Items */}
      {tabs
        .filter((t) => t.id === activeTab)
        .map((tab) => (
          <div key={tab.id}>
            <ul className="space-y-2">
              {tab.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-100 p-2 rounded"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600"
                  >
                    {item.title}
                  </a>
                  {editMode && (
                    <button
                      onClick={() => deleteItem(tab.id, idx)}
                      className="text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {editMode && (
              <>
                <button
                  onClick={() => addItem(tab.id)}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                >
                  + Item
                </button>
                <button
                  onClick={() => deleteTab(tab.id)}
                  className="mt-2 ml-2 px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete Tab
                </button>
              </>
            )}
          </div>
        ))}
    </div>
  );
}
