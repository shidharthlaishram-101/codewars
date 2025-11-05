// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAO2ex5IkpZCEX95xD834whGYmu6kzSHDs",
  authDomain: "prajyuktam.firebaseapp.com",
  projectId: "prajyuktam",
  storageBucket: "prajyuktam.firebasestorage.app",
  messagingSenderId: "138896897558",
  appId: "1:138896897558:web:9db2311f4aed2f59622737"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db, collection, addDoc};