import { IMG_BASE_URL } from './config.js';
import { movies, activeGenre, setActiveGenre, Storage, saveToLocalStorage, clearInMemoryUserData, loadUserData } from './state.js';
import { fetchMovies, mapTmdbMovie, TMDB_GENRE_MAP, fetchMovieDetails } from './api.js';
import { buildCard, updateStats, renderWatchlist, renderFavorites, renderContinueWatching, closeModal, openModal, filterByGenre, sortCards, syncMovieCardStates } from './render.js';
import { watchAuthState, signup, login, logout } from './auth.js';
import { showToast } from './toast.js';

async function loadCategory(endpoint, sectionId) {
  const container = document.getElementById(sectionId);
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const skel = document.createElement('div');
    skel.className = 'skeleton-card';
    container.appendChild(skel);
  }

  const rawMovies = await fetchMovies(endpoint);

  if (rawMovies.length === 0) {
    container.innerHTML = '<p class="row-error">Unable to load movies — check your connection.</p>';
    return;
  }

  container.innerHTML = '';
  rawMovies.forEach(raw => {
    const movie = mapTmdbMovie(raw);
    const existing = movies.find(m => m.id === movie.id);
    if (existing) {
      container.appendChild(buildCard(existing));
    } else {
      movies.push(movie);
      container.appendChild(buildCard(movie));
    }
  });
  updateStats(activeGenre);
}

/* ================================================================
   NAVBAR — active link on scroll
=============================================================== */
const navLinks = document.querySelectorAll('.nav-links a[data-scroll]');
const sections = ['hero', 'trending', 'toprated', 'watchlistSection'];

window.addEventListener('scroll', () => {
  let current = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  navLinks.forEach(a => a.classList.toggle('active', a.dataset.scroll === current));
  const activeLink = document.querySelector('.nav-links a.active');
  updateIndicator(activeLink);
}, { passive: true });

/* Smooth scroll on click (supplement native href) */
navLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const targetId = a.dataset.scroll;
    if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const target = document.getElementById(targetId);
      if (target) {
        if (targetId === 'watchlistSection') {
          requireAuth(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });
});

/* ================================================================
   SEARCH OVERLAY
=============================================================== */
const overlay = document.getElementById('searchOverlay');
const overlayInput = document.getElementById('overlaySearch');
const resultsDiv = document.getElementById('searchResults');

document.getElementById('openSearch').addEventListener('click', () => {
  overlay.classList.add('open');
  overlayInput.value = '';
  resultsDiv.innerHTML = '<div class="sq-empty">Start typing to search…</div>';
  setTimeout(() => overlayInput.focus(), 80);
});

document.getElementById('closeSearch').addEventListener('click', closeSearch);
overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

function closeSearch() { overlay.classList.remove('open'); }

let searchDebounceTimer;
overlayInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  const q = overlayInput.value.trim();
  if (!q) {
    resultsDiv.innerHTML = '<div class="sq-empty">Start typing to search…</div>';
    return;
  }

  resultsDiv.innerHTML = '<div class="sq-empty">Searching TMDB…</div>';

  searchDebounceTimer = setTimeout(async () => {
    try {
      const rawResults = await fetchMovies('/search/movie?query=' + encodeURIComponent(q) + '&');
      if (overlayInput.value.trim() !== q) return; // ignore stale responses

      if (rawResults.length === 0) {
        resultsDiv.innerHTML = '<div class="sq-empty">No movies found matching "' + q + '"</div>';
        return;
      }

      resultsDiv.innerHTML = '';
      rawResults.forEach(m => {
        const item = document.createElement('div');
        item.className = 'sq-item';
        const posterUrl = m.poster_path ? IMG_BASE_URL + m.poster_path : 'https://placehold.co/80x120/1E1E1E/a3a3a3?text=?';
        const rating = m.vote_average ? m.vote_average.toFixed(1) : '—';
        const genreName = TMDB_GENRE_MAP[m.genre_ids?.[0]] || 'Drama';

        item.innerHTML = `
          <img src="${posterUrl}" onerror="this.src='https://placehold.co/80x120/1E1E1E/a3a3a3?text=?'" />
          <div class="sq-item-info">
            <div class="sq-title">${m.title || m.name || 'Unknown'}</div>
            <div class="sq-rating">⭐ ${rating} · ${genreName}</div>
          </div>`;

        item.addEventListener('click', () => {
          closeSearch();
          let matched = false;
          const cards = document.querySelectorAll('.card');
          cards.forEach(c => {
            const titleEl = c.querySelector('.card-title');
            if (titleEl && titleEl.textContent === (m.title || m.name)) {
              if (!matched) {
                c.scrollIntoView({ behavior: 'smooth', block: 'center' });
                matched = true;
              }
              c.style.boxShadow = '0 0 0 3px var(--red), 0 20px 50px rgba(0,0,0,0.6)';
              setTimeout(() => c.style.boxShadow = '', 2000);
            }
          });
          if (!matched) {
            const movieObj = mapTmdbMovie(m);
            const alreadyExists = movies.find(mv => mv.id === movieObj.id);
            if (!alreadyExists) {
              movies.push(movieObj);
            }
            openModal(alreadyExists || movieObj);
          }
        });
        resultsDiv.appendChild(item);
      });
    } catch (error) {
      console.error('Search failed:', error);
      resultsDiv.innerHTML = '<div class="sq-empty">Search failed. Try again.</div>';
    }
  }, 350);
});

let currentHeroMovie = null;
let heroInterval = null;

async function updateHeroBanner(movie) {
  if (!movie) return;
  currentHeroMovie = movie;

  const bgEl = document.querySelector('.hero-bg');
  if (bgEl) {
    const backdropUrl = movie.backdrop
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop}`
      : movie.poster;

    // Smooth transition
    bgEl.style.opacity = '0';
    setTimeout(() => {
      bgEl.style.backgroundImage = `linear-gradient(to right, #141414 32%, transparent 70%), linear-gradient(to top, #141414 8%, transparent 50%), url(${backdropUrl})`;
      bgEl.style.opacity = '1';
    }, 250);
  }

  document.querySelector('.hero-genre').textContent = movie.genre || 'Featured';
  document.querySelector('.hero-title').textContent = movie.title;

  const ratingVal = document.getElementById('heroRating');
  if (ratingVal) ratingVal.textContent = (movie.rating || 0).toFixed(1);

  document.querySelector('.hero-year').textContent = movie.year || '—';
  document.querySelector('.hero-desc').textContent = movie.desc || 'No description available.';

  const wlBtn = document.getElementById('heroWatchlist');
  if (wlBtn) {
    wlBtn.classList.toggle('in-wl', movie.inWatchlist);
    wlBtn.querySelector('span').textContent = movie.inWatchlist ? 'In Watchlist' : 'Add to Watchlist';
  }

  try {
    const details = await fetchMovieDetails(movie.id);
    if (details && details.runtime) {
      document.querySelector('.hero-dur').textContent = details.runtime;
      document.querySelector('.hero-dur').style.display = '';
    } else {
      document.querySelector('.hero-dur').style.display = 'none';
    }
  } catch (err) {
    document.querySelector('.hero-dur').style.display = 'none';
  }
}

function initHeroRotation() {
  if (heroInterval) clearInterval(heroInterval);

  let tries = 0;
  const checkLoaded = setInterval(() => {
    tries++;
    if (movies.length > 0) {
      clearInterval(checkLoaded);
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      updateHeroBanner(randomMovie);

      heroInterval = setInterval(() => {
        if (movies.length > 1) {
          let nextMovie = movies[Math.floor(Math.random() * movies.length)];
          while (nextMovie.id === currentHeroMovie.id) {
            nextMovie = movies[Math.floor(Math.random() * movies.length)];
          }
          updateHeroBanner(nextMovie);
        }
      }, 8000);
    } else if (tries > 50) {
      clearInterval(checkLoaded);
    }
  }, 100);
}

/* ================================================================
   HERO BUTTONS
=============================================================== */
document.getElementById('heroPlay').addEventListener('click', () => {
  if (currentHeroMovie) {
    openModal(currentHeroMovie, true);
  }
});

document.getElementById('heroWatchlist').addEventListener('click', () => {
  if (!currentHeroMovie) return;
  requireAuth(() => {
    currentHeroMovie.inWatchlist = !currentHeroMovie.inWatchlist;
    showToast(currentHeroMovie.inWatchlist ? '✅ Added to Watchlist: ' + currentHeroMovie.title : '🗑 Removed from Watchlist: ' + currentHeroMovie.title, currentHeroMovie.inWatchlist ? 'green' : '');
    saveToLocalStorage();
    renderWatchlist();
    syncMovieCardStates(currentHeroMovie);
  });
});

/* ================================================================
   CAROUSEL SCROLLING
=============================================================== */
document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
  const row = wrapper.querySelector('.category-row');
  const left = wrapper.querySelector('.carousel-btn-left');
  const right = wrapper.querySelector('.carousel-btn-right');

  const SCROLL_AMOUNT = 900;

  function updateArrows() {
    left.style.opacity = row.scrollLeft <= 10 ? '0' : '';
    right.style.opacity = row.scrollLeft + row.clientWidth >= row.scrollWidth - 10 ? '0' : '';
  }

  left.addEventListener('click', () => { row.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }); });
  right.addEventListener('click', () => { row.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' }); });

  row.addEventListener('scroll', updateArrows, { passive: true });

  const observer = new MutationObserver(updateArrows);
  observer.observe(row, { childList: true });

  updateArrows();
});

/* ================================================================
   MODAL HANDLERS
=============================================================== */
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('movieModal').addEventListener('click', e => {
  if (e.target === document.getElementById('movieModal')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ================================================================
   GENRE CHIPS
=============================================================== */
document.getElementById('genreChips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  const newGenre = chip.dataset.genre;
  setActiveGenre(newGenre);
  filterByGenre(newGenre);
});

/* ================================================================
   SORT SELECT
=============================================================== */
document.getElementById('sortSelect').addEventListener('change', e => {
  sortCards(e.target.value);
});

/* ================================================================
   AUTH & APP INITIALIZATION
=============================================================== */
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authForm = document.getElementById('authForm');
const authUsernameInput = document.getElementById('authUsername');
const authUsernameGroup = document.getElementById('authUsernameGroup');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleLink = document.getElementById('authToggleLink');
const authCloseBtn = document.getElementById('authClose');
const navSignInBtn = document.getElementById('navSignIn');
const navAccount = document.getElementById('navAccount');
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

const userAvatar = document.getElementById('userAvatar');
const profileDropdown = document.getElementById('profileDropdown');
const avatarInitials = document.getElementById('avatarInitials');
const userDisplayName = document.getElementById('userDisplayName');

function getInitials(name) {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(part => part[0]).join('').substring(0, 2).toUpperCase();
}

if (userAvatar && profileDropdown) {
  userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== userAvatar) {
      profileDropdown.classList.remove('open');
    }
  });
}

let isSignUpMode = false;
let isUserLoggedIn = false;
let pendingAction = null;

export function isLoggedIn() {
  return isUserLoggedIn;
}

export function requireAuth(action) {
  if (isLoggedIn()) {
    action();
  } else {
    pendingAction = action;
    authModal.classList.add('open');
  }
}

// Wire navbar Sign In button
if (navSignInBtn) {
  navSignInBtn.addEventListener('click', () => {
    pendingAction = null; // No action to execute on login
    authModal.classList.add('open');
  });
}

// Wire auth modal close button
if (authCloseBtn) {
  authCloseBtn.addEventListener('click', () => {
    authModal.classList.remove('open');
    pendingAction = null; // Cancel any action
  });
}

// Close on outside click
authModal.addEventListener('click', e => {
  if (e.target === authModal) {
    authModal.classList.remove('open');
    pendingAction = null;
  }
});

authToggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  if (isSignUpMode) {
    authTitle.textContent = 'Create a CineVault Account';
    authSubmitBtn.textContent = 'Sign Up';
    authToggleLink.innerHTML = 'Already have an account? <span>Log in</span>';
    if (authUsernameGroup) authUsernameGroup.style.display = 'flex';
    if (authUsernameInput) authUsernameInput.required = true;
  } else {
    authTitle.textContent = 'Sign in to CineVault';
    authSubmitBtn.textContent = 'Log In';
    authToggleLink.innerHTML = "Don't have an account? <span>Sign up</span>";
    if (authUsernameGroup) authUsernameGroup.style.display = 'none';
    if (authUsernameInput) {
      authUsernameInput.required = false;
      authUsernameInput.value = '';
    }
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = isSignUpMode ? 'Signing Up...' : 'Logging In...';

  try {
    if (isSignUpMode) {
      const username = authUsernameInput.value.trim();
      if (username.length < 3) {
        showToast('⚠️ Username must be at least 3 characters', 'yellow');
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = 'Sign Up';
        return;
      }
      await signup(email, password, username);
      showToast('✅ Account created successfully!', 'green');
      if (userEmailSpan) userEmailSpan.textContent = email;
      if (userDisplayName) userDisplayName.textContent = username;
      if (avatarInitials) avatarInitials.textContent = getInitials(username);
    } else {
      const userCred = await login(email, password);
      showToast('✅ Logged in successfully!', 'green');
      if (userCred && userCred.user) {
        const u = userCred.user;
        const name = u.displayName || u.email;
        if (userEmailSpan) userEmailSpan.textContent = u.email;
        if (userDisplayName) userDisplayName.textContent = u.displayName || 'CineVault User';
        if (avatarInitials) avatarInitials.textContent = getInitials(name);
      }
    }
  } catch (err) {
    showToast(err.message, 'red');
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await logout();
    showToast('👋 Logged out successfully!');
  } catch (err) {
    showToast(err.message, 'red');
  }
});

let appInitialized = false;

function startApp() {
  if (appInitialized) return;
  appInitialized = true;

  loadCategory('/trending/movie/week?', 'trendingRow');
  loadCategory('/movie/top_rated?', 'topratedRow');
  loadCategory('/discover/movie?with_genres=28&', 'actionRow');
  loadCategory('/discover/movie?with_genres=35&', 'comedyRow');
  loadCategory('/discover/movie?with_genres=878&', 'scifiRow');

  renderWatchlist();
  renderFavorites();

  renderContinueWatching();
  initHeroRotation();
}

watchAuthState(async user => {
  isUserLoggedIn = !!user;

  if (!user) {
    // Guest Mode: Hide user email/logout, show Sign In button
    if (navSignInBtn) navSignInBtn.style.display = 'block';
    navAccount.style.display = 'none';
    if (userEmailSpan) userEmailSpan.textContent = '';
    if (userDisplayName) userDisplayName.textContent = '';
    if (avatarInitials) avatarInitials.textContent = '';
    if (profileDropdown) profileDropdown.classList.remove('open');

    // Clear watchlist/favorites from in-memory movie data and UI on logout
    clearInMemoryUserData();
    saveToLocalStorage();
    Storage.set('cv_history', {});
    renderWatchlist();
    renderFavorites();
    renderContinueWatching();
    movies.forEach(m => syncMovieCardStates(m));

    // Browse freely: load rows on startup for both guests and authenticated users
    startApp();
  } else {
    // Authenticated Mode: Show user email/logout, hide Sign In button
    if (navSignInBtn) navSignInBtn.style.display = 'none';
    navAccount.style.display = 'flex';

    const name = user.displayName || user.email;
    if (avatarInitials) avatarInitials.textContent = getInitials(name);
    if (userDisplayName) userDisplayName.textContent = user.displayName || 'CineVault User';
    if (userEmailSpan) userEmailSpan.textContent = user.email;

    // Reset submit button state
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    authForm.reset();

    // Close auth modal
    authModal.classList.remove('open');

    // Run any pending action that requested authentication
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }

    try {
      // Load user's data from Firestore!
      await loadUserData(user.uid);

      // Re-render rows/cards now that the user data is loaded
      renderWatchlist();
      renderFavorites();
      renderContinueWatching();
      movies.forEach(m => syncMovieCardStates(m));
    } catch (err) {
      console.error('Failed to load user data from Firestore:', err);
      showToast('⚠️ Failed to load your watchlist/favorites', 'red');
    }

    // Browse freely: load rows on startup for both guests and authenticated users
    startApp();
  }
});

/* ================================================================
   DYNAMIC NAVBAR SCROLL & SLIDING GLASS PILL INDICATOR
=============================================================== */
const linksContainer = document.querySelector('.nav-links');
let indicator = document.querySelector('.nav-indicator');

if (linksContainer && !indicator) {
  indicator = document.createElement('div');
  indicator.className = 'nav-indicator';
  linksContainer.appendChild(indicator);
}

function updateIndicator(activeLink) {
  if (!activeLink || !indicator) {
    if (indicator) indicator.style.display = 'none';
    return;
  }
  indicator.style.display = 'block';
  indicator.style.width = `${activeLink.offsetWidth}px`;
  indicator.style.left = `${activeLink.offsetLeft}px`;
  indicator.style.top = `${activeLink.offsetTop}px`;
  indicator.style.height = `${activeLink.offsetHeight}px`;
}

// Hover event listeners to move indicator
const navLinksElements = document.querySelectorAll('.nav-links a');
navLinksElements.forEach(link => {
  link.addEventListener('mouseenter', () => {
    updateIndicator(link);
  });

  link.addEventListener('mouseleave', () => {
    const currentActive = document.querySelector('.nav-links a.active');
    updateIndicator(currentActive);
  });
});

// Update indicators initially when links are loaded/rendered
setTimeout(() => {
  const currentActive = document.querySelector('.nav-links a.active');
  if (currentActive) updateIndicator(currentActive);
}, 200);

window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const isScrolled = window.scrollY > 20;
    navbar.classList.toggle('scrolled', isScrolled);
    document.body.classList.toggle('nav-scrolled', isScrolled);
  }
}, { passive: true });

/* Decoupled custom event handler for requiring authorization */
document.addEventListener('require-auth', e => {
  if (e.detail && typeof e.detail.action === 'function') {
    requireAuth(e.detail.action);
  }
});
