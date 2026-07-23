import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export const movies = [];

export let activeGenre = 'All';
export function setActiveGenre(val) {
  activeGenre = val;
}

export const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error(`Storage.get failed for "${key}":`, err);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Storage.set failed for "${key}":`, err);
    }
  }
};

export function saveToLocalStorage() {
  const watchlist = movies.filter(m => m.inWatchlist);
  const favs      = movies.filter(m => m.isFav);
  
  const uid = auth.currentUser?.uid;
  if (uid) {
    updateUserField(uid, 'watchlist', watchlist)
      .catch(err => console.error('Failed to save watchlist:', err));
    updateUserField(uid, 'favorites', favs)
      .catch(err => console.error('Failed to save favorites:', err));
  } else {
    Storage.set('cv_watchlist', watchlist);
    Storage.set('cv_favs',      favs);
  }
}

export function trackWatched(movie) {
  const uid = auth.currentUser?.uid;
  let history = {};
  if (uid) {
    history = currentUserData.history || {};
  } else {
    history = Storage.get('cv_history', {});
  }

  const key = movie.id || movie.title;
  const prior = history[key];
  const nextProgress = prior ? Math.min(90, prior.progress + 15) : 25;

  history[key] = {
    id: movie.id,
    title: movie.title,
    poster: movie.poster,
    genre: movie.genre,
    rating: movie.rating,
    desc: movie.desc,
    progress: nextProgress,
    timestamp: Date.now()
  };

  if (uid) {
    currentUserData.history = history;
    updateUserField(uid, 'history', history)
      .catch(err => console.error('Failed to save history:', err));
  } else {
    Storage.set('cv_history', history);
  }
}

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

export function clearInMemoryUserData() {
  movies.forEach(m => {
    m.inWatchlist = false;
    m.isFav = false;
  });
  currentUserData = { watchlist: [], favorites: [], history: {} };
}

export let currentUserData = { watchlist: [], favorites: [], history: {} };

export async function loadUserData(uid) {
  currentUserData = await getUserDoc(uid);
  
  movies.forEach(m => {
    m.inWatchlist = false;
    m.isFav = false;
  });

  if (currentUserData.watchlist) {
    currentUserData.watchlist.forEach(m => {
      const existing = movies.find(mv => mv.id === m.id || mv.title === m.title);
      if (existing) {
        existing.inWatchlist = true;
      } else {
        const newMovie = { ...m, inWatchlist: true };
        movies.push(newMovie);
      }
    });
  }

  if (currentUserData.favorites) {
    currentUserData.favorites.forEach(m => {
      const existing = movies.find(mv => mv.id === m.id || mv.title === m.title);
      if (existing) {
        existing.isFav = true;
      } else {
        const newMovie = { ...m, isFav: true };
        movies.push(newMovie);
      }
    });
  }

  return currentUserData;
}
