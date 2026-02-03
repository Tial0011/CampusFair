// js/pages/edit-product.js

import { auth, db } from "../core/firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const CLOUD_NAME = "duh3wgggt";
const UPLOAD_PRESET = "campusfair_products";

let imageUrl = "";
let newImageSelected = false;

/* ===============================
   AUTH GUARD
================================ */
auth.onAuthStateChanged((user) => {
  if (!user) {
    // 🔒 hard redirect to public home
    window.location.replace("/");
    return;
  }

  if (!productId) {
    window.location.replace("/seller/dashboard.html");
    return;
  }

  loadProduct(user);
});

/* ===============================
   LOAD PRODUCT
================================ */
async function loadProduct(user) {
  try {
    const refDoc = doc(db, "products", productId);
    const snap = await getDoc(refDoc);

    if (!snap.exists()) {
      window.location.replace("/seller/dashboard.html");
      return;
    }

    const product = snap.data();

    // 🔒 ownership check
    if (product.sellerId !== user.uid) {
      window.location.replace("/seller/dashboard.html");
      return;
    }

    imageUrl = product.imageUrl;
    renderUI(product);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load product</p>";
  }
}

/* ===============================
   UI
================================ */
function renderUI(product) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>Edit Product</h1>
      </div>

      <div class="header-right">
        <a href="/seller/dashboard.html" class="seller-link">
          Back to Dashboard
        </a>
      </div>
    </header>

    <section>
      <form id="productForm" class="auth-container">

        <input type="text" id="name" value="${product.name}" required />
        <input type="number" id="price" value="${product.price}" required />

        <div id="dropZone" class="image-drop">
          <p>Drag & drop new image<br/>or click to replace</p>
          <input type="file" id="fileInput" accept="image/*" hidden />
          <div class="image-preview">
            <img src="${product.imageUrl}" />
          </div>
        </div>

        <textarea
          id="description"
          rows="4"
          style="padding:0.75rem;border-radius:10px;border:1px solid var(--border);"
        >${product.description || ""}</textarea>

        <button>Save Changes</button>
      </form>
    </section>
  `;

  initImageUpload();
  document.getElementById("productForm").onsubmit = submitChanges;
}

/* ===============================
   IMAGE UPLOAD (CLOUDINARY)
================================ */
function initImageUpload() {
  const drop = document.getElementById("dropZone");
  const input = document.getElementById("fileInput");
  const preview = drop.querySelector(".image-preview");

  drop.onclick = () => input.click();

  drop.ondragover = (e) => {
    e.preventDefault();
    drop.classList.add("drag");
  };

  drop.ondragleave = () => drop.classList.remove("drag");

  drop.ondrop = (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
    uploadFile(e.dataTransfer.files[0], preview);
  };

  input.onchange = () => uploadFile(input.files[0], preview);
}

async function uploadFile(file, preview) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please upload an image");
    return;
  }

  preview.innerHTML = `<p>Uploading...</p>`;
  newImageSelected = true;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    imageUrl = data.secure_url;

    preview.innerHTML = `<img src="${imageUrl}" />`;
  } catch (err) {
    preview.innerHTML = `<p>Upload failed</p>`;
    console.error(err);
  }
}

/* ===============================
   UPDATE
================================ */
async function submitChanges(e) {
  e.preventDefault();

  try {
    const updated = {
      name: document.getElementById("name").value.trim(),
      price: Number(document.getElementById("price").value),
      description: document.getElementById("description").value.trim(),
      imageUrl,
    };

    await updateDoc(doc(db, "products", productId), updated);
    window.location.replace("/seller/dashboard.html");
  } catch (err) {
    alert("Failed to update product");
    console.error(err);
  }
}
