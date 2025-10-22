import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYzQ3P42s3fNS5SNvMBLdhmRLoPzzH7c8",
  authDomain: "cashvelo-05.firebaseapp.com",
  projectId: "cashvelo-05",
  storageBucket: "cashvelo-05.appspot.com",   
  messagingSenderId: "745623180027",
  appId: "1:745623180027:web:d527e97ae325fce24d565e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
