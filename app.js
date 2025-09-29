const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const API_URL = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&page=1`;
const TRENDING_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`;
const TOP_RATED_URL = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&page=1`;
const UPCOMING_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=1`;
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';
const SEARCH_API = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;

const main = document.getElementById('main');
const hero = document.getElementById('hero');
const heroTitle = document.getElementById('heroTitle');
const heroMeta = document.getElementById('heroMeta');
const heroOverview = document.getElementById('heroOverview');
const heroPlay = document.getElementById('heroPlay');
const scrollerTrending = document.getElementById('scroller-trending');
const scrollerTop = document.getElementById('scroller-top');
const scrollerUpcoming = document.getElementById('scroller-upcoming');
const scrollerResults = document.getElementById('scroller-results');
const form = document.getElementById('form');
const search = document.getElementById('search');
const trailerModal = document.getElementById('trailerModal');
const trailerFrame = document.getElementById('trailerFrame');
const themeToggle = document.getElementById('themeToggle');

document.body.setAttribute('data-theme', 'dark');

function toggleTheme() {
  const current = document.body.getAttribute('data-theme');
  const isLight = current === 'light';
  document.body.setAttribute('data-theme', isLight ? 'dark' : 'light');
  if (themeToggle) themeToggle.checked = !isLight;
}

window.addEventListener('DOMContentLoaded', () => {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  if (themeToggle) themeToggle.checked = isLight;
});

function closeTrailer() {
  trailerModal.style.display = 'none';
  trailerFrame.src = '';
}

window.onclick = e => {
  if (e.target === trailerModal) closeTrailer();
};

async function getMovies(url) {
  const res = await fetch(url);
  const data = await res.json();

  const movies = await Promise.all(
    data.results.map(async (movie) => {
      const trailerRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`);
      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`);
      const trailerData = await trailerRes.json();
      const creditsData = await creditsRes.json();

      const trailer = trailerData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      const genre = movie.genre_ids ? movie.genre_ids.join(', ') : 'N/A';
      const cast = creditsData.cast.slice(0, 3).map(c => c.name).join(', ');

      return {
        ...movie,
        trailerKey: trailer ? trailer.key : null,
        genre,
        release_date: movie.release_date,
        cast
      };
    })
  );

  showGrid(movies);
}

function showGrid(movies) {
  // Populate hero from the first movie that has a backdrop
  const heroMovie = movies.find(m => m.backdrop_path) || movies[0];
  if (heroMovie && hero) {
    hero.style.backgroundImage = `linear-gradient(0deg, rgba(20,20,20,0.6), rgba(20,20,20,0.2)), url('https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}')`;
    heroTitle.textContent = heroMovie.title || heroMovie.name;
    heroMeta.textContent = `${heroMovie.release_date || heroMovie.first_air_date || ''}`;
    heroOverview.textContent = heroMovie.overview || '';
    if (heroPlay) {
      heroPlay.onclick = async () => {
        const key = await fetchTrailerKey(heroMovie.id);
        if (key) showTrailer(key);
      };
    }
  }

  // Default grid fallback if scrollers are not found
  if (!scrollerTrending && main) {
    main.innerHTML = '';
    movies.forEach(({ title, poster_path, vote_average, overview, trailerKey }) => {
      const movieEl = document.createElement('div');
      movieEl.classList.add('movie');
      movieEl.innerHTML = `
        <img src="${IMG_PATH + poster_path}" alt="${title}">
        <div class="movie-info">
          <h3>${title}</h3>
          <span class="${getClassByRate(vote_average)}">${vote_average}</span>
        </div>
        <div class="overview">
          <h4>Overview</h4>
          <p>${overview}</p>
          ${trailerKey ? `<button data-trailer="${trailerKey}">▶ Watch Trailer</button>` : '<em>No trailer</em>'}
        </div>
      `;
      const btn = movieEl.querySelector('button[data-trailer]');
      if (btn) btn.addEventListener('click', () => showTrailer(btn.getAttribute('data-trailer')));
      main.appendChild(movieEl);
    });
  }
}

async function fetchTrailerKey(movieId) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? trailer.key : null;
}

function renderRow(container, movies) {
  if (!container) return;
  container.innerHTML = '';
  movies.forEach((m) => {
    const el = document.createElement('div');
    el.className = 'card';
    const img = m.poster_path || m.backdrop_path;
    el.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${img}" alt="${m.title || m.name}">
      <span class="rating">${(m.vote_average || 0).toFixed(1)}</span>
    `;
    el.addEventListener('click', async () => {
      const key = await fetchTrailerKey(m.id);
      if (key) showTrailer(key);
    });
    container.appendChild(el);
  });
}

function getClassByRate(vote) {
  if (vote >= 8) return 'green';
  else if (vote >= 5) return 'orange';
  else return 'red';
}

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const term = search.value;
    if (!term) return;
    location.href = `results.html?q=${encodeURIComponent(term)}`;
  });
}

function showTrailer(key) {
  trailerFrame.src = `https://www.youtube.com/embed/${key}`;
  trailerModal.style.display = 'flex';
}

// Expose functions used by inline handlers if any remain
window.toggleTheme = toggleTheme;
window.closeTrailer = closeTrailer;
window.showTrailer = showTrailer;

// initial load: fetch rows
(async () => {
  try {
    const [trendRes, topRes, upRes] = await Promise.all([
      fetch(TRENDING_URL),
      fetch(TOP_RATED_URL),
      fetch(UPCOMING_URL)
    ]);
    const [trendData, topData, upData] = await Promise.all([
      trendRes.json(), topRes.json(), upRes.json()
    ]);

    const trending = trendData.results || [];
    const top = topData.results || [];
    const upcoming = upData.results || [];

    // Populate hero with a trending pick
    showGrid(trending);

    // Render rows
    renderRow(scrollerTrending, trending);
    renderRow(scrollerTop, top);
    renderRow(scrollerUpcoming, upcoming);
  } catch (e) {
    console.error(e);
  }
})();


