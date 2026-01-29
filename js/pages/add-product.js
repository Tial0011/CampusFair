// js/pages/add-product.js

import { auth, db, storage } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD + STORE CHECK
================================ */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const store = await getMyStore(user.uid);
  if (!store) {
    app.innerHTML = "<p>You must create a store before adding products.</p>";
    return;
  }

  renderForm(store, user.uid);
});

/* ===============================
   GET SELLER STORE
================================ */

async function getMyStore(userId) {
  const q = query(collection(db, "stores"), where("ownerId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/* ===============================
   UI
================================ */

function renderForm(store, userId) {
  app.innerHTML = `
    <h2>Add Product</h2>

    <input id="name" placeholder="Product name" />
    <textarea id="description" placeholder="Product description"></textarea>
    <input id="price" type="number" placeholder="Price (₦)" />
    <input id="image" type="file" accept="image/*" />

    <button id="submit">Add Product</button>
    <p id="status"></p>
  `;

  document.getElementById("submit").onclick = () => handleSubmit(store, userId);
}

/* ===============================
   SUBMIT
================================ */

async function handleSubmit(store, userId) {
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = Number(document.getElementById("price").value);
  const imageFile = document.getElementById("image").files[0];
  const status = document.getElementById("status");

  if (!name || !description || !price || !imageFile) {
    status.textContent = "All fields are required.";
    return;
  }

  try {
    status.textContent = "Uploading image...";

    const imageRef = ref(
      storage,
      `products/${userId}/${Date.now()}_${imageFile.name}`,
    );
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    const keywords = generateKeywords(name, description);

    status.textContent = "Saving product...";

    await addDoc(collection(db, "products"), {
      name,
      description,
      price,
      imageUrl,
      keywords,
      storeId: store.id,
      sellerPhone: store.phone,
      createdAt: serverTimestamp(),
    });

    status.textContent = "Product added successfully!";
    clearForm();
  } catch (err) {
    status.textContent = "Error adding product.";
  }
}

/* ===============================
   HELPERS
================================ */

function generateKeywords(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  return [...new Set(text.split(/\s+/))];
}

function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
  document.getElementById("image").value = "";
}
