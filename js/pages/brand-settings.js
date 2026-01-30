import { auth, db } from "../core/firebase.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

const CLOUD_NAME = "duh3wgggt";
const UPLOAD_PRESET = "campusfair_products";

/* ===============================
   AUTH
================================ */
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "/seller/login.html";
    return;
  }

  renderUI(user);
});

/* ===============================
   UI
================================ */
function renderUI(user) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>Store Branding</h1>
      </div>

      <div class="header-right">
        <a href="/seller/dashboard.html" class="seller-link">
          Back to Dashboard
        </a>
      </div>
    </header>

    <section class="auth-container">

      <div id="logoDrop" class="brand-upload">
        <p><strong>Store Logo</strong></p>
        <small>Drag & drop or click</small>
        <input type="file" accept="image/*" hidden />
      </div>

      <div id="bannerDrop" class="brand-upload">
        <p><strong>Store Banner</strong></p>
        <small>Drag & drop or click</small>
        <input type="file" accept="image/*" hidden />
      </div>

    </section>
  `;

  setupUpload("logoDrop", "logoUrl", user.uid);
  setupUpload("bannerDrop", "bannerUrl", user.uid);
}

/* ===============================
   IMAGE UPLOAD
================================ */
function setupUpload(id, field, sellerId) {
  const box = document.getElementById(id);
  const input = box.querySelector("input");

  box.onclick = () => input.click();

  box.ondragover = (e) => {
    e.preventDefault();
    box.classList.add("dragging");
  };

  box.ondragleave = () => box.classList.remove("dragging");

  box.ondrop = (e) => {
    e.preventDefault();
    box.classList.remove("dragging");
    upload(e.dataTransfer.files[0], field, sellerId, box);
  };

  input.onchange = () => {
    upload(input.files[0], field, sellerId, box);
  };
}

/* ===============================
   CLOUDINARY UPLOAD
================================ */
async function upload(file, field, sellerId, box) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please upload an image");
    return;
  }

  box.innerHTML = "<p>Uploading...</p>";

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: form,
      },
    );

    const data = await res.json();

    await updateDoc(doc(db, "sellers", sellerId), {
      [field]: data.secure_url,
    });

    box.innerHTML = `
      <img src="${data.secure_url}" class="brand-preview" />
      <small>Uploaded successfully</small>
    `;
  } catch (err) {
    alert("Upload failed");
    console.error(err);
  }
}
