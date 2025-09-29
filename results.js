const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const SEARCH_API = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;

const params = new URLSearchParams(location.search);
const query = params.get('q') || '';

const resultsTitle = document.getElementById('resultsTitle');
const resultsGrid = document.getElementById('resultsGrid');
const form = document.getElementById('form');
const search = document.getElementById('search');

const trailerModal = document.getElementById('trailerModal');
const trailerFrame = document.getElementById('trailerFrame');
const detailsModal = document.getElementById('detailsModal');
const detailsBanner = document.getElementById('detailsBanner');
const detailsTitle = document.getElementById('detailsTitle');
const detailsMeta = document.getElementById('detailsMeta');
const detailsCast = document.getElementById('detailsCast');
const detailsPlay = document.getElementById('detailsPlay');
const detailsClose = document.getElementById('detailsClose');
const detailsDismiss = document.getElementById('detailsDismiss');
const detailsBackHome = document.getElementById('detailsBackHome');
const backArrow = document.getElementById('backArrow');

function closeTrailer() {
  trailerModal.style.display = 'none';
  trailerFrame.src = '';
}
window.closeTrailer = closeTrailer;

window.onclick = e => {
  if (e.target === trailerModal) closeTrailer();
  if (e.target === detailsModal) detailsModal.classList.remove('open');
};

async function fetchTrailerKey(movieId) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? trailer.key : null;
}

async function fetchCast(movieId) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`);
  const data = await res.json();
  return (data.cast || []).slice(0, 5).map(c => c.name).join(', ');
}

async function openDetails(movie) {
  const castList = await fetchCast(movie.id);
  detailsBanner.style.backgroundImage = `url('https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.poster_path}')`;
  detailsTitle.textContent = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0] || '';
  detailsMeta.textContent = [year, `${(movie.vote_average||0).toFixed(1)}/10`].filter(Boolean).join(' · ');
  detailsCast.textContent = castList ? `Cast: ${castList}` : '';
  detailsModal.classList.add('open');
  detailsPlay.onclick = async () => {
    const key = await fetchTrailerKey(movie.id);
    if (key) {
      trailerFrame.src = `https://www.youtube.com/embed/${key}`;
      trailerModal.style.display = 'flex';
    }
  };
}

function renderResults(movies) {
  resultsGrid.innerHTML = '';
  if (!movies.length) {
    resultsGrid.innerHTML = '<div style="color:#a3a3a3; padding: 12px;">No results found.</div>';
    return;
  }
  movies.forEach(m => {
    const el = document.createElement('div');
    el.className = 'card';
    const img = m.poster_path || m.backdrop_path;
    el.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${img}" alt="${m.title || m.name}">
      <div class="card-caption">
        <span class="title">${m.title || m.name}</span>
        <span class="score">${(m.vote_average || 0).toFixed(1)}</span>
      </div>
    `;
    el.addEventListener('click', () => openDetails(m));
    resultsGrid.appendChild(el);
  });
}

async function runSearch(q) {
  if (!q) {
    renderResults([]);
    return;
  }
  resultsTitle.textContent = `Results for "${q}"`;
  const res = await fetch(SEARCH_API + encodeURIComponent(q));
  const data = await res.json();
  renderResults(data.results || []);
}

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const term = search.value.trim();
    if (term) {
      location.href = `results.html?q=${encodeURIComponent(term)}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (search) search.value = query;
  runSearch(query);
});

if (detailsBackHome) {
  detailsBackHome.addEventListener('click', () => {
    location.href = 'index.html';
  });
}

if (backArrow) {
  backArrow.addEventListener('click', () => {
    history.length > 1 ? history.back() : (location.href = 'index.html');
  });
}


