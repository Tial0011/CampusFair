import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import { db } from "../core/firestore.js";

// check if seller already has a store
export async function getMyStore(ownerId) {
  const q = query(collection(db, "stores"), where("ownerId", "==", ownerId));

  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// create store
export async function createStore(data) {
  return addDoc(collection(db, "stores"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
