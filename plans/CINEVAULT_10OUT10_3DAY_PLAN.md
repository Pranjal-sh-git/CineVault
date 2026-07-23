# CineVault — 3-Day "10/10" Hardening Plan
## From Working Demo → Interview-Defensible, Portfolio-Ready App

> Save this file in your CineVault project folder.
> Update checkboxes [ ] → [x] as you complete each step.
> If Antigravity loses context, paste the "Project Context" block at the top of any new session.
>
> **Assumption locked in for this plan:** the manual "Add a Movie" form (poster URL / title / rating fields) is being **removed entirely**. This is the single biggest thing an interviewer flags as "two projects stitched together," and cutting it is the fastest path to a clean story. If you want it back later, it's a separate, smaller task — don't reintroduce it mid-plan.

---

## Project Context (paste this at the start of every Antigravity session)

```
I am hardening CineVault — an existing Netflix-style movie discovery web app —
based on a senior code review. Stack:
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- No React, Vue, Tailwind or Bootstrap
- TMDB API for real movie data
- LocalStorage for watchlist/favorites persistence

My project has these files:
- index.html  → main page structure
- style.css   → all styling
- script.js   → all JavaScript logic
- config.js   → API keys and constants

TMDB constants available globally:
- TMDB_API_KEY → my API key
- BASE_URL     → 'https://api.themoviedb.org/3'
- IMG_BASE_URL → 'https://image.tmdb.org/t/p/w500'

This is a BUG-FIX AND REFACTOR pass, not a new-feature pass. Do not add
features I haven't asked for. Do not remove features I haven't asked
to remove. Preserve all existing working functionality unless a step
explicitly says to change it.

Current Day: Day 1
Current Step: Day 1 Complete

Progress:
DAY 1 — Fix Critical Data & State Bugs
- [x] Step 1 — Remove manual "Add a Movie" form
- [x] Step 2 — Fix duplicate movies across category rows
- [x] Step 3 — Fix multi-genre support
- [x] Step 4 — Make filter chips data-driven, not DOM-driven
- [x] Step 5 — Make sort data-driven, not DOM-driven
- [x] Step 6 — Day 1 full validation

DAY 2 — Fix Feature Integrity & Missing Practices
- [x] Step 1 — Unify localStorage into one persistence helper
- [x] Step 2 — Fix Continue Watching (real trigger, honest progress)
- [x] Step 3 — Add in-memory cache for movie details/credits
- [x] Step 4 — Accessibility pass (aria-labels, modal focus trap)
- [x] Step 5 — Day 2 full validation

DAY 3 — Code Organization, Docs, Deploy
- [x] Step 1 — Split script.js into ES modules
- [x] Step 2 — Write README.md
- [x] Step 3 — Lighthouse audit + fixes
- [ ] Step 4 — Final QA checklist
- [ ] Step 5 — Deploy to Netlify
```

---
---

# DAY 1 — Fix Critical Data & State Bugs

**Goal:** Eliminate the bugs and anti-patterns an interviewer finds first — duplicate movies inflating your stats, genre filtering silently missing movies, and filter/sort reading from the DOM instead of your actual data.

---

## Day 1 — Step 1: Remove Manual "Add a Movie" Form
**Status: ✅ DONE**

### What this does:
Removes the leftover manual-entry feature (random genre/description assigned to user-typed movies) that clashes with the rest of the app being real TMDB data. This is the #1 thing flagged in review.

### Key concepts:
- Dead code removal — deleting cleanly beats leaving disabled code behind
- Single data source — after this, every movie in `movies[]` comes from TMDB, no more fake genres/descriptions

### Antigravity Prompt:
```
In my CineVault project, remove the manual "Add a Movie" feature completely:

1. In index.html, delete the entire #formDiv element (the form with
   Movie Poster URL, Movie Title, and IMDb Rating inputs, and the
   #submit button). Also remove #emptyState and #noResults divs from
   inside #cardDiv, and remove #cardDiv's section heading "My Collection"
   along with #cardDiv itself, since it only displayed manually-added movies.

2. In style.css, you can leave the #formDiv, .field-group, and #submit
   styles in place for now (dead CSS is lower priority, we'll clean it
   in Day 3) — do NOT delete CSS in this step.

3. In script.js, remove:
   - The handleClick() function entirely
   - The `var btn = document.getElementById("submit"); btn.addEventListener("click", handleClick);` line
   - The `document.querySelectorAll('#formDiv input').forEach(...)` Enter-key block
   - The `genres` and `descs` arrays (only used by the manual form)

4. In index.html, adjust the #container layout: since #formDiv is gone,
   #rightCol should now take the full width of #container instead of
   sharing space with a 300px sidebar.

Do not change any other functionality — TMDB rows, search, watchlist,
favorites, modal must all keep working exactly as before.
```

### Validation:
Refresh page. Expected:
```
[ ] No "Add a Movie" form visible anywhere
[ ] No console errors on page load
[ ] Trending/Top Rated/Action/Comedy/Sci-Fi rows still render
[ ] Search, watchlist, favorites still work
[ ] Page layout doesn't look broken/lopsided where the form used to be
```

---

## Day 1 — Step 2: Fix Duplicate Movies Across Category Rows
**Status: ✅ DONE**

### What this does:
Right now, a movie that appears in both "Trending" and "Top Rated" (very common) gets pushed into `movies[]` twice, as two separate objects. This silently breaks your Average/Highest/Lowest Rating stats — they're currently double-counting movies. This fix makes `movies[]` deduplicated by TMDB `id`.

### Key concepts:
- Deduplication by unique ID, not by object reference
- `Array.prototype.some()` for existence checks
- Why "it looks fine visually" doesn't mean the data is correct

### Antigravity Prompt:
```
In my CineVault project, open script.js and find the loadCategory()
function. Inside the rawMovies.forEach(...) loop, change this:

  rawMovies.forEach(raw => {
    const movie = mapTmdbMovie(raw);
    movies.push(movie);
    container.appendChild(buildCard(movie, movies.length - 1));
  });

to this:

  rawMovies.forEach(raw => {
    const movie = mapTmdbMovie(raw);
    const existing = movies.find(m => m.id === movie.id);
    if (existing) {
      container.appendChild(buildCard(existing, movies.indexOf(existing)));
    } else {
      movies.push(movie);
      container.appendChild(buildCard(movie, movies.length - 1));
    }
  });

This makes sure a movie appearing in multiple TMDB categories (e.g.
trending AND top rated) is only stored once in the movies array, but
still visually appears in every row it belongs in — and reuses the
SAME object so watchlist/favorite state stays in sync across rows.

Do not change anything else in loadCategory or any other function.
```

### Validation:
```
[ ] Open a movie that appears in both Trending and Top Rated rows
[ ] Add it to Watchlist from the Trending row card
[ ] Scroll to the Top Rated row — the SAME movie should now also show "✓ Saved"
[ ] Check stat-total in the stats bar — it should be LOWER than before
    (no more counting the same movie twice)
```
This last check matters — if `stat-total` didn't change, the fix didn't take.

---

## Day 1 — Step 3: Fix Multi-Genre Support
**Status: ✅ DONE**

### What this does:
`mapTmdbMovie` currently only reads `genre_ids[0]` — the FIRST genre TMDB assigns. A movie tagged `[Comedy, Romance]` gets filed only under whatever TMDB lists first, so your "Comedy" filter chip can silently miss real comedies. This fix stores all genres and checks against all of them.

### Key concepts:
- One-to-many relationships (a movie can have multiple genres)
- Why storing an array now avoids a bigger rewrite later
- Backward compatibility — keep `genre` (singular, for badges) AND add `genres` (plural, for filtering)

### Antigravity Prompt:
```
In my CineVault project, open script.js and find the mapTmdbMovie()
function. Update it to also store all genre names as an array,
keeping the existing single `genre` field unchanged (it's used for
the badge display and must keep working):

function mapTmdbMovie(tmdbMovie) {
  const genreNames = (tmdbMovie.genre_ids || [])
    .map(id => TMDB_GENRE_MAP[id])
    .filter(Boolean);

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || 'Unknown',
    rating: tmdbMovie.vote_average || 0,
    poster: tmdbMovie.poster_path ? IMG_BASE_URL + tmdbMovie.poster_path : '',
    genre: genreNames[0] || 'Drama',
    genres: genreNames.length ? genreNames : ['Drama'],
    desc: tmdbMovie.overview || 'No description available.',
    inWatchlist: false,
    isFav: false
  };
}

Do not change anything else in this function or any other function yet
— the filter logic itself gets updated in the next step.
```

### Validation:
Console → paste → Enter:
```javascript
fetchMovies('/trending/movie/week?').then(data => console.log(mapTmdbMovie(data[0]).genres))
```
Expected: an array with one or more genre names, e.g. `["Action", "Adventure"]` ✅

---

## Day 1 — Step 4: Make Filter Chips Data-Driven, Not DOM-Driven
**Status: ✅ DONE**

### What this does:
This is the core architectural fix from the review. `filterByGenre` currently reads genre text back out of rendered `.genre-badge` elements in the DOM. Now that we store `movie.genres` as real data, filtering should check the actual data, and support the multi-genre fix from Step 3.

### Key concepts:
- Single source of truth — the `movies` array, not the rendered page
- Why reading state from the DOM is fragile (breaks the moment rendering logic changes)

### Antigravity Prompt:
```
In my CineVault project, open script.js and find the filterByGenre()
function. Replace it with this version, which checks each card's
underlying movie data (via its data-idx attribute) instead of reading
badge text from the DOM:

function filterByGenre(genre) {
  document.querySelectorAll('.category-row .card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const movie = movies[idx];
    const show = genre === 'All' || (movie && movie.genres && movie.genres.includes(genre));
    card.classList.toggle('hidden', !show);
  });
}

Do not change genreChips event listener or any other function.
```

### Validation:
```
[ ] Click "Comedy" chip
[ ] Confirm every visible card is actually a comedy (check a few via
    the modal) — including ones where Comedy might not have been the
    FIRST genre listed
[ ] Click "All" — everything reappears
```

---

## Day 1 — Step 5: Make Sort Data-Driven, Not DOM-Driven
**Status: ✅ DONE**

### What this does:
`sortCards` currently reorders DOM nodes directly by reading `.textContent` off rendered badges — it never touches the `movies` array, so your data and your visual order can silently disagree. This rewrites it to sort real movie objects and re-render from that.

### Key concepts:
- Re-render from sorted data instead of physically moving existing DOM nodes
- Keeping the array and the screen in agreement at all times

### Antigravity Prompt:
```
In my CineVault project, open script.js and find the sortCards()
function. Replace it with this version, which reads movie.rating and
movie.title directly from the movies array (via each card's data-idx)
instead of parsing text out of rendered badges:

function sortCards(sortBy) {
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

Do not change the sortSelect event listener or any other function.
```

### Validation:
```
[ ] Select "Highest Rated" from the sort dropdown
[ ] Confirm the first card in each row genuinely has the highest
    rating number shown on its badge
[ ] Select "Title A–Z" — confirm alphabetical order is correct
```

---

## Day 1 — Full Validation Checklist
**Status: ✅ DONE**

```
[ ] Manual "Add a Movie" form is completely gone, no console errors
[ ] A movie appearing in 2+ rows only counts ONCE in the stats bar
[ ] Watchlist/favorite toggles stay in sync across rows for shared movies
[ ] Genre chips correctly include movies where that genre isn't TMDB's first-listed one
[ ] Sort dropdown produces genuinely correct order, verified by checking actual numbers/titles
[ ] All existing features (search, modal, trailer, carousels) still work
```

**Do not move to Day 2 until every box above is checked.** These are the fixes that directly address what a reviewer finds first.

---
---

# DAY 2 — Fix Feature Integrity & Missing Practices

**Goal:** Remove the remaining things that read as "fake" or sloppy under questioning — scattered localStorage logic, a Continue Watching bar that fires on every click and shows random progress, no request caching, and missing accessibility basics.

---

## Day 2 — Step 1: Unify LocalStorage Into One Persistence Helper
**Status: ✅ DONE**

### What this does:
Right now, `cv_watchlist`, `cv_favs`, and `cv_history` are each read/written with separate, duplicated `JSON.parse(localStorage.getItem(...) || '...')` boilerplate scattered across different functions. This introduces one small helper so every read/write goes through the same safe path — including handling corrupted localStorage data gracefully.

### Key concepts:
- DRY (Don't Repeat Yourself) applied to persistence code
- Defensive coding — malformed JSON in localStorage shouldn't crash the app
- Single point of change if the storage strategy ever changes (e.g. to IndexedDB)

### Antigravity Prompt:
```
In my CineVault project, open script.js and add this helper near the
top of the file, right after the TMDB_GENRE_MAP definition:

const Storage = {
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

Then update every existing place that reads or writes cv_watchlist,
cv_favs, or cv_history to use Storage.get/Storage.set instead of
calling localStorage and JSON.parse/JSON.stringify directly. For example:

  const savedWL = JSON.parse(localStorage.getItem('cv_watchlist') || '[]');

becomes:

  const savedWL = Storage.get('cv_watchlist', []);

and:

  localStorage.setItem('cv_watchlist', JSON.stringify(watchlist));

becomes:

  Storage.set('cv_watchlist', watchlist);

Apply this same pattern to saveToLocalStorage(), the loadFromLocalStorage
IIFE, trackWatched(), and renderContinueWatching(). Do not change any
other logic in these functions — only the storage read/write calls.
```

### Validation:
```
[ ] Add a movie to watchlist, refresh page — it's still there
[ ] Open DevTools → Application → Local Storage → confirm cv_watchlist,
    cv_favs, cv_history are still present and correctly formatted
[ ] In console, run: localStorage.setItem('cv_watchlist', 'not valid json{')
    then refresh the page — app should NOT crash, just show an empty watchlist
```

---

## Day 2 — Step 2: Fix Continue Watching (Real Trigger, Honest Progress)
**Status: ✅ DONE**

### What this does:
Two problems: (1) `trackWatched()` fires on EVERY modal open, even if the user just glanced at a movie and closed it — so "Continue Watching" fills up misleadingly fast; (2) the progress bar is `Math.random()`, presented as if it were real playback progress. This step ties tracking to a real signal (clicking "Watch Trailer," which is an actual engagement action) and reframes progress honestly.

### Key concepts:
- Tracking real user intent signals instead of passive events
- Being honest about simulated data instead of dressing it up as real
- Small UX copy changes that prevent a feature from looking fake

### Antigravity Prompt:
```
In my CineVault project, open script.js:

1. Find the openModal() function and DELETE this line from inside it:
   trackWatched(movie);

2. Find the modalTrailer click handler inside openModal():
   document.getElementById('modalTrailer').onclick = () => {
     if (movie.id) loadTrailer(movie.id);
   };

   Change it to also call trackWatched when the user actually plays
   a trailer (a real signal of intent to watch), not just opening the modal:
   document.getElementById('modalTrailer').onclick = () => {
     if (movie.id) {
       loadTrailer(movie.id);
       trackWatched(movie);
     }
   };

3. Find the trackWatched() function and rename the "progress" field to
   make it clear it's a simulated engagement indicator, not real playback
   position. Update it to grow slightly each time the same movie is
   re-engaged with, capped at 90%, instead of being fully random:

function trackWatched(movie) {
  const history = Storage.get('cv_history', {});
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
  Storage.set('cv_history', history);
  renderContinueWatching();
}

Do not change renderContinueWatching() or any other function.
```

### Validation:
```
[ ] Open a movie modal and close it WITHOUT clicking "Watch Trailer" —
    confirm it does NOT appear in Continue Watching
[ ] Open the same movie and click "Watch Trailer" — confirm it NOW
    appears in Continue Watching with a visible progress bar
[ ] Repeat "Watch Trailer" on the same movie again — confirm the
    progress bar grows, rather than jumping to a new random number
```

---

## Day 2 — Step 3: Add In-Memory Cache for Movie Details/Credits
**Status: ✅ DONE**

### What this does:
Right now, reopening the modal for the same movie re-fetches details and credits from TMDB every single time. This adds a simple in-memory cache so repeat opens are instant and don't waste API calls.

### Key concepts:
- Caching by unique key (movie ID)
- `Map` as a lightweight cache — no library needed
- Cache invalidation isn't a concern here since movie details don't change during a session

### Antigravity Prompt:
```
In my CineVault project, open script.js and add this near the top,
after the Storage helper:

const movieDetailsCache = new Map();

Then find the fetchMovieDetails() function and update it to check the
cache first, and store results in the cache after a successful fetch:

async function fetchMovieDetails(movieId) {
  if (movieDetailsCache.has(movieId)) {
    const cached = movieDetailsCache.get(movieId);
    document.getElementById('modalDirector').textContent = cached.director;
    document.getElementById('modalCast').textContent     = cached.cast;
    document.getElementById('modalRuntime').textContent  = cached.runtime;
    document.getElementById('modalYear').textContent     = cached.year;
    return cached;
  }

  try {
    const [details, credits] = await Promise.all([
      fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json())
    ]);

    const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';
    const cast = credits.cast?.slice(0, 4).map(p => p.name).join(', ') || 'Unknown';
    const runtime = details.runtime ? `${Math.floor(details.runtime/60)}h ${details.runtime%60}m` : '—';
    const year = details.release_date ? details.release_date.split('-')[0] : '—';

    document.getElementById('modalDirector').textContent = director;
    document.getElementById('modalCast').textContent     = cast;
    document.getElementById('modalRuntime').textContent  = runtime;
    document.getElementById('modalYear').textContent     = year;

    const result = { director, cast, runtime, year, backdropPath: details.backdrop_path };
    movieDetailsCache.set(movieId, result);
    return result;
  } catch (err) {
    console.error('fetchMovieDetails failed:', err);
  }
}

Do not change any other function.
```

### Validation:
```
[ ] Open Network tab in DevTools
[ ] Open a movie's modal — confirm /movie/{id} and /movie/{id}/credits
    requests fire
[ ] Close modal, open the SAME movie again — confirm NO new network
    requests fire, but director/cast/runtime/year still populate correctly
```

---

## Day 2 — Step 4: Accessibility Pass
**Status: ✅ DONE**

### What this does:
Adds `aria-label` to icon-only buttons (the ♥ favorite button currently has none) and a basic focus trap to the movie modal so keyboard users can't Tab out of it while it's open — both are cheap, concrete wins reviewers notice.

### Key concepts:
- `aria-label` for buttons whose visible content is a symbol, not text
- Focus trapping — keeping keyboard focus inside an open modal
- Why this matters even for a portfolio piece: it signals you think about more than sighted-mouse users

### Antigravity Prompt:
```
In my CineVault project:

1. In script.js, find the buildCard() function. Update the favourite
   button's HTML to include an aria-label:

   Change:
   <button class="card-btn card-btn-fav ${movie.isFav ? 'active' : ''}" title="Favourite">♥</button>

   To:
   <button class="card-btn card-btn-fav ${movie.isFav ? 'active' : ''}" title="Favourite" aria-label="Toggle favourite for ${movie.title}">♥</button>

2. In index.html, find the #movieModal element and confirm it has
   aria-labelledby="modalTitle" added alongside its existing
   role="dialog" aria-modal="true":

   <div id="movieModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">

3. In script.js, add this simple focus trap right after the closeModal()
   function definition:

function trapFocusInModal(e) {
  const modal = document.getElementById('movieModal');
  if (!modal.classList.contains('open') || e.key !== 'Tab') return;

  const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

document.addEventListener('keydown', trapFocusInModal);

Do not change any other function or remove any existing event listeners.
```

### Validation:
```
[ ] Open a movie modal, press Tab repeatedly — focus should cycle
    within the modal's buttons/elements, never escape to the page behind it
[ ] Press Shift+Tab from the first focusable element — focus should
    wrap to the last one
[ ] Inspect a favourite button in DevTools — confirm aria-label is present
    with the correct movie title
```

---

## Day 2 — Full Validation Checklist
**Status: ✅ DONE**

```
[x] All localStorage reads/writes go through Storage.get/Storage.set
[x] Corrupted localStorage doesn't crash the app
[x] Continue Watching only appears after real engagement (Watch Trailer), not passive modal opens
[x] Continue Watching progress grows on repeat engagement instead of randomizing
[x] Reopening the same movie's modal makes zero new network requests
[x] Favourite buttons have descriptive aria-labels
[x] Tab key cannot escape an open modal
```

---
---

# DAY 3 — Code Organization, Docs, Deploy

**Goal:** Fix the thing a recruiter sees before they read a single line of logic — repo structure — and ship it live with a documented, defensible setup.

---

## Day 3 — Step 1: Split script.js Into ES Modules
**Status: ✅ DONE**

### What this does:
682 lines in one file is the single biggest "hasn't organized code as it scaled" signal in a repo skim. This splits script.js into focused modules using native ES modules (no bundler needed — Netlify serves static files, and modern browsers support `<script type="module">` natively).

### Key concepts:
- ES modules (`import`/`export`) — native browser support, zero build tooling required
- Separation of concerns: API calls vs. state/data vs. rendering vs. event wiring
- Why this doesn't need Webpack/Vite for a project this size

### Antigravity Prompt:
```
In my CineVault project, split script.js into 4 ES modules inside a
new /js folder, WITHOUT changing any function's behavior — this is a
pure reorganization, not a rewrite:

1. Create /js/api.js — move these functions here, and export each one:
   fetchMovies, mapTmdbMovie, TMDB_GENRE_MAP, fetchMovieDetails,
   loadTrailer, movieDetailsCache
   (these need `import { TMDB_API_KEY, BASE_URL, IMG_BASE_URL } from '../config.js';`
   at the top — also convert config.js to export these three constants
   with `export const` instead of plain `const`)

2. Create /js/state.js — move these here, and export each one:
   movies, heroInWatchlist, activeGenre, Storage, saveToLocalStorage,
   trackWatched
   (import fetchMovies/mapTmdbMovie from './api.js' where needed)

3. Create /js/render.js — move these here, and export each one:
   buildCard, updateStats, ratingClass, starSVG, renderWatchlist,
   renderFavorites, renderContinueWatching, openModal, closeModal,
   trapFocusInModal, filterByGenre, sortCards, filterCards, showToast
   (import from './state.js' and './api.js' as needed)

4. Create /js/main.js — this is the entry point. Move here:
   all the loadCategory calls, all addEventListener wiring for navbar,
   search overlay, genre chips, sort dropdown, carousel buttons, modal
   close handlers, hero buttons, and the loadFromLocalStorage IIFE and
   loadCategory function itself.
   Import whatever it needs from the other three files.

5. In index.html, replace:
   <script src="script.js" defer></script>
   with:
   <script type="module" src="js/main.js"></script>

   And update the config.js script tag to also be a module if needed,
   or keep config.js's exports compatible with ES module imports.

After this split, the app must work IDENTICALLY to before — same
features, same behavior, zero functional changes. This is purely
moving code into organized files and wiring imports/exports correctly.
```

### Validation:
```
[ ] Open DevTools Console — zero errors on page load
[ ] Every feature from Day 1 and Day 2 validation checklists still works:
    trending rows, search, modal, trailer, watchlist, favorites,
    genre filter, sort, continue watching, focus trap
[ ] Confirm file structure now looks like:
    /js/api.js, /js/state.js, /js/render.js, /js/main.js
    index.html, style.css, config.js
```

---

## Day 3 — Step 2: Write README.md
**Status: ✅ DONE**

### What this does:
Often the FIRST thing a recruiter or interviewer reads — before any code. A good README signals professionalism disproportionate to how long it takes to write.

### Antigravity Prompt:
```
In my CineVault project root, create a README.md with these sections:

# CineVault
One-paragraph pitch: a Netflix-style movie discovery app built with
vanilla JS and the TMDB API, featuring live trending/top-rated/genre
browsing, search, a details modal with trailers, and a
localStorage-backed watchlist/favorites system.

## Live Demo
[link — fill in after Day 3 Step 5 deployment]

## Features
- Real-time TMDB data across 5 categories
- Debounced live search with stale-response protection
- Movie details modal with cached director/cast/runtime lookups
- Genre filtering and multi-field sorting
- Persistent watchlist and favorites via localStorage
- Continue Watching driven by real trailer-play engagement

## Tech Stack
Vanilla HTML5, CSS3, JavaScript (ES6 modules) — no framework, no
build step. TMDB API for data.

## Architecture
Brief note: /js/api.js (TMDB calls + data mapping), /js/state.js
(app state + persistence), /js/render.js (DOM building + UI updates),
/js/main.js (event wiring + entry point).

## Setup
1. Clone the repo
2. Get a free TMDB API key at themoviedb.org
3. Add it to config.js
4. Open index.html in a browser (or serve via any static server)

## Known Limitations
- No pagination (first 20 results per category)
- No backend — API key is client-visible (standard for TMDB's v3 key type)

Do not change any project files other than creating README.md.
```

### Validation:
```
[ ] README.md exists in project root
[ ] Renders cleanly on GitHub (check formatting once pushed)
```

---

## Day 3 — Step 3: Lighthouse Audit + Fixes
**Status: ✅ DONE**

### How to run:
1. Open CineVault in Chrome
2. F12 → Lighthouse tab
3. Select: Performance, Accessibility, Best Practices, SEO
4. Device: Mobile
5. Click "Analyze page load"

### Target scores:
- Performance: 75+
- Accessibility: 90+ (the Day 2 accessibility pass should help here)
- Best Practices: 90+
- SEO: 85+

### Common fixes prompt (only if scores are low):
```
In my CineVault project, my Lighthouse audit shows these issues:
[paste your specific issues here]

Please fix only these specific issues without breaking any existing
features or the module structure from Day 3 Step 1.
My files are index.html, style.css, config.js, and /js/api.js,
/js/state.js, /js/render.js, /js/main.js.
```

### Validation:
```
[ ] All 4 scores meet or exceed targets above
[ ] Screenshot the results for your portfolio/resume
```

---

## Day 3 — Step 4: Final QA Checklist
**Status: ⬜ TODO**

```
DAY 1 FIXES
[ ] Manual add form removed, no dead functionality left wired up
[ ] Shared movies across rows counted once, stats bar accurate
[ ] Multi-genre movies correctly appear under every matching filter chip
[ ] Sort and filter verified against real data, not just visual guessing

DAY 2 FIXES
[ ] All persistence goes through Storage.get/Storage.set
[ ] Continue Watching only populates from real trailer-play engagement
[ ] Repeat modal opens for the same movie hit zero network requests
[ ] Modal traps Tab focus; favourite buttons have aria-labels

DAY 3 FIXES
[ ] Code lives in /js/api.js, /js/state.js, /js/render.js, /js/main.js
[ ] README.md is accurate and complete
[ ] Lighthouse targets met
[ ] Test on an actual phone browser, not just DevTools device mode
```

---

## Day 3 — Step 5: Deploy to Netlify
**Status: ⬜ TODO**

### Deployment steps (no Antigravity needed):

**Option A — Netlify Drag and Drop (easiest):**
1. Go to netlify.com → Log in → Sites
2. Drag your entire CineVault project folder onto the deploy area
3. Netlify gives you a URL like `cinevault-abc123.netlify.app`
4. Rename it in Site Settings → change to `cinevault.netlify.app`

**Option B — GitHub + Netlify (professional, recommended):**
1. Push project to GitHub
2. netlify.com → Add new site → Import from Git → select your repo
3. Build command: leave empty (no build step needed — ES modules run natively)
4. Publish directory: `/` (root)
5. Deploy — auto-deploys on every git push

### Important before deploying:
- TMDB's v3 API key is designed for client-side use — this is expected,
  not a security hole, but you should be able to say so if asked
- Add your Netlify domain to TMDB's allowed domains in your API dashboard settings if such an option is available to you

### Validation:
```
[ ] Site loads at your Netlify URL
[ ] All category rows load with real data
[ ] Modal, trailer, watchlist, favorites, search, filter, sort all work live
[ ] Continue Watching persists across a refresh
[ ] Works on your actual phone browser
[ ] Add the live link to your README.md
```

---

## If Something Breaks (Emergency Prompt)

Paste this into Antigravity with your specific error:

```
I am hardening CineVault — a vanilla JS/HTML/CSS movie app using
TMDB — following a 3-day fix plan. No React or frameworks.

Files: index.html, style.css, config.js, /js/api.js, /js/state.js,
/js/render.js, /js/main.js (or script.js if not yet split)

After completing [DAY X STEP Y], this broke: [describe the issue]

Console error: [paste exact error message]

Please fix ONLY this specific issue. Do not refactor or change
anything that is already working.
```

---

*CineVault 3-Day "10/10" Plan — Keep this file in your project folder*
*Update checkboxes as you complete each step*
