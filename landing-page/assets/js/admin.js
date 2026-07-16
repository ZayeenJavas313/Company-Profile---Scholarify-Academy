(function () {
  'use strict';

  var API_BASE = '/api';

  // ===== STATE =====
  var isLoggedIn = false;
  var currentModal = null;
  var editingId = null;
  var editingType = null;

  // ===== UTILITY =====
  function $(sel) { return document.querySelector(sel); }

  function $$(sel) { return document.querySelectorAll(sel); }

  function api(path, opts) {
    return fetch(API_BASE + path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
      ...opts,
    }).then(function (r) { return r.json(); });
  }

  function esc(text) {
    if (!text) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  // ===== SESSION CHECK =====
  function checkSession() {
    return fetch(API_BASE + '/verify', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        isLoggedIn = data.loggedIn === true;
        updateAdminUI();
        return isLoggedIn;
      })
      .catch(function () {
        isLoggedIn = false;
        updateAdminUI();
        return false;
      });
  }

  // ===== LOGIN =====
  function showLoginForm() {
    var overlay = document.getElementById('admin-overlay');
    var modal = document.getElementById('admin-modal');
    if (!overlay || !modal) return;
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.innerHTML =
      '<div class="admin-modal-content" style="max-width:400px">' +
      '<h3 style="margin:0 0 20px;font-family:var(--font-heading)">Login Admin</h3>' +
      '<div id="login-error" style="color:#ef4444;font-size:14px;margin-bottom:12px;display:none"></div>' +
      '<label style="display:block;margin-bottom:6px;font-size:14px;font-weight:600">Password Admin</label>' +
      '<input type="password" id="login-password" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:16px;font-size:15px">' +
      '<div style="display:flex;gap:10px">' +
      '<button id="login-submit" class="liquid-glass" style="flex:1;padding:10px;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">Login</button>' +
      '<button id="login-cancel" style="padding:10px 20px;border:1px solid var(--color-card-border);border-radius:8px;background:transparent;color:var(--color-card-text);cursor:pointer;font-size:15px">Batal</button>' +
      '</div></div>';
    currentModal = 'login';

    $('#login-submit').addEventListener('click', doLogin);
    $('#login-cancel').addEventListener('click', hideModal);
    $('#login-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doLogin();
      if (e.key === 'Escape') hideModal();
    });
    setTimeout(function () { $('#login-password').focus(); }, 100);
  }

  function doLogin() {
    var pw = $('#login-password').value;
    var errEl = $('#login-error');
    var btn = $('#login-submit');
    if (!pw) {
      errEl.textContent = 'Masukkan password.';
      errEl.style.display = 'block';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    fetch(API_BASE + '/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          hideModal();
          isLoggedIn = true;
          updateAdminUI();
        } else {
          errEl.textContent = data.error || 'Login gagal.';
          errEl.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Login';
        }
      })
      .catch(function () {
        errEl.textContent = 'Terjadi kesalahan jaringan.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Login';
      });
  }

  function doLogout() {
    fetch(API_BASE + '/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).then(function () {
      isLoggedIn = false;
      updateAdminUI();
      if (typeof refreshScholarifyData === 'function') refreshScholarifyData();
    });
  }

  // ===== ADMIN UI =====
  function updateAdminUI() {
    var loginLink = document.getElementById('admin-login-link');
    var logoutBtn = document.getElementById('admin-logout-btn');
    var adminToolbar = document.getElementById('admin-toolbar');
    var addButtons = $$('.admin-add-btn');

    if (loginLink) loginLink.style.display = isLoggedIn ? 'none' : '';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? '' : 'none';
    if (adminToolbar) adminToolbar.style.display = isLoggedIn ? 'flex' : 'none';
    addButtons.forEach(function (b) { b.style.display = isLoggedIn ? '' : 'none'; });

    if (isLoggedIn) {
      injectActionButtons();
    } else {
      removeActionButtons();
    }
  }

  function injectActionButtons() {
    // Mentors
    $$('.team-member').forEach(function (card) {
      if (card.querySelector('.admin-actions')) return;
      var actions = document.createElement('div');
      actions.className = 'admin-actions';
      actions.innerHTML =
        '<button class="admin-btn-edit" data-type="mentor" title="Edit">✎</button>' +
        '<button class="admin-btn-delete" data-type="mentor" title="Hapus">✕</button>';
      card.style.position = 'relative';
      card.appendChild(actions);
    });

    // Testimonials
    $$('.testi-card-new').forEach(function (card) {
      if (card.querySelector('.admin-actions')) return;
      var actions = document.createElement('div');
      actions.className = 'admin-actions';
      actions.innerHTML =
        '<button class="admin-btn-edit" data-type="testimonial" title="Edit">✎</button>' +
        '<button class="admin-btn-delete" data-type="testimonial" title="Hapus">✕</button>';
      card.style.position = 'relative';
      card.appendChild(actions);
    });

    // News
    $$('.news-card').forEach(function (card) {
      if (card.querySelector('.admin-actions')) return;
      var actions = document.createElement('div');
      actions.className = 'admin-actions';
      actions.innerHTML =
        '<button class="admin-btn-edit" data-type="news" title="Edit">✎</button>' +
        '<button class="admin-btn-delete" data-type="news" title="Hapus">✕</button>';
      card.style.position = 'relative';
      card.appendChild(actions);
    });

    // Bind events (use event delegation to avoid duplicates)
    document.removeEventListener('click', handleAdminClick);
    document.addEventListener('click', handleAdminClick);
  }

  function removeActionButtons() {
    $$('.admin-actions').forEach(function (el) { el.remove(); });
    document.removeEventListener('click', handleAdminClick);
  }

  // ===== CLICK HANDLER =====
  function handleAdminClick(e) {
    var target = e.target.closest('.admin-btn-edit');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      openEditForm(target);
      return;
    }

    target = e.target.closest('.admin-btn-delete');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      openDeleteConfirm(target);
      return;
    }

    target = e.target.closest('.admin-add-btn');
    if (target) {
      e.preventDefault();
      openAddForm(target.dataset.type);
      return;
    }
  }

  // ===== GET DOCUMENT ID =====
  function getDocIdFromCard(card, type) {
    // Try data-id attribute first
    if (card.dataset.id) return card.dataset.id;
    // Fallback: find by Sanity ID pattern in HTML
    var img = card.querySelector('img[src*="sanity"]');
    if (img && img.dataset.id) return img.dataset.id;
    return null;
  }

  // ===== EDIT FORM =====
  function openEditForm(btn) {
    var card = btn.closest('.team-member, .testi-card-new, .news-card');
    var type = btn.dataset.type;
    if (!card || !type) return;

    editingType = type;
    editingId = getDocIdFromCard(card, type);
    var data = extractCardData(card, type);

    showCrudForm(type, data, editingId);
  }

  function extractCardData(card, type) {
    var data = {};
    if (type === 'mentor') {
      var nameEl = card.querySelector('.team-member-name');
      var roleEl = card.querySelector('.team-member-role');
      var schoolEl = card.querySelector('.team-member-school');
      data.nama = nameEl ? nameEl.textContent : '';
      data.jabatan = roleEl ? roleEl.textContent : '';
      data.kampus = schoolEl ? schoolEl.textContent.replace(/.*?(?=UGM|UNY|UI|ITB|ITS|UB|UNDIP|UNPAD|UNHAS)/, '').trim() : '';
      data.kategori = card.closest('.team-core-grid-horizontal') ? 'tim-inti' : 'tim-mentor';
    } else if (type === 'testimonial') {
      var nameEl = card.querySelector('.testi-name-new');
      var metaEl = card.querySelector('.testi-meta-new');
      var quoteEl = card.querySelector('.testi-quote-new');
      var ratingEl = card.querySelectorAll('.star');
      data.nama = nameEl ? nameEl.textContent : '';
      data.asalKampus = metaEl ? metaEl.textContent : '';
      data.isi = quoteEl ? quoteEl.textContent : '';
      data.rating = ratingEl.length || 5;
    } else if (type === 'news') {
      var titleEl = card.querySelector('.news-title');
      var summaryEl = card.querySelector('.news-summary');
      var dateEl = card.querySelector('.news-date');
      data.judul = titleEl ? titleEl.textContent : '';
      data.ringkasan = summaryEl ? summaryEl.textContent : '';
      data.tanggal = dateEl ? dateEl.textContent : '';
    }
    return data;
  }

  // ===== ADD FORM =====
  function openAddForm(type) {
    editingType = type;
    editingId = null;
    showCrudForm(type, {}, null);
  }

  // ===== CRUD MODAL =====
  function showCrudForm(type, data, id) {
    var overlay = document.getElementById('admin-overlay');
    var modal = document.getElementById('admin-modal');
    if (!overlay || !modal) return;

    var isEdit = !!id;
    var title = isEdit ? 'Edit ' : 'Tambah ';
    var typeLabels = { mentor: 'Mentor', testimonial: 'Testimoni', news: 'Berita' };
    title += typeLabels[type] || 'Data';

    var formHtml = '<div class="admin-modal-content"><h3 style="margin:0 0 20px;font-family:var(--font-heading)">' + title + '</h3>';
    formHtml += '<div id="crud-error" style="color:#ef4444;font-size:14px;margin-bottom:12px;display:none"></div>';

    if (type === 'mentor') {
      formHtml +=
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Nama</label>' +
        '<input type="text" id="f-nama" value="' + esc(data.nama) + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Jabatan</label>' +
        '<input type="text" id="f-jabatan" value="' + esc(data.jabatan) + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Kampus</label>' +
        '<input type="text" id="f-kampus" value="' + esc(data.kampus) + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Kategori</label>' +
        '<select id="f-kategori" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<option value="tim-inti"' + (data.kategori === 'tim-inti' ? ' selected' : '') + '>Tim Inti</option>' +
        '<option value="tim-mentor"' + (data.kategori === 'tim-mentor' || !data.kategori ? ' selected' : '') + '>Tim Mentor</option></select>' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Foto (upload baru atau kosongkan)</label>' +
        '<input type="file" id="f-foto" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Logo Kampus (upload baru atau kosongkan)</label>' +
        '<input type="file" id="f-logo" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">';
    } else if (type === 'testimonial') {
      formHtml +=
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Nama</label>' +
        '<input type="text" id="f-nama" value="' + esc(data.nama) + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Asal Kampus</label>' +
        '<input type="text" id="f-asalKampus" value="' + esc(data.asalKampus || '') + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Isi Testimoni</label>' +
        '<textarea id="f-isi" rows="4" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px;resize:vertical">' + esc(data.isi || '') + '</textarea>' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Rating (1-5)</label>' +
        '<input type="number" id="f-rating" min="1" max="5" value="' + (data.rating || 5) + '" style="width:80px;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Foto (upload baru atau kosongkan)</label>' +
        '<input type="file" id="f-foto" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">';
    } else if (type === 'news') {
      formHtml +=
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Judul</label>' +
        '<input type="text" id="f-judul" value="' + esc(data.judul || '') + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Ringkasan</label>' +
        '<textarea id="f-ringkasan" rows="3" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px;resize:vertical">' + esc(data.ringkasan || '') + '</textarea>' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Tanggal</label>' +
        '<input type="date" id="f-tanggal" value="' + esc(data.tanggal || new Date().toISOString().split('T')[0]) + '" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Gambar (upload baru atau kosongkan)</label>' +
        '<input type="file" id="f-gambar" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">';
    }

    formHtml +=
      '<div id="crud-status" style="font-size:14px;margin-bottom:12px;display:none"></div>' +
      '<div style="display:flex;gap:10px">' +
      '<button id="crud-submit" class="liquid-glass" style="flex:1;padding:10px;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">' + (isEdit ? 'Simpan Perubahan' : 'Tambah') + '</button>' +
      '<button id="crud-cancel" style="padding:10px 20px;border:1px solid var(--color-card-border);border-radius:8px;background:transparent;color:var(--color-card-text);cursor:pointer;font-size:15px">Batal</button>' +
      '</div></div>';

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.innerHTML = formHtml;
    currentModal = 'crud';

    $('#crud-submit').addEventListener('click', function () { submitCrud(type, id); });
    $('#crud-cancel').addEventListener('click', hideModal);
  }

  // ===== SUBMIT CRUD =====
  function submitCrud(type, id) {
    var btn = $('#crud-submit');
    var errEl = $('#crud-error');
    var statusEl = $('#crud-status');
    errEl.style.display = 'none';
    statusEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    // Upload images first if any
    var fotoRef = null;
    var logoRef = null;
    var gambarRef = null;

    var fotoFile = $('#f-foto')?.files?.[0];
    var logoFile = $('#f-logo')?.files?.[0];
    var gambarFile = $('#f-gambar')?.files?.[0];

    var uploads = [];
    if (fotoFile) uploads.push(uploadImage(fotoFile).then(function (r) { fotoRef = r.ref; }));
    if (logoFile) uploads.push(uploadImage(logoFile).then(function (r) { logoRef = r.ref; }));
    if (gambarFile) uploads.push(uploadImage(gambarFile).then(function (r) { gambarRef = r.ref; }));

    Promise.all(uploads)
      .then(function () {
        var payload = {};
        if (type === 'mentor') {
          payload.nama = $('#f-nama').value.trim();
          payload.jabatan = $('#f-jabatan').value.trim();
          payload.kampus = $('#f-kampus').value.trim();
          payload.kategori = $('#f-kategori').value;
          if (fotoRef) payload.foto = fotoRef;
          if (logoRef) payload.logoKampus = logoRef;
        } else if (type === 'testimonial') {
          payload.nama = $('#f-nama').value.trim();
          payload.asalKampus = $('#f-asalKampus').value.trim();
          payload.isi = $('#f-isi').value.trim();
          payload.rating = parseInt($('#f-rating').value, 10) || 5;
          if (fotoRef) payload.foto = fotoRef;
        } else if (type === 'news') {
          payload.judul = $('#f-judul').value.trim();
          payload.ringkasan = $('#f-ringkasan').value.trim();
          payload.tanggal = $('#f-tanggal').value;
          if (gambarRef) payload.gambar = gambarRef;
        }

        var method = id ? 'PATCH' : 'POST';
        var url = '/api/' + type + 's' + (id ? '/' + id : '');

        return fetch(url, {
          method: method,
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          statusEl.textContent = '✓ Berhasil disimpan! Memperbarui tampilan...';
          statusEl.style.display = 'block';
          statusEl.style.color = '#14B8A6';
          setTimeout(function () {
            hideModal();
            if (typeof refreshScholarifyData === 'function') refreshScholarifyData();
          }, 800);
        } else {
          errEl.textContent = data.error || 'Gagal menyimpan.';
          errEl.style.display = 'block';
          btn.disabled = false;
          btn.textContent = id ? 'Simpan Perubahan' : 'Tambah';
        }
      })
      .catch(function (err) {
        errEl.textContent = 'Terjadi kesalahan: ' + (err.message || 'Unknown');
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = id ? 'Simpan Perubahan' : 'Tambah';
      });
  }

  function uploadImage(file) {
    var formData = new FormData();
    formData.append('image', file);
    return fetch('/api/upload-image', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    }).then(function (r) { return r.json(); });
  }

  // ===== DELETE =====
  function openDeleteConfirm(btn) {
    var card = btn.closest('.team-member, .testi-card-new, .news-card');
    var type = btn.dataset.type;
    if (!card || !type) return;

    var id = getDocIdFromCard(card, type);
    var label = '';
    if (type === 'mentor') {
      var nameEl = card.querySelector('.team-member-name');
      label = 'mentor "' + (nameEl ? nameEl.textContent : '') + '"';
    } else if (type === 'testimonial') {
      var nameEl = card.querySelector('.testi-name-new');
      label = 'testimoni "' + (nameEl ? nameEl.textContent : '') + '"';
    } else if (type === 'news') {
      var titleEl = card.querySelector('.news-title');
      label = 'berita "' + (titleEl ? titleEl.textContent : '') + '"';
    }

    if (!confirm('Hapus ' + label + '? Tindakan ini tidak bisa dibatalkan.')) return;

    var url = '/api/' + type + 's/' + (id || '');

    fetch(url, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          if (typeof refreshScholarifyData === 'function') refreshScholarifyData();
        } else {
          alert('Gagal menghapus: ' + (data.error || 'Unknown'));
        }
      })
      .catch(function () {
        alert('Terjadi kesalahan jaringan.');
      });
  }

  // ===== MODAL =====
  function hideModal() {
    var overlay = document.getElementById('admin-overlay');
    var modal = document.getElementById('admin-modal');
    if (overlay) overlay.classList.add('hidden');
    if (modal) modal.classList.add('hidden');
    currentModal = null;
    editingId = null;
    editingType = null;
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
    // Inject overlay & modal if not present
    if (!document.getElementById('admin-overlay')) {
      var overlay = document.createElement('div');
      overlay.id = 'admin-overlay';
      overlay.className = 'admin-overlay hidden';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', hideModal);
    }
    if (!document.getElementById('admin-modal')) {
      var modal = document.createElement('div');
      modal.id = 'admin-modal';
      modal.className = 'admin-modal hidden';
      document.body.appendChild(modal);
    }

    checkSession();
  });

  // Expose functions for inline use
  window.admin = {
    showLogin: showLoginForm,
    logout: doLogout,
  };

  // Re-inject buttons after CMS refresh
  var origRefresh = window.refreshScholarifyData;
  if (origRefresh) {
    window.refreshScholarifyData = function () {
      origRefresh();
      setTimeout(function () {
        if (isLoggedIn) injectActionButtons();
      }, 500);
    };
  }
})();
