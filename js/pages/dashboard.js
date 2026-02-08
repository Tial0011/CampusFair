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
   SLUGIFY
================================ */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   AUTH GUARD
================================ */
auth.onAuthStateChanged(async (user) => {
  console.log("Auth state changed. User:", user ? user.uid : "No user");

  if (!user) {
    console.log("No user, redirecting to home");
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
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  `;
}

/* ===============================
   CREATE MISSING SELLER DOCUMENT
================================ */
async function createMissingSellerDocument(user) {
  console.log("Creating missing seller document for user:", user.email);

  const sellerData = {
    ownerName: "Store Owner", // Default values
    storeName: user.email.split("@")[0] + "'s Store",
    storeNameLower: (user.email.split("@")[0] + "'s Store").toLowerCase(),
    storeSlug: slugify(user.email.split("@")[0] + "-store"),
    storeDescription: "Welcome to my store on CampusFair!",
    phone: "+2340000000000",
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    productCount: 0,
    active: true,
    uid: user.uid,
    needsSetup: true, // Flag to indicate this needs proper setup
  };

  try {
    await setDoc(doc(db, "sellers", user.uid), sellerData);
    console.log("✅ Created missing seller document");
    return sellerData;
  } catch (error) {
    console.error("Failed to create seller document:", error);
    throw error;
  }
}

/* ===============================
   FETCH SELLER WITH RECOVERY
================================ */
async function fetchSeller(uid) {
  console.log("Fetching seller with UID:", uid);

  try {
    const sellerRef = doc(db, "sellers", uid);
    const snap = await getDoc(sellerRef);

    console.log("Seller document exists:", snap.exists());

    if (!snap.exists()) {
      console.warn("Seller document not found. This might be a new user.");

      // Get current user to create missing document
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Try to create the missing document
      const sellerData = await createMissingSellerDocument(user);
      return sellerData;
    }

    const sellerData = snap.data();
    console.log("Seller data retrieved:", sellerData);

    return sellerData;
  } catch (error) {
    console.error("Error in fetchSeller:", error);
    throw error;
  }
}

/* ===============================
   BASE UI
================================ */
function renderBaseUI(storeLink, seller) {
  const needsSetup = seller.needsSetup || false;

  app.innerHTML = `
    <header class="header">
      <h2>Seller Dashboard</h2>
      <div class="store-info">
        <span class="store-name">${seller.storeName}</span>
        ${needsSetup ? '<span class="setup-warning">⚠ Needs Setup</span>' : ""}
      </div>

      <div class="header-right">
        <a href="${storeLink}" target="_blank" class="seller-link">
          View Store
        </a>
        <button id="logoutBtn" class="seller-btn">Logout</button>
      </div>
    </header>

    ${
      needsSetup
        ? `
    <div class="warning-banner">
      <p>⚠ Your store profile needs to be set up properly. 
      <a href="#" id="setupLink">Complete setup now</a></p>
    </div>
    `
        : ""
    }

    <section class="store-link-box">
      <p><strong>Your Store Link</strong></p>
      <div class="copy-row">
        <input type="text" value="${storeLink}" readonly />
        <button id="copyBtn">Copy</button>
      </div>
      <p class="hint">Share this link with customers</p>
    </section>

    <section class="quick-stats">
      <div class="stat-card">
        <h3>Store Status</h3>
        <p class="status ${seller.active ? "active" : "inactive"}">
          ${seller.active ? "Active" : "Inactive"}
        </p>
      </div>
      <div class="stat-card">
        <h3>Products</h3>
        <p class="count">${seller.productCount || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Since</h3>
        <p class="date">${seller.createdAt ? "Recently" : "Just now"}</p>
      </div>
    </section>

    <section class="action-section">
      <a href="/seller/add-product.html" class="seller-btn primary">
        + Add New Product
      </a>
      ${
        needsSetup
          ? `
        <a href="/seller/profile-setup.html" class="seller-btn secondary">
          Complete Setup
        </a>
      `
          : `
        <button id="refreshBtn" class="seller-btn secondary">
          Refresh Products
        </button>
      `
      }
    </section>

    <section class="products-section">
      <h2>My Products</h2>
      <div id="products">
        <p class="loading">Fetching products...</p>
      </div>
    </section>
  `;

  // Event listeners
  document.getElementById("logoutBtn").onclick = async () => {
    await auth.signOut();
    window.location.replace("/");
  };

  document.getElementById("copyBtn").onclick = () => {
    navigator.clipboard.writeText(storeLink);
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied ✓";
    btn.style.background = "#10b981";
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.style.background = "";
    }, 2000);
  };

  if (document.getElementById("refreshBtn")) {
    document.getElementById("refreshBtn").onclick = async () => {
      const productsContainer = document.getElementById("products");
      productsContainer.innerHTML =
        '<p class="loading">Refreshing products...</p>';
      try {
        const products = await fetchSellerProducts(auth.currentUser.uid);
        renderProducts(products);
      } catch (error) {
        productsContainer.innerHTML = `<p class="error">Failed to refresh: ${error.message}</p>`;
      }
    };
  }

  if (document.getElementById("setupLink")) {
    document.getElementById("setupLink").onclick = (e) => {
      e.preventDefault();
      window.location.href = "/seller/profile-setup.html";
    };
  }
}

/* ===============================
   PRODUCTS
================================ */
async function fetchSellerProducts(uid) {
  console.log("Fetching products for seller UID:", uid);
  try {
    const q = query(collection(db, "products"), where("sellerId", "==", uid));
    const snap = await getDocs(q);
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log("Found products:", products.length);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

function renderProducts(products) {
  const box = document.getElementById("products");
  box.innerHTML = "";

  if (!products || !products.length) {
    box.innerHTML = `
      <div class="empty-state">
        <p>No products yet.</p>
        <p>Add your first product to start selling!</p>
        <a href="/seller/add-product.html" class="seller-btn">Add Product</a>
      </div>
    `;
    return;
  }

  box.className = "products-grid";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img src="${p.imageUrl || "/images/placeholder.jpg"}" alt="${p.name}" 
             onerror="this.src='/images/placeholder.jpg'" />
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-description">${p.description?.substring(0, 60) || ""}...</p>
        <div class="product-footer">
          <p class="price">₦${parseInt(p.price || 0).toLocaleString()}</p>
          <div class="dashboard-actions">
            <a href="/seller/edit-product.html?id=${p.id}" class="edit-btn">Edit</a>
            <button class="delete-btn" data-id="${p.id}">Delete</button>
          </div>
        </div>
      </div>
    `;

    box.appendChild(card);
  });

  setupDeleteButtons();
}

/* ===============================
   DELETE PRODUCT
================================ */
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      const productId = btn.dataset.id;
      const productCard = btn.closest(".product-card");

      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        await deleteDoc(doc(db, "products", productId));
        productCard.style.opacity = "0.5";
        setTimeout(() => productCard.remove(), 300);

        showMessage("Product deleted successfully", "success");
      } catch (err) {
        console.error("Delete error:", err);
        btn.disabled = false;
        btn.textContent = "Delete";
        showMessage("Failed to delete product. Please try again.", "error");
      }
    };
  });
}

/* ===============================
   SHOW MESSAGE
================================ */
function showMessage(text, type = "info") {
  // Remove existing messages
  const existing = document.querySelector(".message");
  if (existing) existing.remove();

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;

  document.body.appendChild(message);

  setTimeout(() => {
    if (message.parentNode) {
      message.style.opacity = "0";
      setTimeout(() => message.remove(), 300);
    }
  }, 3000);
}

/* ===============================
   INIT DASHBOARD
================================ */
async function initDashboard(user) {
  try {
    console.log("Initializing dashboard for user:", user.uid);

    // Fetch seller data with recovery
    const seller = await fetchSeller(user.uid);

    // Use stored slug if available, otherwise generate one
    const storeSlug = seller.storeSlug || slugify(seller.storeName);
    const storeLink = `https://campusfair.netlify.app/s/${storeSlug}`;

    console.log("Store slug:", storeSlug);
    console.log("Store link:", storeLink);

    // Render the base UI
    renderBaseUI(storeLink, seller);

    // Fetch and render products
    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);

    console.log("✅ Dashboard loaded successfully");
  } catch (err) {
    console.error("❌ Dashboard initialization error:", err);

    // Show detailed error message
    app.innerHTML = `
      <header class="header">
        <h2>Seller Dashboard</h2>
      </header>
      <div class="error-container">
        <h3>⚠ Dashboard Error</h3>
        <p><strong>Error:</strong> ${err.message}</p>
        <div class="error-details">
          <p><strong>User ID:</strong> ${user.uid}</p>
          <p><strong>Email:</strong> ${user.email}</p>
        </div>
        <div class="error-actions">
          <button id="retryBtn" class="seller-btn primary">Retry Loading</button>
          <button id="recoverBtn" class="seller-btn secondary">Recover Profile</button>
          <button id="logoutErrorBtn" class="seller-btn">Logout</button>
        </div>
        <p class="hint">If this persists, please contact support</p>
      </div>
    `;

    // Add event listeners for error buttons
    document.getElementById("retryBtn").onclick = () => {
      renderLoadingUI();
      initDashboard(user);
    };

    document.getElementById("recoverBtn").onclick = async () => {
      try {
        showMessage("Recovering your profile...", "info");
        await createMissingSellerDocument(user);
        showMessage("Profile recovered! Reloading...", "success");
        setTimeout(() => {
          renderLoadingUI();
          initDashboard(user);
        }, 1500);
      } catch (recoverError) {
        showMessage("Recovery failed: " + recoverError.message, "error");
      }
    };

    document.getElementById("logoutErrorBtn").onclick = async () => {
      await auth.signOut();
      window.location.replace("/");
    };
  }
}
