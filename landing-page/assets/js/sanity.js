(function () {
  'use strict';

  var SANITY = {
    projectId: 'gbwew0c6',
    dataset: 'production',
    apiVersion: '2024-01-01',
  };

  function q(query) {
    var url = 'https://' + SANITY.projectId + '.api.sanity.io/v' + SANITY.apiVersion + '/data/query/' + SANITY.dataset + '?query=' + encodeURIComponent(query);
    return fetch(url).then(function (r) { return r.json(); });
  }

  function imgUrl(ref, w) {
    if (!ref) return '';
    w = w || 400;
    var base = ref.replace(/^image-/, '');
    var lastDash = base.lastIndexOf('-');
    var format = base.substring(lastDash + 1);
    var rest = base.substring(0, lastDash);
    var dimDash = rest.lastIndexOf('-');
    var imageId = rest.substring(0, dimDash);
    return 'https://cdn.sanity.io/images/' + SANITY.projectId + '/' + SANITY.dataset + '/' + imageId + '-' + w + 'x' + w + '.' + format;
  }

  function resolveImg(item, field, w) {
    w = w || 400;
    if (!item) return '';
    if (item[field + 'Url']) {
      var url = item[field + 'Url'];
      if (url.indexOf('?') === -1) return url + '?w=' + w;
      return url;
    }
    var img = item[field];
    if (!img) return '';
    var ref = (img.asset && img.asset._ref) || img._ref || '';
    return imgUrl(ref, w);
  }

  function createEl(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') el.className = attrs[k];
        else el.setAttribute(k, attrs[k]);
      });
    }
    if (html !== undefined) el.innerHTML = html;
    return el;
  }

  function scrollToFounderOnMobile() {
    var grid = document.querySelector('.team-core-grid-horizontal');
    if (!grid || window.innerWidth > 768) return;
    var founder = grid.querySelector('.founder-card');
    if (!founder) return;
    setTimeout(function () {
      var cw = grid.clientWidth;
      var fw = founder.offsetWidth;
      var fl = founder.offsetLeft;
      grid.scrollTo({ left: Math.max(0, fl - (cw / 2) + (fw / 2)), behavior: 'smooth' });
    }, 300);
  }

  // ===== RENDERING =====

  function renderTeam(mentors) {
    var coreContainer = document.getElementById('team-core-container');
    var mentorContainer = document.getElementById('team-mentor-container');
    if (!coreContainer && !mentorContainer) return;

    var timInti = [];
    var timMentor = [];

    mentors.forEach(function (m) {
      if (m.kategori === 'tim-inti') timInti.push(m);
      else timMentor.push(m);
    });

    if (coreContainer && timInti.length) {
      coreContainer.innerHTML = '';
      var grid = createEl('div', { className: 'team-core-grid-horizontal' });
      timInti.forEach(function (m, idx) {
        var isFounder = m.jabatan && m.jabatan.toLowerCase().indexOf('founder') !== -1;
        var cardClass = isFounder ? 'team-member founder-card' : 'team-member';
        var foto = resolveImg(m, 'foto', 300);
        var logo = resolveImg(m, 'logoKampus', 32);

        var html = '<img src="' + foto + '" alt="' + m.nama + '" class="team-member-img" loading="lazy" onerror="this.style.display=\'none\'">' +
          '<div class="team-member-info">' +
          '<h4 class="team-member-name">' + m.nama + '</h4>' +
          '<p class="team-member-role">' + m.jabatan + '</p>' +
          '<p class="team-member-school">';
        if (logo) {
          html += '<img class="school-logo" src="' + logo + '" alt="' + m.kampus + '" />';
        }
        html += m.kampus + '</p></div>';

        var article = createEl('article', { className: cardClass, 'data-id': m._id }, html);
        grid.appendChild(article);
      });
      coreContainer.appendChild(grid);
    }

    if (mentorContainer && timMentor.length) {
      mentorContainer.innerHTML = '';
      var mentorGrid = createEl('div', { className: 'team-tentors-grid' });
      timMentor.forEach(function (m) {
        var foto = resolveImg(m, 'foto', 300);
        var logo = resolveImg(m, 'logoKampus', 32);

        var html = '<img src="' + foto + '" alt="' + m.nama + '" class="team-member-img" loading="lazy" onerror="this.style.display=\'none\'">' +
          '<div class="team-member-info">' +
          '<h4 class="team-member-name">' + m.nama + '</h4>' +
          '<p class="team-member-role">' + m.jabatan + '</p>' +
          '<p class="team-member-school">';
        if (logo) {
          html += '<img class="school-logo" src="' + logo + '" alt="' + m.kampus + '" />';
        }
        html += m.kampus + '</p></div>';

        mentorGrid.appendChild(createEl('article', { className: 'team-member small', 'data-id': m._id }, html));
      });
      mentorContainer.appendChild(mentorGrid);
    }
  }

  function renderTestimonials(items) {
    var container = document.getElementById('testi-scroll-container');
    if (!container || !items.length) return;

    container.innerHTML = '';

    var cols = [[], [], []];
    items.forEach(function (item, i) {
      cols[i % 3].push(item);
    });

    var durations = ['22s', '30s', '18s'];

    cols.forEach(function (colData, idx) {
      if (!colData.length) {
        colData = items.slice(0, 3);
      }

      var track = createEl('div', { className: 'testi-scroll-track' });

      function makeCard(t) {
        var stars = '';
        var rating = t.rating || 5;
        for (var s = 0; s < rating; s++) stars += '<span class="star">★</span>';
        var pic = resolveImg(t, 'foto', 100);
        var avatarHtml = pic
          ? '<img class="testi-avatar-img" src="' + pic + '" alt="' + t.nama + '" loading="lazy" />'
          : '<div class="testi-avatar-new">' + t.nama.charAt(0) + '</div>';

        return '<article class="testi-card-new" data-id="' + (t._id || '') + '">' +
          '<div class="testi-rating">' + stars + '</div>' +
          '<div class="testi-quote-icon">"</div>' +
          '<p class="testi-quote-new">' + escapeHtml(t.isi) + '</p>' +
          '<div class="testi-author">' + avatarHtml +
          '<div class="testi-author-info">' +
          '<div class="testi-name-new">' + t.nama + '</div>' +
          '<div class="testi-meta-new">' + t.asalKampus + '</div>' +
          '</div></div></article>';
      }

      colData.forEach(function (t) {
        track.innerHTML += makeCard(t);
      });
      colData.forEach(function (t) {
        track.innerHTML += makeCard(t);
      });

      var col = createEl('div', {
        className: 'testi-scroll-column',
        style: '--duration: ' + durations[idx],
      });
      col.appendChild(track);
      container.appendChild(col);
    });
  }

  function renderNews(items) {
    var container = document.getElementById('news-container');
    if (!container) return;
    container.innerHTML = '';

    if (!items.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--color-muted);padding:40px 0">Belum ada berita terbaru.</p>';
      return;
    }

    var grid = createEl('div', { className: 'news-grid' });
    items.forEach(function (item) {
      var pic = resolveImg(item, 'gambar', 600);
      var date = item.tanggal || '';
      if (date) {
        var parts = date.split('-');
        if (parts.length === 3) {
          var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          date = parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
        }
      }

      var html = '<div class="news-card" data-id="' + (item._id || '') + '">';
      if (pic) {
        html += '<div class="news-image"><img src="' + pic + '" alt="' + item.judul + '" loading="lazy"></div>';
      }
      html += '<div class="news-body">' +
        '<span class="news-date">' + date + '</span>' +
        '<h3 class="news-title">' + item.judul + '</h3>' +
        '<p class="news-summary">' + escapeHtml(item.ringkasan) + '</p>' +
        '</div></div>';

      grid.innerHTML += html;
    });
    container.appendChild(grid);
  }

  function escapeHtml(text) {
    if (!text) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  // ===== LOADING STATES =====
  function showLoading(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '<div class="skeleton-container">' +
        '<div class="skeleton skeleton-card"></div>'.repeat(3) +
        '</div>';
    });
  }

  // ===== FETCH & RENDER =====
  function fetchAllAndRender() {
    showLoading(['team-core-container', 'team-mentor-container', 'testi-scroll-container', 'news-container']);

    var qMentors = '*[_type == "mentor"] | order(urutan asc) { ..., "fotoUrl": foto.asset->url, "logoKampusUrl": logoKampus.asset->url }';
    var qTestis = '*[_type == "testimonial"] { ..., "fotoUrl": foto.asset->url }';
    var qNews = '*[_type == "news"] | order(tanggal desc) { ..., "gambarUrl": gambar.asset->url }';

    return Promise.all([q(qMentors), q(qTestis), q(qNews)])
      .then(function (results) {
        var mentors = results[0].result || [];
        var testis = results[1].result || [];
        var newsItems = results[2].result || [];

        renderTeam(mentors);
        renderTestimonials(testis);
        renderNews(newsItems);
        scrollToFounderOnMobile();
        if (typeof AOS !== 'undefined') AOS.refresh();
      })
      .catch(function (err) {
        console.error('[Scholarify CMS] Gagal fetch data:', err);
        ['team-core-container', 'team-mentor-container', 'testi-scroll-container', 'news-container'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.innerHTML = '<p style="text-align:center;color:var(--color-muted);padding:40px">Gagal memuat data. Coba refresh halaman.</p>';
        });
      });
  }

  document.addEventListener('DOMContentLoaded', fetchAllAndRender);

  window.refreshScholarifyData = fetchAllAndRender;
})();
