# CineVault — Complete 5-Day Implementation Plan
## From Basic Movie Manager → Netflix-Style Premium App

> Save this file in your CineVault project folder.
> Update checkboxes [ ] → [x] as you complete each step.
> If Antigravity loses context, paste the "Project Context" block at the top of any new session.

---

## Project Context (paste this at the start of every Antigravity session)

```
I am building CineVault — a Netflix-style movie discovery web app using:
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

Current Day: [UPDATE THIS]
Current Step: [UPDATE THIS]

Progress:
DAY 1 - TMDB Integration
- [✔️] Step 1 — config.js created
- [✔️] Step 2 — fetchMovies() added
- [✔️] Step 3 — mapTmdbMovie() added
- [✔️] Step 4 — Trending row renders
- [✔️] Step 5 — All 5 category rows render
- [✔️] Step 6 — Loading and error states
- [✔️] Step 7 — Day 1 full validation

DAY 2 - Horizontal Scroll Carousels
- [x] Step 1 — Category row HTML structure
- [x] Step 2 — Carousel CSS with scroll snap
- [x] Step 3 — Arrow navigation buttons
- [x] Step 4 — Arrow show/hide on hover
- [x] Step 5 — Day 2 full validation

DAY 3 - Movie Modal & Trailers
- [x] Step 1 — Modal HTML structure
- [x] Step 2 — Modal CSS styling
- [x] Step 3 — Open modal on card click
- [x] Step 4 — Fetch movie details from TMDB
- [x] Step 5 — Fetch and embed trailer
- [x] Step 6 — Close modal (ESC + backdrop click)
- [x] Step 7 — Day 3 full validation

DAY 4 - Filters, Sorting, Watchlist & Favorites
- [x] Step 1 — Genre filter chips HTML + CSS
- [x] Step 2 — Filter logic in JavaScript
- [x] Step 3 — Sort dropdown HTML + CSS
- [x] Step 4 — Sort logic in JavaScript
- [x] Step 5 — Watchlist section with LocalStorage
- [x] Step 6 — Favorites section with LocalStorage
- [x] Step 7 — Day 4 full validation

DAY 5 - Polish & Final QA
- [x] Step 1 — Skeleton loading cards
- [x] Step 2 — Lazy image loading with fade-in
- [x] Step 3 — Continue Watching section
- [x] Step 4 — Responsive design pass
- [ ] Step 5 — Final Lighthouse audit
- [ ] Step 6 — Deploy to Netlify
```

---
---

# DAY 1 — TMDB Integration & Real Movie Data

**Goal:** Replace manual movie adding with live TMDB data across 5 category rows.

---

## Day 1 — Step 0: Get TMDB API Key
**Status: ✅ DONE**

- Signed up at themoviedb.org
- Selected Personal Use → Developer Plan
- Application Name: CineVault
- API key obtained and saved safely

---

## Day 1 — Step 1: Create config.js
**Status: ✅ DONE**

### What this does:
Stores API key and base URLs in one place. If key ever changes,
update one file — not 20 places. Real companies use .env files
for this. config.js is our vanilla JS equivalent.

### Antigravity Prompt:
```
I have a movie app called CineVault with 3 files: index.html, style.css, script.js.

Create a new file called config.js with these 3 constants:

const TMDB_API_KEY = 'YOUR_KEY_HERE';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

Then in index.html, add a script tag for config.js in the <head> section,
BEFORE the script tag for script.js so the constants are available globally.

Do not change anything else.
```

### Validation:
F12 → Console → type `TMDB_API_KEY` → Enter
Expected: your API key string prints ✅

---

## Day 1 — Step 2: Add fetchMovies() Function
**Status: ✅ DONE**

### What this does:
A reusable async function that sends HTTP requests to TMDB and returns
movie data. try/catch ensures app never crashes if network fails.

### Key concepts:
- async/await → waits for network before continuing
- response.ok → checks request actually succeeded
- try/catch → handles network failures gracefully
- data.results || [] → safe fallback if response is unexpected

### Antigravity Prompt:
```
In my CineVault project, open script.js and add this async function
at the very top of the file, before any existing code:

async function fetchMovies(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}&language=en-US`);
    if (!response.ok) throw new Error('API error: ' + response.status);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('fetchMovies failed:', error);
    return [];
  }
}

Do not change anything else in script.js.
```

### Validation:
Console → paste → Enter:
```javascript
fetchMovies('/trending/movie/week?').then(data => console.log(data))
```
Expected: Array of 20 movie objects ✅

---

## Day 1 — Step 3: Add mapTmdbMovie() Function
**Status: ⬜ IN PROGRESS**

### What this does:
TMDB sends data in its own shape. Our buildCard() expects a different
shape. mapTmdbMovie() translates between the two — this pattern is
called a "data transformer" or "adapter."

### Key concepts:
- Data mapping → converting one shape to another
- Optional chaining (?.) → safely accessing nested properties
- Fallback values (||) → preventing crashes on missing data
- Genre ID map → TMDB sends numbers, we show readable names

### Antigravity Prompt:
```
In my CineVault project, open script.js and add this code
right after the fetchMovies function:

const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation',
  35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy',
  36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War',
  37: 'Western'
};

function mapTmdbMovie(tmdbMovie) {
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || 'Unknown',
    rating: tmdbMovie.vote_average || 0,
    poster: tmdbMovie.poster_path ? IMG_BASE_URL + tmdbMovie.poster_path : '',
    genre: TMDB_GENRE_MAP[tmdbMovie.genre_ids?.[0]] || 'Drama',
    desc: tmdbMovie.overview || 'No description available.',
    inWatchlist: false,
    isFav: false
  };
}

Do not change anything else.
```

### Validation:
Console → paste → Enter:
```javascript
fetchMovies('/trending/movie/week?').then(data => console.log(mapTmdbMovie(data[0])))
```
Expected: Clean object with title, rating, poster URL, genre, desc ✅

---

## Day 1 — Step 4: Render Trending Row
**Status: ⬜ TODO**

### What this does:
Creates the first live movie row on the page. Tests that fetch →
map → render pipeline works end to end before wiring all 5 rows.

### Key concepts:
- DOM manipulation → creating elements and appending dynamically
- async on page load → fetching data when page first opens
- Pipeline pattern → fetch → map → render as separate steps
- Clearing container → prevents duplicate cards on re-render

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, find the section heading with id="trending" and
   add a container div immediately after it:
   <div class="category-row" id="trendingRow"></div>

2. In script.js, add this function after mapTmdbMovie:

async function loadCategory(endpoint, sectionId) {
  const container = document.getElementById(sectionId);
  if (!container) return;

  container.innerHTML = '<p class="row-loading">Loading…</p>';

  const rawMovies = await fetchMovies(endpoint);

  if (rawMovies.length === 0) {
    container.innerHTML = '<p class="row-error">Unable to load movies. Check your connection.</p>';
    return;
  }

  container.innerHTML = '';
  rawMovies.forEach(raw => {
    const movie = mapTmdbMovie(raw);
    movies.push(movie);
    container.appendChild(buildCard(movie, movies.length - 1));
  });
}

3. At the bottom of script.js, after all existing code, add:
   loadCategory('/trending/movie/week?', 'trendingRow');

Do not change anything else.
```

### Validation:
Refresh page.
Expected: Real TMDB movie posters appear under Trending heading ✅

---

## Day 1 — Step 5: Add All 5 Category Rows
**Status: ⬜ TODO**

### What this does:
Reuses loadCategory to power 4 more rows. One function, 5 uses —
this is the DRY principle (Don't Repeat Yourself) in action.

### TMDB Genre IDs reference:
Action=28, Comedy=35, Sci-Fi=878, Horror=27, Romance=10749, Thriller=53

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, add these container divs after their section headings:

   After id="toprated" heading:
   <div class="category-row" id="topratedRow"></div>

   After action section heading:
   <div class="category-row" id="actionRow"></div>

   After comedy section heading:
   <div class="category-row" id="comedyRow"></div>

   After sci-fi section heading:
   <div class="category-row" id="scifiRow"></div>

2. In script.js, replace the single loadCategory call at the bottom
   with all 5 calls:

loadCategory('/trending/movie/week?', 'trendingRow');
loadCategory('/movie/top_rated?', 'topratedRow');
loadCategory('/discover/movie?with_genres=28&', 'actionRow');
loadCategory('/discover/movie?with_genres=35&', 'comedyRow');
loadCategory('/discover/movie?with_genres=878&', 'scifiRow');

Do not change anything else.
```

### Validation:
Refresh page.
Expected: 5 rows with different movies appropriate to each category ✅

---

## Day 1 — Step 6: Loading & Error State Styles
**Status: ⬜ TODO**

### What this does:
Adds CSS so the loading/error messages look polished instead of
plain browser text. Small detail, big difference in quality.

### Antigravity Prompt:
```
In my CineVault project, open style.css and add at the end of the file:

.row-loading,
.row-error {
  padding: 24px 16px;
  font-size: 0.875rem;
  color: #888;
  letter-spacing: 0.05em;
}

.row-error {
  color: #e74c3c;
}

.category-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 4px 16px;
  scrollbar-width: none;
}

.category-row::-webkit-scrollbar {
  display: none;
}

Do not change anything else.
```

### Validation:
Temporarily change TMDB_API_KEY to 'invalid' → refresh.
Expected: Friendly error message in each row, no crash.
Restore real key after testing ✅

---

## Day 1 — Step 7: Full Validation Checklist
**Status: ⬜ TODO**

```
[ ] All 5 rows show real movies with posters
[ ] Cards show correct titles, ratings, genre badges
[ ] Watchlist toggle works on TMDB cards
[ ] Favourite toggle works on TMDB cards
[ ] Stats bar Total Movies count updates
[ ] Search overlay finds TMDB movies by title
[ ] Hero buttons still work
[ ] No red errors in console (favicon 404 is fine)
```

---
---

# DAY 2 — Horizontal Scroll Carousels

**Goal:** Convert flat card rows into Netflix-style horizontal scroll
carousels with left/right arrow navigation and scroll snap.

---

## Day 2 — Step 1: Carousel HTML Structure
**Status: ⬜ TODO**

### What this does:
Wraps each category row inside a carousel container that has previous
and next arrow buttons. The structure: section → carousel wrapper →
arrow left, cards row, arrow right.

### Key concepts:
- Semantic HTML → meaningful structure, not just divs
- Wrapper pattern → parent controls overflow, child scrolls
- Button placement → positioned absolutely over the row edges

### Antigravity Prompt:
```
In my CineVault project, update index.html.

For each of the 5 category sections (trending, toprated, action,
comedy, scifi), wrap the existing category-row div inside a carousel
wrapper like this pattern:

<div class="carousel-wrapper">
  <button class="carousel-btn carousel-btn-left" aria-label="Scroll left">&#8249;</button>
  <div class="category-row" id="trendingRow"></div>
  <button class="carousel-btn carousel-btn-right" aria-label="Scroll right">&#8250;</button>
</div>

Do this for all 5 rows. Do not change anything else.
```

### Validation:
Refresh page. Arrow buttons should be visible on each row ✅

---

## Day 2 — Step 2: Carousel CSS
**Status: ✅ DONE**

### What this does:
Styles the carousel wrapper, hides scrollbar, adds scroll snap so
cards snap into place like Netflix, and styles the arrow buttons.

### Key concepts:
- overflow-x: auto → enables horizontal scrolling
- scroll-snap-type → snaps to nearest card on scroll stop
- scroll-snap-align → tells each card where to snap to
- position: relative/absolute → arrows float over the row
- opacity transition → arrows fade in smoothly on hover

### Antigravity Prompt:
```
In my CineVault project, open style.css and add these styles at the end:

.carousel-wrapper {
  position: relative;
}

.category-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 8px 4px 20px;
  scrollbar-width: none;
}

.category-row::-webkit-scrollbar {
  display: none;
}

.card {
  scroll-snap-align: start;
  flex-shrink: 0;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  width: 40px;
  height: 72px;
  border-radius: 6px;
  font-size: 1.8rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.92);
}

.carousel-btn-left  { left: 0; }
.carousel-btn-right { right: 0; }

.carousel-wrapper:hover .carousel-btn {
  opacity: 1;
}

Do not change anything else.
```

### Validation:
Refresh page. Hover over a movie row — arrows should fade in on
left and right edges. Cards should scroll smoothly ✅

---

## Day 2 — Step 3: Arrow Navigation Logic
**Status: ✅ DONE**

### What this does:
Makes the arrow buttons actually scroll the row left and right by
a fixed amount when clicked. Each carousel wrapper is independent.

### Key concepts:
- scrollBy() → scrolls by a relative amount (not to a position)
- querySelectorAll → selects all carousels at once
- closest() → finds the parent carousel wrapper from the button
- Event delegation → one pattern handles all carousels

### Antigravity Prompt:
```
In my CineVault project, open script.js and add this code
at the bottom of the file, after all existing code:

document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
  const row   = wrapper.querySelector('.category-row');
  const left  = wrapper.querySelector('.carousel-btn-left');
  const right = wrapper.querySelector('.carousel-btn-right');

  const SCROLL_AMOUNT = 900;

  left.addEventListener('click',  () => row.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }));
  right.addEventListener('click', () => row.scrollBy({ left:  SCROLL_AMOUNT, behavior: 'smooth' }));
});

Do not change anything else.
```

### Validation:
Hover over a row → click right arrow → row scrolls right.
Click left arrow → row scrolls back. Each row scrolls independently ✅

---

## Day 2 — Step 4: Hide Arrows at Scroll Boundaries
**Status: ✅ DONE**

### What this does:
Hides the left arrow when the row is at the start (nothing to scroll
back to) and hides the right arrow when at the end. Polished UX detail
that Netflix and YouTube both implement.

### Key concepts:
- scroll event → fires every time the row scrolls
- scrollLeft → how many px the row has scrolled from the left
- scrollWidth vs clientWidth → total width vs visible width
- Conditional classList → toggle disabled state based on position

### Antigravity Prompt:
```
In my CineVault project, open script.js.

Find the carousel forEach loop we just added and replace it with
this upgraded version:

document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
  const row   = wrapper.querySelector('.category-row');
  const left  = wrapper.querySelector('.carousel-btn-left');
  const right = wrapper.querySelector('.carousel-btn-right');

  const SCROLL_AMOUNT = 900;

  function updateArrows() {
    left.style.opacity  = row.scrollLeft <= 10 ? '0' : '';
    right.style.opacity = row.scrollLeft + row.clientWidth >= row.scrollWidth - 10 ? '0' : '';
  }

  left.addEventListener('click',  () => { row.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }); });
  right.addEventListener('click', () => { row.scrollBy({ left:  SCROLL_AMOUNT, behavior: 'smooth' }); });

  row.addEventListener('scroll', updateArrows, { passive: true });
  updateArrows();
});

Do not change anything else.
```

### Validation:
On page load, left arrow should be hidden (already at start).
Scroll to end of a row → right arrow should disappear.
Scroll back to start → left arrow disappears again ✅

---

## Day 2 — Step 5: Day 2 Full Validation
**Status: ✅ DONE**

```
[x] All 5 rows scroll horizontally
[x] Cards snap cleanly on scroll stop
[x] Arrows fade in when hovering over a row
[x] Left arrow hidden at start of each row
[x] Right arrow hidden at end of each row
[x] Each row scrolls independently
[x] No horizontal page overflow (no page-level scrollbar)
[x] Works on mobile with touch swipe
[x] All Day 1 features still work (watchlist, search, stats)
```

---
---

# DAY 3 — Movie Modal & Trailer Integration

**Goal:** Clicking any movie card opens a beautiful full-screen modal
with detailed info, cast, and an embedded YouTube trailer.

---

## Day 3 — Step 1: Modal HTML Structure
**Status: ✅ DONE**

### What this does:
Creates the modal overlay that will appear on top of everything when
a movie card is clicked. The HTML is hidden by default and shown via
JavaScript when needed.

### Key concepts:
- Overlay pattern → fixed full-screen backdrop + centered content
- Semantic structure → using article/section inside modal
- Hidden by default → CSS controls visibility, JS toggles it
- Accessibility → role, aria-modal, aria-label for screen readers

### Antigravity Prompt:
```
In my CineVault project, open index.html.

Add this modal HTML right before the closing </body> tag,
after the footer:

<div id="movieModal" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Movie details">
  <div class="modal-content">
    <button class="modal-close" id="modalClose" aria-label="Close modal">&#x2715;</button>

    <div class="modal-backdrop" id="modalBackdrop"></div>

    <div class="modal-body">
      <div class="modal-poster-col">
        <img id="modalPoster" src="" alt="" class="modal-poster" />
      </div>

      <div class="modal-info-col">
        <div class="modal-genre" id="modalGenre"></div>
        <h2 class="modal-title" id="modalTitle"></h2>

        <div class="modal-meta">
          <span id="modalRating"></span>
          <span class="dot"></span>
          <span id="modalYear"></span>
          <span class="dot"></span>
          <span id="modalRuntime"></span>
        </div>

        <p class="modal-desc" id="modalDesc"></p>

        <div class="modal-credits">
          <div><span class="credit-label">Director</span><span id="modalDirector"></span></div>
          <div><span class="credit-label">Cast</span><span id="modalCast"></span></div>
        </div>

        <div class="modal-actions">
          <button class="btn-play" id="modalTrailer">
            &#9654; Watch Trailer
          </button>
          <button class="btn-watchlist" id="modalWatchlist">
            + Watchlist
          </button>
        </div>
      </div>
    </div>

    <div class="modal-trailer-container" id="trailerContainer">
      <iframe id="trailerFrame" width="100%" height="100%"
        frameborder="0" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
      </iframe>
    </div>

  </div>
</div>

Do not change anything else.
```

### Validation:
Refresh page. Nothing should look different yet — modal is hidden ✅

---

## Day 3 — Step 2: Modal CSS
**Status: ✅ DONE**

### What this does:
Styles the modal with a cinematic dark overlay, glassmorphism content
card, backdrop image, smooth open/close animation.

### Key concepts:
- position: fixed → covers entire screen regardless of scroll
- backdrop-filter: blur → glassmorphism effect on modal card
- opacity + pointer-events → invisible but present when closed
- transition → smooth fade in/out animation
- z-index hierarchy → modal must be above navbar and everything

### Antigravity Prompt:
```
In my CineVault project, open style.css and add at the end:

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.modal-content {
  background: #141414;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255,255,255,0.08);
  scrollbar-width: none;
}

.modal-content::-webkit-scrollbar { display: none; }

.modal-backdrop {
  width: 100%;
  height: 280px;
  background-size: cover;
  background-position: center top;
  border-radius: 16px 16px 0 0;
  position: relative;
}

.modal-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(20,20,20,0) 40%, #141414 100%);
  border-radius: inherit;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-close:hover { background: rgba(229,9,20,0.8); }

.modal-body {
  display: flex;
  gap: 28px;
  padding: 0 28px 28px;
  margin-top: -80px;
  position: relative;
  z-index: 2;
}

.modal-poster {
  width: 160px;
  min-width: 160px;
  height: 240px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.modal-info-col {
  flex: 1;
  padding-top: 80px;
}

.modal-genre {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e50914;
  margin-bottom: 8px;
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
  line-height: 1.2;
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 16px;
}

.modal-desc {
  font-size: 0.9rem;
  color: #ccc;
  line-height: 1.7;
  margin-bottom: 20px;
}

.modal-credits {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 0.85rem;
  color: #ccc;
}

.credit-label {
  color: #888;
  margin-right: 8px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.modal-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-trailer-container {
  width: 100%;
  aspect-ratio: 16/9;
  display: none;
  padding: 0 28px 28px;
}

.modal-trailer-container.show {
  display: block;
}

Do not change anything else.
```

### Validation:
No visual change yet — CSS is ready, waiting for JS to trigger it ✅

---

## Day 3 — Step 3: Open Modal on Card Click
**Status: ✅ DONE**

### What this does:
Makes every movie card clickable — clicking anywhere on the card
(except the action buttons) opens the modal with that movie's data.

### Key concepts:
- e.stopPropagation() → prevents card click from firing when buttons clicked
- data-idx attribute → identifies which movie was clicked
- Body scroll lock → prevents background from scrolling when modal is open
- Populating modal → filling in the HTML elements with movie data

### Antigravity Prompt:
```
In my CineVault project, open script.js.

1. Add this openModal function after the loadCategory function:

function openModal(movie) {
  const modal = document.getElementById('movieModal');

  document.getElementById('modalTitle').textContent    = movie.title;
  document.getElementById('modalDesc').textContent     = movie.desc;
  document.getElementById('modalGenre').textContent    = movie.genre;
  document.getElementById('modalRating').textContent   = '⭐ ' + (movie.rating || 0).toFixed(1);
  document.getElementById('modalYear').textContent     = movie.year || '—';
  document.getElementById('modalRuntime').textContent  = movie.runtime || '—';
  document.getElementById('modalDirector').textContent = movie.director || 'Unknown';
  document.getElementById('modalCast').textContent     = movie.cast || 'Unknown';
  document.getElementById('modalPoster').src           = movie.poster || '';
  document.getElementById('modalPoster').alt           = movie.title + ' poster';

  const backdrop = document.getElementById('modalBackdrop');
  backdrop.style.backgroundImage = movie.backdrop
    ? `url(https://image.tmdb.org/t/p/w1280${movie.backdrop})`
    : `url(${movie.poster})`;

  document.getElementById('trailerContainer').classList.remove('show');
  document.getElementById('trailerFrame').src = '';

  const wlBtn = document.getElementById('modalWatchlist');
  wlBtn.textContent = movie.inWatchlist ? '✓ In Watchlist' : '+ Watchlist';
  wlBtn.onclick = () => {
    movie.inWatchlist = !movie.inWatchlist;
    wlBtn.textContent = movie.inWatchlist ? '✓ In Watchlist' : '+ Watchlist';
    showToast(movie.inWatchlist ? '✅ Added to Watchlist' : '🗑 Removed from Watchlist',
      movie.inWatchlist ? 'green' : '');
  };

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal._currentMovie = movie;
}

function closeModal() {
  const modal = document.getElementById('movieModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('trailerFrame').src = '';
  document.getElementById('trailerContainer').classList.remove('show');
}

2. In the buildCard function, add this click listener on the card element,
   right before the return statement:

card.addEventListener('click', () => openModal(movie));

3. At the bottom of the file add:
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('movieModal').addEventListener('click', e => {
  if (e.target === document.getElementById('movieModal')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

Do not change anything else.
```

### Validation:
Click any movie card → modal should open with that movie's info.
Click X button, press ESC, or click outside → modal closes ✅

---

## Day 3 — Step 4: Fetch Movie Details from TMDB
**Status: ✅ DONE**

### What this does:
When modal opens, fetches the full movie details from TMDB — runtime,
release year, cast, director. These aren't in the basic movie list
response, so a separate API call is needed.

### Key concepts:
- TMDB movie details endpoint → /movie/{id} for full details
- TMDB credits endpoint → /movie/{id}/credits for cast/director
- Promise.all → runs both API calls in parallel (faster)
- Updating DOM after async → modal shows basic info first, details load in

### Antigravity Prompt:
```
In my CineVault project, open script.js.

Add this function after openModal:

async function fetchMovieDetails(movieId) {
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

    return { director, cast, runtime, year, backdropPath: details.backdrop_path };
  } catch (err) {
    console.error('fetchMovieDetails failed:', err);
  }
}

Then update openModal to call fetchMovieDetails at the end.
Add this line as the last line inside the openModal function,
before the closing brace:

if (movie.id) fetchMovieDetails(movie.id);

Do not change anything else.
```

### Validation:
Click a movie card → modal opens → within 1-2 seconds director,
cast, and runtime should populate from TMDB ✅

---

## Day 3 — Step 5: Fetch and Embed Trailer
**Status: ✅ DONE**

### What this does:
When "Watch Trailer" is clicked, fetches the YouTube trailer key from
TMDB videos endpoint and embeds it directly inside the modal.

### Key concepts:
- TMDB videos endpoint → returns list of related YouTube videos
- Filtering for trailers → TMDB returns teasers, clips, featurettes too
- YouTube embed URL → youtube.com/embed/{key} for iframe embedding
- Autoplay → adding autoplay=1 to URL starts video immediately

### Antigravity Prompt:
```
In my CineVault project, open script.js.

Add this function after fetchMovieDetails:

async function loadTrailer(movieId) {
  try {
    const data = await fetch(
      `${BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    ).then(r => r.json());

    const trailer = data.results?.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    ) || data.results?.[0];

    if (!trailer) {
      showToast('No trailer found for this movie.', 'yellow');
      return;
    }

    const frame     = document.getElementById('trailerFrame');
    const container = document.getElementById('trailerContainer');

    frame.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    container.classList.add('show');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    showToast('Could not load trailer.', 'yellow');
  }
}

Then find the modalTrailer button event inside openModal and replace it:

document.getElementById('modalTrailer').onclick = () => {
  if (movie.id) loadTrailer(movie.id);
};

Do not change anything else.
```

### Validation:
Open any movie modal → click "Watch Trailer" → YouTube video embeds
and plays inside the modal ✅

---

## Day 3 — Step 6: Day 3 Full Validation
**Status: ✅ DONE**

```
[x] Click any card → modal opens with that movie's info
[x] Backdrop image shows behind modal content
[x] Director and cast populate after ~1 second
[x] Runtime and year populate correctly
[x] Watch Trailer → YouTube video plays in modal
[x] If no trailer found → toast message shown
[x] ESC key closes modal
[x] Clicking outside modal closes it
[x] X button closes modal
[x] Trailer stops playing when modal closes
[x] Watchlist toggle in modal works + syncs with card
[x] Body scroll is locked when modal is open
[x] All Day 2 features still work
```

---
---

# DAY 4 — Filters, Sorting, Watchlist & Favorites

**Goal:** Add genre filter chips, sort dropdown, and persistent
Watchlist/Favorites sections backed by LocalStorage.

---

## Day 4 — Step 1: Genre Filter Chips HTML + CSS
**Status: ✅ DONE**

### What this does:
Adds clickable genre pill buttons above the movie rows. Clicking a
genre shows only movies matching that genre across all rows.

### Key concepts:
- Filter chips → UI pattern used by Netflix, Spotify, YouTube
- Active state → selected chip gets highlighted style
- Single select vs multi select → we start with single select
- Positioning → chips appear between navbar and first row

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, add this genre filter bar after the stats-bar div
   and before the main container:

<div id="filterBar">
  <div class="filter-chips" id="genreChips">
    <button class="chip active" data-genre="All">All</button>
    <button class="chip" data-genre="Action">Action</button>
    <button class="chip" data-genre="Comedy">Comedy</button>
    <button class="chip" data-genre="Drama">Drama</button>
    <button class="chip" data-genre="Thriller">Thriller</button>
    <button class="chip" data-genre="Sci-Fi">Sci-Fi</button>
    <button class="chip" data-genre="Horror">Horror</button>
    <button class="chip" data-genre="Romance">Romance</button>
    <button class="chip" data-genre="Adventure">Adventure</button>
    <button class="chip" data-genre="Animation">Animation</button>
  </div>
</div>

2. In style.css, add at the end:

#filterBar {
  padding: 16px 40px;
  background: #0a0a0a;
  position: sticky;
  top: 64px;
  z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.filter-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.filter-chips::-webkit-scrollbar { display: none; }

.chip {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: #ccc;
  font-size: 0.8rem;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.chip:hover {
  border-color: #fff;
  color: #fff;
}

.chip.active {
  background: #e50914;
  border-color: #e50914;
  color: #fff;
}

Do not change anything else.
```

### Validation:
Refresh page. Genre chips appear below stats bar, sticky on scroll.
Clicking chips should not do anything yet — that's Step 2 ✅

---

## Day 4 — Step 2: Filter Logic in JavaScript
**Status: ✅ DONE**

### What this does:
Makes genre chips actually filter the visible movie cards across all
category rows. Only cards matching the selected genre remain visible.

### Key concepts:
- classList.toggle('hidden') → shows/hides cards without removing from DOM
- querySelectorAll → selects all cards across all rows at once
- data attributes → reading genre from card's dataset
- Active chip tracking → removes active from previous chip

### Antigravity Prompt:
```
In my CineVault project, open script.js and add at the bottom:

let activeGenre = 'All';

document.getElementById('genreChips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  activeGenre = chip.dataset.genre;
  filterByGenre(activeGenre);
});

function filterByGenre(genre) {
  document.querySelectorAll('.category-row .card').forEach(card => {
    const cardGenre = card.querySelector('.genre-badge')?.textContent || '';
    const show = genre === 'All' || cardGenre === genre;
    card.classList.toggle('hidden', !show);
  });
}

Do not change anything else.
```

### Validation:
Click "Action" chip → only action movies visible across all rows.
Click "All" → all movies visible again ✅

---

## Day 4 — Step 3: Sort Dropdown HTML + CSS
**Status: ✅ DONE**

### What this does:
Adds a sort dropdown next to the genre chips. Lets users sort visible
movies by rating, year, or title alphabetically.

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, inside the filterBar div, add this after the
   genre chips div:

<div class="filter-right">
  <select id="sortSelect" class="sort-dropdown">
    <option value="default">Sort by…</option>
    <option value="rating-high">Highest Rated</option>
    <option value="rating-low">Lowest Rated</option>
    <option value="title-az">Title A–Z</option>
    <option value="title-za">Title Z–A</option>
  </select>
</div>

2. Update the filterBar CSS and add sort styles in style.css:

#filterBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 40px;
  background: #0a0a0a;
  position: sticky;
  top: 64px;
  z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.filter-right {
  flex-shrink: 0;
}

.sort-dropdown {
  background: #1a1a1a;
  color: #ccc;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.sort-dropdown:hover { border-color: rgba(255,255,255,0.5); }

Do not change anything else.
```

### Validation:
Sort dropdown appears on the right of filter bar.
Selecting options does nothing yet — that's Step 4 ✅

---

## Day 4 — Step 4: Sort Logic in JavaScript
**Status: ✅ DONE**

### What this does:
Makes the sort dropdown reorder visible cards inside each row based
on the selected sort option.

### Key concepts:
- Array.from() → converts NodeList to array so we can sort it
- compareFunction in sort() → custom comparison for different sort types
- DOM reorder → appending sorted elements reorders them in the DOM
- localeCompare → proper alphabetical sorting for strings

### Antigravity Prompt:
```
In my CineVault project, open script.js and add at the bottom:

document.getElementById('sortSelect').addEventListener('change', e => {
  sortCards(e.target.value);
});

function sortCards(sortBy) {
  document.querySelectorAll('.category-row').forEach(row => {
    const cards = Array.from(row.querySelectorAll('.card'));

    cards.sort((a, b) => {
      const ratingA = parseFloat(a.querySelector('.card-rating-badge')?.textContent) || 0;
      const ratingB = parseFloat(b.querySelector('.card-rating-badge')?.textContent) || 0;
      const titleA  = a.querySelector('.card-title')?.textContent || '';
      const titleB  = b.querySelector('.card-title')?.textContent || '';

      if (sortBy === 'rating-high') return ratingB - ratingA;
      if (sortBy === 'rating-low')  return ratingA - ratingB;
      if (sortBy === 'title-az')    return titleA.localeCompare(titleB);
      if (sortBy === 'title-za')    return titleB.localeCompare(titleA);
      return 0;
    });

    cards.forEach(card => row.appendChild(card));
  });
}

Do not change anything else.
```

### Validation:
Select "Highest Rated" → cards reorder by rating in each row.
Select "Title A–Z" → cards reorder alphabetically ✅

---

## Day 4 — Step 5: Watchlist Section with LocalStorage
**Status: ✅ DONE**

### What this does:
Adds a dedicated Watchlist section that shows all movies the user
has saved. Uses LocalStorage so the watchlist survives page refresh.

### Key concepts:
- LocalStorage → browser storage, persists after refresh/close
- JSON.stringify/parse → LocalStorage only stores strings, so objects need converting
- Event-driven update → watchlist section re-renders whenever a movie is added/removed
- Filtering movies array → pull only inWatchlist:true movies

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, add this section before the footer:

<section id="watchlistSection">
  <div class="section-heading">
    <span class="section-icon">🔖</span>
    <h3>My Watchlist</h3>
    <hr class="section-line" />
  </div>
  <div class="category-row" id="watchlistRow">
    <p class="row-loading">Add movies to your watchlist to see them here.</p>
  </div>
</section>

2. In script.js, add these functions at the bottom:

function saveToLocalStorage() {
  const watchlist = movies.filter(m => m.inWatchlist);
  const favs      = movies.filter(m => m.isFav);
  localStorage.setItem('cv_watchlist', JSON.stringify(watchlist));
  localStorage.setItem('cv_favs',      JSON.stringify(favs));
}

function renderWatchlist() {
  const row = document.getElementById('watchlistRow');
  const wl  = movies.filter(m => m.inWatchlist);

  if (wl.length === 0) {
    row.innerHTML = '<p class="row-loading">Add movies to your watchlist to see them here.</p>';
    return;
  }

  row.innerHTML = '';
  wl.forEach((movie, i) => row.appendChild(buildCard(movie, i)));
}

3. Find the watchlist toggle inside buildCard (card-btn-wl click event)
   and add these 2 calls at the end of that event handler:

saveToLocalStorage();
renderWatchlist();

Do not change anything else.
```

### Validation:
Add a movie to watchlist → appears in Watchlist section immediately.
Refresh page → (persistence comes in the next small addition).
Remove from watchlist → disappears from section ✅

---

## Day 4 — Step 6: Favorites Section + Load from LocalStorage
**Status: ✅ DONE**

### What this does:
Mirrors the Watchlist section for Favorites. Also loads saved
watchlist/favorites back from LocalStorage on page load so data
persists across sessions.

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, add Favorites section after watchlistSection:

<section id="favoritesSection">
  <div class="section-heading">
    <span class="section-icon">❤️</span>
    <h3>My Favorites</h3>
    <hr class="section-line" />
  </div>
  <div class="category-row" id="favoritesRow">
    <p class="row-loading">Mark movies as favourite to see them here.</p>
  </div>
</section>

2. In script.js, add renderFavorites function after renderWatchlist:

function renderFavorites() {
  const row  = document.getElementById('favoritesRow');
  const favs = movies.filter(m => m.isFav);

  if (favs.length === 0) {
    row.innerHTML = '<p class="row-loading">Mark movies as favourite to see them here.</p>';
    return;
  }

  row.innerHTML = '';
  favs.forEach((movie, i) => row.appendChild(buildCard(movie, i)));
}

3. In the card-btn-fav click handler inside buildCard, add at the end:

saveToLocalStorage();
renderFavorites();

4. At the very bottom of script.js, after all loadCategory calls,
   add the LocalStorage loader. This runs once on page load:

(function loadFromLocalStorage() {
  const savedWL   = JSON.parse(localStorage.getItem('cv_watchlist') || '[]');
  const savedFavs = JSON.parse(localStorage.getItem('cv_favs') || '[]');

  savedWL.forEach(m => {
    const existing = movies.find(mv => mv.id === m.id || mv.title === m.title);
    if (existing) existing.inWatchlist = true;
  });

  savedFavs.forEach(m => {
    const existing = movies.find(mv => mv.id === m.id || mv.title === m.title);
    if (existing) existing.isFav = true;
  });

  renderWatchlist();
  renderFavorites();
})();

Do not change anything else.
```

### Validation:
Add to watchlist → refresh page → still in watchlist ✅
Mark as favorite → refresh → still in favorites ✅

---

## Day 4 — Step 7: Day 4 Full Validation
**Status: ✅ DONE**

```
[x] Genre chips filter cards across all rows
[x] Clicking All restores all cards
[x] Sort dropdown reorders cards correctly
[x] Watchlist section updates when card watchlist toggled
[x] Favorites section updates when card fav toggled
[x] Refresh page → watchlist and favorites persist
[x] Modal watchlist button syncs with card + section
[x] Stats bar still works correctly
[x] All Day 3 features (modal, trailer) still work
```

---
---

# DAY 5 — Polish, Performance & Deploy

**Goal:** Skeleton loaders, lazy image loading, Continue Watching,
final responsive pass, Lighthouse audit, and deploy to Netlify.

---

## Day 5 — Step 1: Skeleton Loading Cards
**Status: ✅ DONE**

### What this does:
Shows animated placeholder cards while movie data is loading from
TMDB. This prevents the jarring "empty → suddenly full" experience.
Netflix, YouTube, LinkedIn all use this pattern.

### Key concepts:
- Skeleton screens → better UX than spinners for content-heavy pages
- CSS animation → shimmer effect with @keyframes
- Replace on load → skeleton cards removed and replaced with real cards
- loadCategory modification → show skeletons before fetch, remove after

### Antigravity Prompt:
```
In my CineVault project:

1. In style.css, add at the end:

.skeleton-card {
  width: 180px;
  min-width: 180px;
  height: 320px;
  border-radius: 12px;
  background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  flex-shrink: 0;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

2. In script.js, update the loadCategory function.
   Replace the line:
   container.innerHTML = '<p class="row-loading">Loading…</p>';

   With this:
   container.innerHTML = '';
   for (let i = 0; i < 6; i++) {
     const skel = document.createElement('div');
     skel.className = 'skeleton-card';
     container.appendChild(skel);
   }

Do not change anything else.
```

### Validation:
Refresh page. For 1-2 seconds, animated gray skeleton cards appear
in each row before real movie cards load in ✅

---

## Day 5 — Step 2: Lazy Image Loading with Fade-In
**Status: ✅ DONE**

### What this does:
Images below the fold (not visible on screen) load only when the user
scrolls near them. This improves page load performance significantly.
Images fade in smoothly when they load instead of popping in.

### Key concepts:
- loading="lazy" → native browser lazy loading, zero JS needed
- IntersectionObserver → watches when elements enter the viewport
- Fade in animation → opacity 0→1 transition on image load
- decoding="async" → image decoding doesn't block the main thread

### Antigravity Prompt:
```
In my CineVault project, open script.js.

Find the buildCard function. Inside it, find the img tag creation.
The current img element looks like:
<img src="${posterSrc}" alt="${movie.title} poster" ...

Replace it with:
<img src="${posterSrc}" alt="${movie.title} poster"
     loading="lazy"
     decoding="async"
     style="opacity:0;transition:opacity 0.4s ease"
     onload="this.style.opacity='1'"
     onerror="this.src='https://placehold.co/400x600/1E1E1E/a3a3a3?text=No+Poster';this.style.opacity='1'" />

Do not change anything else.
```

### Validation:
Refresh page. Scroll down slowly — images fade in as you scroll
to each row instead of all loading at once ✅

---

## Day 5 — Step 3: Continue Watching Section
**Status: ✅ DONE**

### What this does:
Tracks which movies the user has clicked (simulating "watched") and
shows them in a Continue Watching row with a progress bar. Data
saved in LocalStorage.

### Key concepts:
- Progress tracking → store last watched timestamp per movie ID
- Progress bar UI → CSS width based on fake percentage
- LocalStorage → persist watch history across sessions
- Recently watched → show most recently clicked first

### Antigravity Prompt:
```
In my CineVault project:

1. In index.html, add Continue Watching section right after the
   hero section, before the stats bar:

<section id="continueSection" style="display:none">
  <div class="section-heading">
    <span class="section-icon">▶️</span>
    <h3>Continue Watching</h3>
    <hr class="section-line" />
  </div>
  <div class="category-row" id="continueRow"></div>
</section>

2. In style.css add:

.continue-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #e50914;
  border-radius: 0 0 0 12px;
  transition: width 0.3s ease;
}

.card-poster { position: relative; }

3. In script.js add at the bottom:

function trackWatched(movie) {
  const history = JSON.parse(localStorage.getItem('cv_history') || '{}');
  history[movie.id || movie.title] = {
    title: movie.title,
    poster: movie.poster,
    genre: movie.genre,
    rating: movie.rating,
    desc: movie.desc,
    progress: Math.floor(Math.random() * 60) + 20,
    timestamp: Date.now()
  };
  localStorage.setItem('cv_history', JSON.stringify(history));
  renderContinueWatching();
}

function renderContinueWatching() {
  const history = JSON.parse(localStorage.getItem('cv_history') || '{}');
  const items   = Object.values(history).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  const section = document.getElementById('continueSection');
  const row     = document.getElementById('continueRow');

  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  row.innerHTML = '';
  items.forEach((item, i) => {
    const card = buildCard(item, i);
    const bar  = document.createElement('div');
    bar.className = 'continue-progress';
    bar.style.width = item.progress + '%';
    card.querySelector('.card-poster').appendChild(bar);
    row.appendChild(card);
  });
}

4. Inside the openModal function, add this line at the end:
   trackWatched(movie);

renderContinueWatching();

Do not change anything else.
```

### Validation:
Click a movie card to open modal → Continue Watching section appears
with a red progress bar on the card. Refresh → section persists ✅

---

## Day 5 — Step 4: Responsive Design Pass
**Status: ✅ DONE**

### What this does:
Makes CineVault look great on mobile and tablet, not just desktop.
Tests and fixes layouts, font sizes, and spacing for small screens.

### Key concepts:
- Media queries → apply different CSS at different screen widths
- Mobile-first → small screen first, then expand for larger
- Viewport units → vw/vh for fluid sizing
- Touch targets → buttons at least 44px for comfortable tapping

### Antigravity Prompt:
```
In my CineVault project, open style.css and add responsive styles
at the very end of the file:

@media (max-width: 768px) {
  #navbar {
    padding: 0 16px;
  }

  .nav-links {
    display: none;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-desc {
    font-size: 0.85rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  #stats-bar {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 20px 16px;
  }

  #filterBar {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    top: 56px;
  }

  .filter-chips {
    width: 100%;
  }

  .modal-body {
    flex-direction: column;
    padding: 16px;
    margin-top: -40px;
  }

  .modal-poster {
    width: 120px;
    height: 180px;
  }

  .modal-info-col {
    padding-top: 16px;
  }

  .modal-title {
    font-size: 1.3rem;
  }

  .card {
    width: 140px;
    min-width: 140px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.6rem;
  }

  .hero-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .btn-play,
  .btn-watchlist {
    width: 100%;
    justify-content: center;
  }
}

Do not change anything else.
```

### Validation:
Open DevTools → toggle device toolbar → test at 375px (iPhone),
768px (tablet), 1440px (desktop). All sections should be usable ✅

---

## Day 5 — Step 5: Final Lighthouse Audit
**Status: ⬜ TODO**

### What this does:
Lighthouse is Chrome's built-in tool that scores your app on
Performance, Accessibility, Best Practices, and SEO. Good scores
matter for placement interviews — shows you care about quality.

### How to run:
1. Open your CineVault in Chrome
2. F12 → Lighthouse tab
3. Select: Performance, Accessibility, Best Practices, SEO
4. Device: Mobile
5. Click "Analyze page load"

### Target scores for portfolio:
- Performance: 70+
- Accessibility: 85+
- Best Practices: 90+
- SEO: 80+

### Common fixes prompt (run if scores are low):
```
In my CineVault project, my Lighthouse audit shows these issues:
[paste your specific issues here]

Please fix only these specific issues without breaking any existing features.
My files are index.html, style.css, script.js, config.js.
```

---

## Day 5 — Step 6: Deploy to Netlify
**Status: ⬜ TODO**

### What this does:
Makes CineVault publicly accessible on the internet so you can share
the link in your resume, LinkedIn, and during interviews.

### Deployment steps (no Antigravity needed):

**Option A — Netlify Drag and Drop (easiest):**
1. Go to netlify.com → Log in → Sites
2. Drag your entire CineVault project folder onto the deploy area
3. Netlify gives you a URL like cinevault-abc123.netlify.app
4. Rename it in Site Settings → change to cinevault.netlify.app

**Option B — GitHub + Netlify (professional, recommended):**
1. Push project to GitHub (create .gitignore, add config.js to it)
2. netlify.com → Add new site → Import from Git → select your repo
3. Build command: leave empty (no build step needed)
4. Publish directory: / (root)
5. Deploy — auto-deploys on every git push

### Important before deploying:
Since config.js has your API key and can't be gitignored easily
with vanilla JS, consider these options:
- Use Netlify Environment Variables + a small serverless function to proxy TMDB calls
- Or accept that the key is public (TMDB keys for personal projects are low risk)
- Add your Netlify domain to TMDB's allowed domains in your API settings

### Validation:
```
[ ] Site loads at your Netlify URL
[ ] All 5 movie rows load with real data
[ ] Modal works on live site
[ ] Watchlist/favorites persist on live site
[ ] Works on your phone browser
```

---

## Day 5 — Final Validation Checklist
**Status: ⬜ TODO**

```
DAY 1 FEATURES
[ ] 5 category rows with real TMDB data
[ ] Watchlist and favorite toggles work

DAY 2 FEATURES
[ ] Horizontal scroll on all rows
[ ] Arrow buttons work and hide at boundaries
[ ] Scroll snap on cards

DAY 3 FEATURES
[ ] Movie modal opens on card click
[ ] Director, cast, runtime, year load from TMDB
[ ] Trailer embeds in modal

DAY 4 FEATURES
[ ] Genre filter chips work
[ ] Sort dropdown reorders cards
[ ] Watchlist section with persistence
[ ] Favorites section with persistence

DAY 5 FEATURES
[ ] Skeleton loading on page load
[ ] Images lazy load with fade-in
[ ] Continue Watching section appears after clicking movies
[ ] Mobile layout looks clean at 375px
[ ] Lighthouse Performance 70+
[ ] Lighthouse Accessibility 85+
[ ] Site live on Netlify
```

---

## If Something Breaks (Emergency Prompt)

Paste this into Antigravity with your specific error:

```
I am building CineVault — a Netflix-style movie app using vanilla
HTML, CSS, JavaScript. No React or frameworks.

Files: index.html, style.css, script.js, config.js

After completing [DAY X STEP Y], this broke: [describe the issue]

Console error: [paste exact error message]

Please fix ONLY this specific issue. Do not refactor or change
anything that is already working.
```

---

*CineVault 5-Day Plan — Keep this file in your project folder*
*Update checkboxes as you complete each step*
