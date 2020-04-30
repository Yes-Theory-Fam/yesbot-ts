import firebase from "firebase";
import {FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT } from "../const";


export default class Firebase {

  store: firebase.firestore.Firestore | null = null;
  /**
   *
   */
  constructor() {
    const firebaseConfig = {
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT,
    };

    if (!FIREBASE_API_KEY || !FIREBASE_AUTH_DOMAIN || !FIREBASE_PROJECT) {
      console.warn("Missing firebase configuration; not starting firebase")
      return
    }

    firebase.initializeApp(firebaseConfig);
    this.store = firebase.firestore();
    console.log( this.store ? "Firebase successfully initialised" : "ERROR Initisalising Firebase")
  }
}
