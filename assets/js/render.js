import { movies, Storage, saveToLocalStorage, trackWatched, currentUserData } from './state.js';
import { fetchMovieDetails, loadTrailer } from './api.js';
import { auth } from './firebase-config.js';
import { showToast } from './toast.js';

export function ratingClass(r) {
  return r >= 9 ? 'rating-high' : r >= 7 ? 'rating-mid' : 'rating-low';
}

export function starSVG() {
  return `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
}

export function updateStats(genre = 'All') {
  const filtered = movies.filter(movie => 
    genre === 'All' || (movie && movie.genres && movie.genres.includes(genre))
  );

  if (filtered.length === 0) {
    const highVal = document.getElementById('stat-high');
    if (highVal) highVal.textContent = '—';
    const highName = document.getElementById('stat-high-name');
    if (highName) highName.textContent = '';
    const lowVal = document.getElementById('stat-low');
    if (lowVal) lowVal.textContent = '—';
    const lowName = document.getElementById('stat-low-name');
    if (lowName) lowName.textContent = '';
    const hb = document.getElementById('stat-high-btn');
    if (hb) hb.style.display = 'none';
    const lb = document.getElementById('stat-low-btn');
    if (lb) lb.style.display = 'none';
    return;
  }

  // Calculate highest rated
  const sorted = [...filtered].sort((a, b) => b.rating - a.rating);
  const highest = sorted[0];

  // Calculate lowest rated, ignoring 0.0 ratings (unreleased/not yet rated)
  const validForLow = filtered.filter(m => m.rating > 0);
  let lowest = null;
  if (validForLow.length > 0) {
    const sortedLow = [...validForLow].sort((a, b) => a.rating - b.rating);
    lowest = sortedLow[0];
  } else {
    lowest = sorted[sorted.length - 1];
  }

  const highVal = document.getElementById('stat-high');
  if (highVal) highVal.textContent = highest ? highest.rating.toFixed(1) + ' ⭐' : '—';
  const highName = document.getElementById('stat-high-name');
  if (highName) highName.textContent = highest ? highest.title : '';

  const lowVal = document.getElementById('stat-low');
  if (lowVal) lowVal.textContent = lowest ? lowest.rating.toFixed(1) + ' ⭐' : '—';
  const lowName = document.getElementById('stat-low-name');
  if (lowName) lowName.textContent = lowest ? lowest.title : '';

  const highBtn = document.getElementById('stat-high-btn');
  if (highBtn) {
    if (highest) {
      highBtn.style.display = 'inline-flex';
      highBtn.onclick = (e) => {
        e.preventDefault();
        openModal(highest, true);
      };
    } else {
      highBtn.style.display = 'none';
    }
  }

  const lowBtn = document.getElementById('stat-low-btn');
  if (lowBtn) {
    if (lowest) {
      lowBtn.style.display = 'inline-flex';
      lowBtn.onclick = (e) => {
        e.preventDefault();
        openModal(lowest, true);
      };
    } else {
      lowBtn.style.display = 'none';
    }
  }
}

export function getCanonicalMovie(movie) {
  if (!movie) return movie;
  let canonical = movies.find(m => m.id === movie.id || m.title === movie.title);
  if (!canonical) {
    canonical = { ...movie };
    if (canonical.inWatchlist === undefined) canonical.inWatchlist = false;
    if (canonical.isFav === undefined) canonical.isFav = false;
    movies.push(canonical);
  }
  return canonical;
}

export function buildCard(movie) {
  const canonical = getCanonicalMovie(movie);
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.idx = movies.indexOf(canonical);
  card.tabIndex = 0; // Make card focusable via Tab

  const posterSrc = canonical.poster || 'https://placehold.co/400x600/1E1E1E/a3a3a3?text=No+Poster';
  const badgeClass = ratingClass(canonical.rating);

  card.innerHTML = `
    <div class="card-poster">
      <img src="${posterSrc}" alt="${canonical.title} poster"
           loading="lazy"
           decoding="async"
           style="opacity:0"
           onload="this.style.opacity='1'"
           onerror="this.src='https://placehold.co/400x600/1E1E1E/a3a3a3?text=No+Poster';this.style.opacity='1'" />
      <div class="card-rating-badge ${badgeClass}">${starSVG()}${canonical.rating.toFixed(1)}</div>
      <span class="genre-badge">${canonical.genre}</span>
    </div>
    <div class="card-body">
      <div class="card-title">${canonical.title}</div>
      <div class="card-desc">${canonical.desc}</div>
      <div class="card-actions">
        <button class="card-btn card-btn-wl ${canonical.inWatchlist ? 'active' : ''}">${canonical.inWatchlist ? '✓ <span class="btn-text">Saved</span>' : '+ <span class="btn-text">Watchlist</span>'}</button>
        <button class="card-btn card-btn-fav ${canonical.isFav ? 'active' : ''}" title="Favourite" aria-label="Toggle favourite for ${canonical.title}">♥</button>
      </div>
    </div>`;

  /* Watchlist toggle - Decoupled using CustomEvent */
  card.querySelector('.card-btn-wl').addEventListener('click', e => {
    e.stopPropagation();
    document.dispatchEvent(new CustomEvent('require-auth', {
      detail: {
        action: () => {
          canonical.inWatchlist = !canonical.inWatchlist;
          showToast(canonical.inWatchlist ? '✅ Added to Watchlist: ' + canonical.title : '🗑 Removed from Watchlist: ' + canonical.title, canonical.inWatchlist ? 'green' : '');
          saveToLocalStorage();
          renderWatchlist();
          syncMovieCardStates(canonical);
        }
      }
    }));
  });

  /* Favourite toggle - Decoupled using CustomEvent */
  card.querySelector('.card-btn-fav').addEventListener('click', e => {
    e.stopPropagation();
    document.dispatchEvent(new CustomEvent('require-auth', {
      detail: {
        action: () => {
          canonical.isFav = !canonical.isFav;
          showToast(canonical.isFav ? '❤️ Marked as Favourite: ' + canonical.title : '🤍 Removed from Favourites: ' + canonical.title, canonical.isFav ? 'red' : '');
          saveToLocalStorage();
          renderFavorites();
          syncMovieCardStates(canonical);
        }
      }
    }));
  });

  card.addEventListener('click', () => openModal(canonical));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(canonical);
    }
  });

  return card;
}

export function renderWatchlist() {
  const row = document.getElementById('watchlistRow');
  const wl  = movies.filter((m, idx) => m.inWatchlist && movies.indexOf(m) === idx);

  if (wl.length === 0) {
    row.innerHTML = '<p class="row-loading">Add movies to your watchlist to see them here.</p>';
    return;
  }

  row.innerHTML = '';
  wl.forEach((movie) => row.appendChild(buildCard(movie)));
}

export function renderFavorites() {
  const row  = document.getElementById('favoritesRow');
  const favs = movies.filter((m, idx) => m.isFav && movies.indexOf(m) === idx);

  if (favs.length === 0) {
    row.innerHTML = '<p class="row-loading">Mark movies as favourite to see them here.</p>';
    return;
  }

  row.innerHTML = '';
  favs.forEach((movie) => row.appendChild(buildCard(movie)));
}

export function renderContinueWatching() {
  const uid = auth.currentUser?.uid;
  const history = uid ? (currentUserData.history || {}) : Storage.get('cv_history', {});
  const items   = Object.values(history).sort((a, b) => b.timestamp - a.timestamp);
  
  // Deduplicate items by title to clean up any existing duplicate entries
  const uniqueItems = [];
  const seenTitles = new Set();
  for (const item of items) {
    if (!seenTitles.has(item.title)) {
      seenTitles.add(item.title);
      uniqueItems.push(item);
    }
  }

  const finalItems = uniqueItems.slice(0, 10);
  const section = document.getElementById('continueSection');
  const row     = document.getElementById('continueRow');

  if (finalItems.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  row.innerHTML = '';
  finalItems.forEach((item) => {
    const card = buildCard(item);
    const bar  = document.createElement('div');
    bar.className = 'continue-progress';
    bar.style.width = item.progress + '%';
    card.querySelector('.card-poster').appendChild(bar);
    row.appendChild(card);
  });
}

export function syncMovieCardStates(movie) {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const m = movies[idx];
    if (m && (m.id === movie.id || m.title === movie.title)) {
      const wlBtn = card.querySelector('.card-btn-wl');
      if (wlBtn) {
        wlBtn.classList.toggle('active', movie.inWatchlist);
        wlBtn.innerHTML = movie.inWatchlist 
          ? '✓ <span class="btn-text">Saved</span>' 
          : '+ <span class="btn-text">Watchlist</span>';
      }
      const favBtn = card.querySelector('.card-btn-fav');
      if (favBtn) {
        favBtn.classList.toggle('active', movie.isFav);
      }
    }
  });

  const heroWatchlistBtn = document.getElementById('heroWatchlist');
  const heroTitleEl = document.querySelector('.hero-title');
  if (heroTitleEl && heroTitleEl.textContent === movie.title) {
    if (heroWatchlistBtn) {
      heroWatchlistBtn.classList.toggle('in-wl', movie.inWatchlist);
      const span = heroWatchlistBtn.querySelector('span');
      if (span) span.textContent = movie.inWatchlist ? 'In Watchlist' : 'Add to Watchlist';
    }
  }

  // Also sync the modal watchlist button if it shows the same movie
  const modalWatchlistBtn = document.getElementById('modalWatchlist');
  const modalTitleEl = document.getElementById('modalTitle');
  if (modalWatchlistBtn && modalTitleEl && modalTitleEl.textContent === movie.title) {
    modalWatchlistBtn.textContent = movie.inWatchlist ? '✓ In Watchlist' : '+ Watchlist';
  }
}

export function openModal(movie, autoPlayTrailer = false) {
  const canonical = getCanonicalMovie(movie);
  const modal = document.getElementById('movieModal');

  document.getElementById('modalTitle').textContent    = canonical.title;
  document.getElementById('modalDesc').textContent     = canonical.desc;
  document.getElementById('modalGenre').textContent    = canonical.genre;
  document.getElementById('modalRating').textContent   = '⭐ ' + (canonical.rating || 0).toFixed(1);
  document.getElementById('modalYear').textContent     = canonical.year || '—';
  document.getElementById('modalRuntime').textContent  = canonical.runtime || '—';
  document.getElementById('modalDirector').textContent = canonical.director || 'Unknown';
  document.getElementById('modalCast').textContent     = canonical.cast || 'Unknown';
  document.getElementById('modalPoster').src           = canonical.poster || '';
  document.getElementById('modalPoster').alt           = canonical.title + ' poster';

  const backdrop = document.getElementById('modalBackdrop');
  backdrop.style.backgroundImage = canonical.backdrop
    ? `url(https://image.tmdb.org/t/p/w1280${canonical.backdrop})`
    : `url(${canonical.poster})`;

  document.getElementById('trailerContainer').classList.remove('show');
  document.getElementById('trailerFrame').src = '';

  const wlBtn = document.getElementById('modalWatchlist');
  wlBtn.textContent = canonical.inWatchlist ? '✓ In Watchlist' : '+ Watchlist';
  wlBtn.onclick = () => {
    document.dispatchEvent(new CustomEvent('require-auth', {
      detail: {
        action: () => {
          canonical.inWatchlist = !canonical.inWatchlist;
          wlBtn.textContent = canonical.inWatchlist ? '✓ In Watchlist' : '+ Watchlist';
          showToast(canonical.inWatchlist ? '✅ Added to Watchlist: ' + canonical.title : '🗑 Removed from Watchlist: ' + canonical.title,
            canonical.inWatchlist ? 'green' : '');
          saveToLocalStorage();
          renderWatchlist();
          syncMovieCardStates(canonical);
        }
      }
    }));
  };

  document.getElementById('modalTrailer').onclick = () => {
    if (canonical.id) {
      loadTrailer(canonical.id);
      trackWatched(canonical);
      renderContinueWatching();
    }
  };

  modal._triggerElement = document.activeElement;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal._currentMovie = canonical;
  if (canonical.id) {
    fetchMovieDetails(canonical.id).then(details => {
      if (details) {
        const directorEl = document.getElementById('modalDirector');
        const castEl = document.getElementById('modalCast');
        const runtimeEl = document.getElementById('modalRuntime');
        const yearEl = document.getElementById('modalYear');
        if (directorEl) directorEl.textContent = details.director;
        if (castEl) castEl.textContent = details.cast;
        if (runtimeEl) runtimeEl.textContent = details.runtime;
        if (yearEl) yearEl.textContent = details.year;
      }
    });
  }

  if (autoPlayTrailer && canonical.id) {
    loadTrailer(canonical.id);
    trackWatched(canonical);
    renderContinueWatching();
  }

  // Shift focus to Close button for focus trap initialization
  setTimeout(() => {
    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) closeBtn.focus();
  }, 50);
}

export function closeModal() {
  const modal = document.getElementById('movieModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('trailerFrame').src = '';
  document.getElementById('trailerContainer').classList.remove('show');
  if (modal._triggerElement) {
    modal._triggerElement.focus();
    modal._triggerElement = null;
  }
}

export function trapFocusInModal(e) {
  const modal = document.getElementById('movieModal');
  if (!modal.classList.contains('open') || e.key !== 'Tab') return;

  const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  // If focus is outside the modal, redirect to first focusable element
  if (!modal.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
    return;
  }

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function filterByGenre(genre) {
  document.querySelectorAll('.category-row .card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const movie = movies[idx];
    const show = genre === 'All' || (movie && movie.genres && movie.genres.includes(genre));
    card.classList.toggle('hidden', !show);
  });
  updateStats(genre);
}

export function sortCards(sortBy) {
  document.querySelectorAll('.category-row').forEach(row => {
    const cards = Array.from(row.querySelectorAll('.card'));

    cards.sort((a, b) => {
      const movieA = movies[parseInt(a.dataset.idx, 10)];
      const movieB = movies[parseInt(b.dataset.idx, 10)];
      if (!movieA || !movieB) return 0;

      if (sortBy === 'rating-high') return movieB.rating - movieA.rating;
      if (sortBy === 'rating-low')  return movieA.rating - movieB.rating;
      if (sortBy === 'title-az')    return movieA.title.localeCompare(movieB.title);
      if (sortBy === 'title-za')    return movieB.title.localeCompare(movieA.title);
      return 0;
    });

    cards.forEach(card => row.appendChild(card));
  });
}
