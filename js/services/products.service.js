import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import { db } from "../core/firestore.js";

// add product
export async function addProduct(data) {
  return addDoc(collection(db, "products"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

// get products by store
export async function getProductsByStore(storeId) {
  const q = query(
    collection(db, "products"),
    where("storeId", "==", storeId),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// get latest products (home page)
export async function getLatestProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
