import { auth, db } from "../core/firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
================================ */
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("/seller/dashboard.html");
  }
});

/* ===============================
   SLUGIFY
================================ */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   CHECK STORE NAME UNIQUENESS
================================ */
async function isStoreNameTaken(storeName) {
  const q = query(
    collection(db, "sellers"),
    where("storeNameLower", "==", storeName.toLowerCase()),
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

/* ===============================
   RENDER REGISTER UI
================================ */
function renderRegisterUI() {
  app.innerHTML = `
    <div class="auth-container">
      <h1>Create Your Store</h1>
      <p>Start selling on CampusFair</p>

      <form id="registerForm">

        <input
          type="text"
          id="sellerCode"
          placeholder="Seller Code (CF-001)"
          required
        />

        <p style="font-size:0.75rem;color:#64748b;margin-top:-6px">
          To get a seller code, contact <strong>+2347060577255</strong>
        </p>

        <input type="text" id="ownerName" placeholder="Your Full Name" required />
        <input type="text" id="storeName" placeholder="Store Name" required />

        <textarea
          id="storeDescription"
          placeholder="Describe your business (what you sell, quality, delivery, etc)"
          rows="4"
          required
        ></textarea>

        <input
          type="tel"
          id="phone"
          placeholder="WhatsApp Number (e.g. +2348012345678)"
          required
        />

        <input type="email" id="email" placeholder="Email address" required />
        <input type="password" id="password" placeholder="Password" required />

        <button type="submit" id="submitBtn">Create Store</button>
      </form>

      <p class="auth-footer">
        Already have a store?
        <a href="/seller/login.html">Login</a>
      </p>

      <div id="statusMsg"></div>
    </div>
  `;
}

/* ===============================
   SHOW STATUS MESSAGE
================================ */
function showStatus(message, type = "error") {
  const statusMsg = document.getElementById("statusMsg");
  statusMsg.innerHTML = `<p class="${type}">${message}</p>`;
  statusMsg.style.display = "block";
}

/* ===============================
   VERIFY SELLER DOCUMENT WAS CREATED
================================ */
async function verifySellerDocument(uid) {
  console.log("Verifying seller document for UID:", uid);

  // Try multiple times with delay
  for (let i = 0; i < 5; i++) {
    try {
      const sellerDoc = await getDoc(doc(db, "sellers", uid));
      if (sellerDoc.exists()) {
        console.log("✅ Seller document verified on attempt", i + 1);
        return true;
      }
      console.log("Attempt", i + 1, ": Seller document not found yet");
    } catch (error) {
      console.log(
        "Attempt",
        i + 1,
        ": Error checking document:",
        error.message,
      );
    }

    // Wait 1 second before trying again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

/* ===============================
   REGISTER LOGIC
================================ */
function setupRegister() {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn.textContent;

    // Clear previous messages
    showStatus("", "info");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating store...";

    const sellerCode = document.getElementById("sellerCode").value.trim();
    const ownerName = document.getElementById("ownerName").value.trim();
    const storeName = document.getElementById("storeName").value.trim();
    const storeDescription = document
      .getElementById("storeDescription")
      .value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Validation
    if (!sellerCode.startsWith("CF-")) {
      showStatus("Seller code must start with 'CF-' (e.g., CF-001)");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    if (phone.length < 10) {
      showStatus("Enter a valid WhatsApp number");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    try {
      console.log("Starting registration process...");

      /* ===============================
         STORE NAME CHECK
      ================================ */
      showStatus("Checking store name availability...", "info");
      const taken = await isStoreNameTaken(storeName);
      if (taken) {
        showStatus("Store name already exists. Please choose another.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      /* ===============================
         VALIDATE SELLER CODE
      ================================ */
      showStatus("Validating seller code...", "info");
      const codeRef = doc(db, "meta", "sellerCode");
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        showStatus("Seller code system unavailable. Please contact support.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      const { currentCode } = codeSnap.data();

      if (sellerCode !== currentCode) {
        showStatus("Invalid seller code. Please check and try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      /* ===============================
         CREATE AUTH ACCOUNT
      ================================ */
      showStatus("Creating account...", "info");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      console.log("✅ Auth account created. UID:", uid);

      /* ===============================
         CREATE SLUG
      ================================ */
      const storeSlug = slugify(storeName);

      /* ===============================
         CREATE SELLER DOCUMENT
      ================================ */
      showStatus("Creating seller profile...", "info");

      const sellerData = {
        sellerCode,
        ownerName,
        storeName,
        storeNameLower: storeName.toLowerCase(),
        storeSlug,
        storeDescription,
        phone,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        productCount: 0,
        active: true,
        uid: uid, // Also store UID in the document for easy reference
      };

      console.log("Creating seller document with data:", sellerData);

      try {
        await setDoc(doc(db, "sellers", uid), sellerData);
        console.log("✅ Seller document created");
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        // If Firestore fails, delete the auth account to keep things clean
        await auth.currentUser.delete();
        showStatus("Failed to create store profile. Please try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      /* ===============================
         VERIFY DOCUMENT WAS CREATED
      ================================ */
      showStatus("Verifying store creation...", "info");
      const verified = await verifySellerDocument(uid);

      if (!verified) {
        showStatus(
          "Store created but verification failed. Please try logging in.",
        );
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      /* ===============================
         SUCCESS - REDIRECT
      ================================ */
      showStatus("✅ Store created successfully! Redirecting...", "success");

      // Small delay to show success message
      setTimeout(() => {
        window.location.replace("/seller/dashboard.html");
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "Failed to create store. ";

      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          "Email already in use. Please use a different email or login.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else {
        errorMessage += err.message || "Please try again.";
      }

      showStatus(errorMessage);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

/* ===============================
   INIT
================================ */
function init() {
  renderRegisterUI();
  setupRegister();
}

init();
