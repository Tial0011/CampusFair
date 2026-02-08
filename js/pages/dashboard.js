import { auth, db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
================================ */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.replace("/");
    return;
  }

  renderLoadingUI();
  await initDashboard(user);
});

/* ===============================
   LOADING UI
================================ */
function renderLoadingUI() {
  app.innerHTML = `
    <header class="header">
      <h2>Seller Dashboard</h2>
    </header>
    <div class="loading">Loading your dashboard...</div>
  `;
}

/* ===============================
   SLUG FROM STORE NAME
================================ */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   FETCH SELLER WITH RECOVERY
================================ */
async function fetchSeller(uid) {
  try {
    const snap = await getDoc(doc(db, "sellers", uid));

    if (!snap.exists()) {
      const user = auth.currentUser;
      const sellerData = {
        ownerName: "Store Owner",
        storeName: user.email.split("@")[0] + "'s Store",
        storeDescription: "Welcome to my store",
        phone: "+2340000000000",
        email: user.email,
        createdAt: serverTimestamp(),
        productCount: 0,
        active: true,
      };

      await setDoc(doc(db, "sellers", uid), sellerData);
      return sellerData;
    }

    return snap.data();
  } catch (error) {
    console.error("Error fetching seller:", error);
    throw new Error("Could not load seller profile");
  }
}

/* ===============================
   UI
================================ */
function renderBaseUI(storeLink) {
  app.innerHTML = `
    <header class="header">
      <h3>Seller Dashboard</h3>

      <div class="header-right">
        <a href="${storeLink}" target="_blank" class="seller-link">
          View Store
        </a>
        <button id="logoutBtn" class="seller-btn">Logout</button>
      </div>
    </header>

    <section class="store-link-box">
      <p><strong>Your Store Link</strong></p>
      <div class="copy-row">
        <input type="text" value="${storeLink}" readonly />
        <button id="copyBtn">Copy</button>
      </div>
    </section>

    <section>
      <a href="/seller/add-product.html" class="seller-btn">
        + Add New Product
      </a>
    </section>

    <section>
      <h2>My Products</h2>
      <div id="products">
        <p class="loading">Fetching products...</p>
      </div>
    </section>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    await auth.signOut();
    window.location.replace("/");
  };

  document.getElementById("copyBtn").onclick = () => {
    navigator.clipboard.writeText(storeLink);
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied ✓";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 2000);
  };
}

/* ===============================
   PRODUCTS
================================ */
async function fetchSellerProducts(uid) {
  try {
    const q = query(collection(db, "products"), where("sellerId", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

function renderProducts(products) {
  const box = document.getElementById("products");
  box.innerHTML = "";

  if (!products.length) {
    box.innerHTML = "<p>No products yet.</p>";
    return;
  }

  box.className = "products-grid";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>
      <div class="dashboard-actions">
        <a href="/seller/edit-product.html?id=${p.id}">Edit</a>
        <button class=".dashboard-actions button" data-id="${p.id}">Delete</button>
      </div>
    `;

    box.appendChild(card);
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete product?")) return;
      try {
        await deleteDoc(doc(db, "products", btn.dataset.id));
        btn.closest(".product-card").remove();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete product");
      }
    };
  });
}

/* ===============================
   INIT
================================ */
async function initDashboard(user) {
  try {
    const seller = await fetchSeller(user.uid);
    const slug = slugify(seller.storeName);
    const storeLink = `https://campusfair.netlify.app/s/${slug}`;

    renderBaseUI(storeLink);

    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);
  } catch (err) {
    console.error(err);
    app.innerHTML = `
      <header class="header">
        <h2>Seller Dashboard</h2>
      </header>
      <div style="padding: 20px; text-align: center;">
        <p>Failed to load dashboard</p>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px;">
          Retry
        </button>
      </div>
    `;
  }
}
