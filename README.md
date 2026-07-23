# 🎬 CineVault

A Netflix-style movie discovery and watchlist app built with vanilla JavaScript — real-time TMDB data, Firebase authentication, and a Firestore-backed per-user watchlist, favorites, and viewing history.

**[Live Demo →](https://cinevault-pranjal-sharma.netlify.app/)**

![CineVault Screenshot](./screenshots/hero.png)

<p align="center">
  <img src="./screenshots/modal.png" width="49%" alt="Movie Details Modal" />
  <img src="./screenshots/watchlist.png" width="49%" alt="Watchlist & Favorites" />
</p>

## Features
- 🔍 Live search with debounced queries and stale-response protection
- 🎭 Genre filtering and multi-field sorting across trending/top-rated/genre rows
- 📽️ Movie details modal with trailer playback, cached director/cast/runtime lookups
- 🔐 Firebase Authentication — guests can browse freely; login is only required to save a watchlist, favorites, or viewing history
- ☁️ Per-user data synced to Firestore, isolated by account
- ♿ Accessibility: focus-trapped modal, aria-labeled controls

## Tech Stack
**Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6 Modules) — no framework, no build step  
**Data:** [TMDB API](https://www.themoviedb.org/documentation/api) for movie data  
**Auth & Database:** Firebase Authentication + Cloud Firestore  
**Hosting:** Netlify  

## Architecture
index.html → Main entry markup  
assets/  
  css/  
    style.css → All styling  
  js/  
    api.js → TMDB fetch calls, response mapping, in-memory details cache  
    auth.js → Firebase Authentication wrapper (signup/login/logout)  
    state.js → App state, Firestore read/write helpers  
    render.js → DOM building, modal logic, focus trap, filtering/sorting  
    toast.js → Toast notification helper  
    main.js → Entry point — event wiring, auth flow orchestration  
    config.js → TMDB API key (gitignored — see Setup)  
    config.example.js → Template for config.js  
    firebase-config.js → Firebase project config (gitignored — see Setup)  
    firebase-config.example.js → Template for firebase-config.js  
screenshots/ → README images

## Setup
1. Clone this repo
2. Copy `assets/js/config.example.js` → `assets/js/config.js` and add your own [TMDB API key](https://www.themoviedb.org/settings/api)
3. Copy `assets/js/firebase-config.example.js` → `assets/js/firebase-config.js` and add your own Firebase project config (create a free project at [firebase.google.com](https://firebase.google.com), enable Authentication (Email/Password) and Firestore)
4. Open `index.html` via a local server (e.g. VS Code Live Server) — ES modules require serving over http, not opening the file directly
5. Firestore security rules used in this project (add these in your own Firebase console under Firestore → Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```



## License
MIT
