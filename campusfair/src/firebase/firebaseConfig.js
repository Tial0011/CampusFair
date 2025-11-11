import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDLkY0_-IZfFfTTb0iP3YgPgf7Ua-uGF6s",
  authDomain: "campus-fair.firebaseapp.com",
  projectId: "campus-fair",
  storageBucket: "campus-fair.appspot.com",
  messagingSenderId: "917882662022",
  appId: "1:917882662022:web:07178acffc92d397fab507",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
