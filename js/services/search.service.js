import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import { db } from "../core/firestore.js";

export async function searchProducts(keywords) {
  if (!keywords.length) return [];

  const q = query(
    collection(db, "products"),
    where("keywords", "array-contains-any", keywords.slice(0, 10)),
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
