# CineVault — Day 4 (Simple Version): Login + Per-User Data with Firebase
## Firebase Authentication + Firestore — No Backend Server to Build or Host

> Save this alongside your Day 1–3 plans. This replaces the Node/Express
> version — same end goal (real accounts, per-user watchlist/favorites/
> history instead of shared localStorage), much less to build and defend.
>
> **Why this is genuinely fine for interviews, not just "the easy way out":**
> Firebase Auth + Firestore is what a large number of real production
> apps use for exactly this reason — you don't reinvent password
> hashing and token verification unless you have a specific reason to.
> Knowing *when* to use a managed service instead of building it
> yourself is itself a legitimate engineering judgment call. You can
> say that sentence in an interview and it's true.
>
> **What changes today:** watchlist, favorites, and history move from
> `localStorage` into Firestore, scoped to a Firebase Auth user ID.
> No `/server` folder, no separate deployment, no JWT code you have
> to write yourself — Firebase's SDK handles login state and issues
> tokens internally, you never touch them directly.

---

## Project Context (paste this at the start of any Antigravity session today)

```
I am adding login and per-user data persistence to CineVault, a vanilla
JS movie app (ES modules: /js/api.js, /js/state.js, /js/render.js,
/js/main.js, plus index.html, style.css, config.js).

Currently watchlist/favorites/history live in localStorage via a
Storage helper (Storage.get/Storage.set) in state.js — every visitor
on the same browser sees the same data.

TODAY'S GOAL: use Firebase Authentication (email/password) for login,
and Firestore to store each logged-in user's watchlist/favorites/
history under their own document. No custom backend server — Firebase
is used directly from the frontend via its JS SDK (loaded as ES
modules from Google's CDN, no npm install needed). TMDB movie
browsing itself is unchanged — only watchlist/favorites/history move
off localStorage and into Firestore.

Current Step: Step 5

Progress:
- [ ] Step 1 — Create Firebase project + connect SDK to the app
- [ ] Step 2 — Login/signup UI + auth.js module (Firebase Auth)
- [x] Step 3 — Firestore data structure + security rules
- [x] Step 4 — Migrate watchlist/favorites/history to Firestore
- [ ] Step 5 — Final validation + redeploy to Netlify
```

---
---

## Step 1: Create Firebase Project + Connect SDK
**Status: ⬜ TODO**

### What this does:
Sets up a Firebase project (free tier — "Spark plan" — is enough for this) and connects your app to it. Unlike the Node backend version, there's nothing to host yourself — Firebase Auth and Firestore are fully managed.

### Before running any Antigravity prompt (do this part yourself first, ~5 min):
1. Go to console.firebase.google.com → **Add project** → name it `cinevault` → skip Google Analytics (not needed) → Create
2. In the project, click **Build → Authentication → Get started → Email/Password → Enable → Save**
3. Click **Build → Firestore Database → Create database → Start in production mode → choose a region close to you → Enable**
4. Click the gear icon → **Project settings → scroll to "Your apps" → click the `</>` (Web) icon → register app nickname `cinevault-web`** (don't check Firebase Hosting, you're already using Netlify)
5. Copy the `firebaseConfig` object it shows you — you'll paste this into the prompt below

### Key concepts:
- Firebase's web config values (apiKey, projectId, etc.) are meant to be public/client-visible — same category as your existing TMDB key, this is normal and documented Firebase behavior, not a leak
- Firestore's actual security comes from **security rules** (Step 3), not from hiding the config

### Antigravity Prompt:
```
In my CineVault project, set up the Firebase SDK:

1. Create /js/firebase-config.js as an ES module. Use the Firebase v10
   modular SDK loaded directly from Google's CDN (no npm install
   needed, this works with plain <script type="module"> like the rest
   of my app):

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  // PASTE MY REAL CONFIG VALUES HERE — I will fill these in myself
  apiKey: "PASTE_HERE",
  authDomain: "PASTE_HERE",
  projectId: "PASTE_HERE",
  storageBucket: "PASTE_HERE",
  messagingSenderId: "PASTE_HERE",
  appId: "PASTE_HERE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

2. Don't wire this into any other file yet — that's the next step.
   Just create this file so I can paste my real Firebase config into it.
```

### Validation:
```
[ ] Paste your real firebaseConfig values (from Firebase console →
    Project settings → Your apps) into the placeholders
[ ] File exists at /js/firebase-config.js with no syntax errors
    (open it in the browser console via: import('./js/firebase-config.js')
    and confirm no red errors)
```

---

## Step 2: Login/Signup UI + auth.js Module
**Status: ⬜ TODO**

### What this does:
Adds a login/signup modal and a small `auth.js` module using Firebase's built-in functions — you write almost no logic here, Firebase handles password checks, session persistence, and token refresh internally.

### Key concepts:
- `onAuthStateChanged` — Firebase automatically tells your app whenever the login state changes (login, logout, or page refresh with an existing session) — you don't manually check for a stored token like the custom-backend version
- Firebase persists login across refreshes by default — no manual localStorage token handling needed

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, add a login/signup modal similar in style to the
   existing #movieModal — an overlay with email and password inputs,
   a submit button, and a toggle link between "Sign up" and "Log in"
   modes. Give it id="authModal". Also add a small account indicator
   in the navbar (next to the IMDb badge) showing the logged-in user's
   email and a "Log out" button — hidden until logged in.

2. Create /js/auth.js as an ES module:

import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

// Calls callback(user) whenever login state changes — user is null if logged out
export function watchAuthState(callback) {
  onAuthStateChanged(auth, callback);
}

3. In /js/main.js:
   - Import watchAuthState, signup, login, logout from './auth.js'
   - Call watchAuthState(user => { ... }) once, near the top of your
     app's startup code:
     - if user is null → show #authModal, don't load TMDB rows yet
     - if user exists → hide #authModal, show the navbar account
       indicator with user.email, and proceed with the normal app
       startup (loading TMDB rows etc.) — Step 4 will add loading
       the user's Firestore data here too
   - Wire #authModal's form submit to call signup() or login()
     depending on which mode the toggle is in. On failure, show the
     error via showToast() using error.message (Firebase gives
     readable messages like "Firebase: Error (auth/wrong-password).")
   - Wire the "Log out" button to call logout()

Do not touch watchlist/favorites/history logic yet — that's Step 4.
```

### Validation:
```
[ ] On first visit, the login/signup modal appears
[ ] Signing up with a new email logs you in, modal disappears, navbar
    shows your email
[ ] Refresh the page — you stay logged in (Firebase persists this
    automatically, no code needed for this part)
[ ] Log out — modal reappears, navbar account indicator disappears
[ ] Log back in with the same credentials — works
[ ] Try logging in with a wrong password — see a readable error toast
```

---

## Step 3: Firestore Data Structure + Security Rules
**Status: ✔️ DONE**

### What this does:
Decides how each user's data is stored in Firestore (one document per user, containing their watchlist/favorites/history), and sets the security rules that stop anyone from reading or writing another user's data — **this step is what actually makes it secure**, not the login UI.

### Key concepts:
- Firestore structure here: collection `users`, one document per user, keyed by their Firebase Auth UID
- Security rules run entirely on Firebase's servers — even if someone bypassed your frontend code entirely and called Firestore directly, these rules still apply
- `request.auth.uid == userId` is the entire security model — a user can only touch the document matching their own login

### Antigravity Prompt (rules only — apply this in the Firebase Console, not code):
```
Go to Firebase Console → Firestore Database → Rules tab, and replace
the default rules with:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

Click Publish.
```

### Then, in Antigravity:
```
In my CineVault project, create a helper for Firestore user-document
access. In /js/state.js (or a new /js/firestore-helpers.js if you
prefer keeping state.js focused), import from firebase-config.js and
add:

import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function getUserDoc(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  // First-time login — create an empty document
  const empty = { watchlist: [], favorites: [], history: {} };
  await setDoc(ref, empty);
  return empty;
}

export async function updateUserField(uid, field, value) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { [field]: value }, { merge: true });
}

Do not wire this into the rest of the app yet — that's Step 4.
```

### Validation:
```
[ ] Rules are published in Firebase Console (check the Rules tab
    shows your new rules, not the default ones)
[ ] Log in to your app — check Firebase Console → Firestore Database
    → Data tab → confirm a document appeared under users/{your-uid}
    with empty watchlist/favorites/history
[ ] In Firebase Console → Rules → click "Rules playground" → simulate
    a read with a DIFFERENT random uid than yours → confirm it's DENIED
```

---

## Step 4: Migrate Watchlist/Favorites/History to Firestore
**Status: ✔️ DONE**

### What this does:
The actual point of today — replacing `Storage.get('cv_watchlist', ...)` / `Storage.set(...)` calls with the Firestore helpers from Step 3, scoped to the logged-in user's UID.

### Antigravity Prompt:
```
In my CineVault project, in /js/state.js:

1. Import getUserDoc and updateUserField from wherever you put them
   in Step 3, and import auth from './firebase-config.js'.

2. Add a variable to track the current user's data once loaded:
   let currentUserData = { watchlist: [], favorites: [], history: {} };

3. Add a function loadUserData(uid) that calls getUserDoc(uid), stores
   the result in currentUserData, and returns it — call this from
   main.js right after watchAuthState confirms a user is logged in,
   BEFORE rendering TMDB rows, so watchlist/favorite states show
   correctly on cards immediately.

4. Find every place that currently calls Storage.set('cv_watchlist', watchlist)
   and replace it with:

   const uid = auth.currentUser?.uid;
   if (uid) updateUserField(uid, 'watchlist', watchlist)
     .catch(err => console.error('Failed to save watchlist:', err));

   Apply the same pattern for favorites (field: 'favorites') and
   history (field: 'history'). Keep the in-memory watchlist/favorites/
   history variables working exactly as before — only change WHERE
   they get persisted to.

5. Anywhere the app currently reads Storage.get('cv_watchlist', []) on
   startup, replace it with reading from currentUserData.watchlist
   instead (populated by loadUserData() in step 3 above).

Do not change any UI rendering logic — buildCard(), renderWatchlist(),
etc. should keep working exactly as before, they just now read from
and save to Firestore instead of localStorage.
```

### Validation — the important one:
```
[ ] Sign up as testuser1@test.com, add 2 movies to watchlist, favorite 1
[ ] Log out, sign up as testuser2@test.com (same browser)
[ ] Confirm testuser2 sees an EMPTY watchlist — not testuser1's data
[ ] Log out, log back in as testuser1@test.com
[ ] Confirm testuser1's watchlist/favorites are exactly as left
[ ] Open an incognito window, log in as testuser1
[ ] Confirm the SAME watchlist appears — proving it's tied to the
    account, not the browser
[ ] In Firebase Console → Firestore → Data tab, watch the
    users/{uid} document update in real time as you toggle
    watchlist/favorites in the app
```

---

## Step 5: Final Validation + Redeploy
**Status: ⬜ TODO**

### Nothing to deploy separately — Firebase requires no server hosting.
Since there's no `/server` folder or second deployment, your existing Netlify setup just needs the updated files pushed/redeployed.

```
[ ] Redeploy to Netlify (drag-and-drop the folder again, or git push
    if connected via GitHub)
[ ] Visit your LIVE Netlify URL, not localhost
[ ] Sign up for a new account on the live site — works, no errors
[ ] Add movies to watchlist/favorites — persists after refresh
[ ] Log in from a different device/browser with the same account —
    same data appears
[ ] Two different accounts on the same browser — fully isolated data
[ ] Firestore Console → Usage tab → confirm you're nowhere near the
    free tier limits (50K reads/day is generous for a portfolio demo)
```

---

## If Something Breaks (Emergency Prompt)

```
I am adding Firebase Authentication + Firestore to CineVault, a
vanilla JS app (ES modules), using the Firebase v10 modular SDK
loaded from Google's CDN — no npm install, no backend server.

Files involved: /js/firebase-config.js, /js/auth.js, /js/state.js,
/js/main.js

After completing [STEP X], this broke: [describe the issue]

Error message (browser console): [paste exact error]

Please fix ONLY this specific issue without changing anything else
that is already working.
```

---

## What You Can Now Say in an Interview

*"Watchlist and favorites are scoped per user through Firebase Authentication — each user's data lives in a Firestore document keyed by their auth UID, and I wrote Firestore security rules so a user can only read or write their own document, enforced server-side regardless of what the frontend does. I chose Firebase here instead of a custom backend since it's a managed service well-suited to this scope, and it let me focus my time on the frontend architecture instead of reimplementing password hashing and session handling myself."*

That's honest, defensible, and doesn't oversell what you built — which is exactly what you want walking into a placement round.

**When you're ready to upgrade later:** the natural next step is swapping Firestore for your own Node/Express + MongoDB backend using the same account structure — at that point you'd genuinely understand *why* each piece (bcrypt, JWT, middleware) exists, because you'll have already lived with a working simpler version first. That's a better learning order than building the complex version cold.

---

*CineVault Day 4 (Simple Version) — Firebase Auth + Firestore*
*Keep this file in your project folder alongside Days 1–3*
