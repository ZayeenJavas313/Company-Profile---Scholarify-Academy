(function () {
  'use strict';

  var API_BASE = '/api';

  // ===== STATE =====
  var isLoggedIn = false;
  var currentModal = null;
  var editingId = null;
  var editingType = null;
  var quillEditor = null;

  // ===== UTILITY =====
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function esc(text) {
    if (!text) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  // ===== QUILL LOADER =====
  var quillLoaded = false;
  function loadQuill() {
    if (quillLoaded) return Promise.resolve();
    return new Promise(function (resolve) {
      if (window.Quill) { quillLoaded = true; resolve(); return; }
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
      document.head.appendChild(link);

      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
      script.onload = function () { quillLoaded = true; resolve(); };
      document.head.appendChild(script);
    });
  }

  // ===== SANITY BLOCK CONTENT <-> QUILL DELTA =====
  function deltaToBlocks(delta) {
    if (!delta || !delta.ops) return [];
    var blocks = [];
    var currentInline = [];

    function flushInline() {
      if (currentInline.length === 0) return null;
      var text = '';
      var marks = [];
      currentInline.forEach(function (op) {
        text += op.insert || '';
        if (op.attributes) {
          Object.keys(op.attributes).forEach(function (k) {
            if (k === 'bold') marks.push('strong');
            else if (k === 'italic') marks.push('em');
            else if (k === 'code') marks.push('code');
            else if (k === 'underline') marks.push('underline');
            else if (k === 'strike') marks.push('strike-through');
            else if (k === 'link') marks.push({ _type: 'link', href: op.attributes.link || '#' });
          });
        }
      });
      currentInline = [];
      return { _type: 'span', text: text, marks: marks.length ? marks : undefined };
    }

    delta.ops.forEach(function (op) {
      if (typeof op.insert === 'string') {
        var lines = op.insert.split('\n');
        lines.forEach(function (line, i) {
          if (line) {
            currentInline.push({ insert: line, attributes: op.attributes });
          }
          if (i < lines.length - 1) {
            var span = flushInline();
            blocks.push({ _type: 'block', style: 'normal', children: span ? [span] : [{ _type: 'span', text: '' }] });
          }
        });
      } else if (typeof op.insert === 'object' && op.insert && op.insert.image) {
        var span = flushInline();
        if (span) blocks.push({ _type: 'block', style: 'normal', children: [span] });
        var imgUrl = op.insert.image;
        if (imgUrl && imgUrl.indexOf('data:') === 0) continue;
        blocks.push({ _type: 'image', asset: { _ref: imgUrl } });
      }
    });

    var lastSpan = flushInline();
    if (lastSpan) blocks.push({ _type: 'block', style: 'normal', children: [lastSpan] });

    var cleaned = [];
    blocks.forEach(function (b) {
      if (b._type === 'block' && b.children && b.children.length === 1 && b.children[0].text === '' && cleaned.length > 0) return;
      cleaned.push(b);
    });
    return cleaned;
  }

  function blocksToDelta(blocks) {
    if (!blocks || !Array.isArray(blocks)) return { ops: [] };
    var ops = [];

    blocks.forEach(function (block, idx) {
      if (idx > 0) ops.push({ insert: '\n' });

      if (block._type === 'image') {
        var url = '';
        if (block.asset && block.asset._ref) {
          var ref = block.asset._ref;
          var base = ref.replace(/^image-/, '');
          var lastDash = base.lastIndexOf('-');
          var format = base.substring(lastDash + 1);
          var rest = base.substring(0, lastDash);
          var dimDash = rest.lastIndexOf('-');
          var imageId = rest.substring(0, dimDash);
          url = 'https://cdn.sanity.io/images/gbwew0c6/production/' + imageId + '-800x600.' + format;
        } else if (block.asset && block.asset.url) {
          url = block.asset.url;
        }
        if (url) ops.push({ insert: { image: url } });
        return;
      }

      if (block._type !== 'block' || !block.children) return;
      var style = block.style || 'normal';

      block.children.forEach(function (child, cIdx) {
        if (child._type === 'span') {
          var attrs = {};
          if (child.marks) {
            child.marks.forEach(function (mark) {
              if (mark === 'strong') attrs.bold = true;
              else if (mark === 'em') attrs.italic = true;
              else if (mark === 'code') attrs.code = true;
              else if (mark === 'underline') attrs.underline = true;
              else if (mark === 'strike-through') attrs.strike = true;
              else if (typeof mark === 'object' && mark._type === 'link' && mark.href) attrs.link = mark.href;
            });
          }
          if (style === 'h2') attrs.header = 2;
          else if (style === 'h3') attrs.header = 3;
          else if (style === 'h4') attrs.header = 4;
          else if (style === 'blockquote') attrs.blockquote = true;

          ops.push({ insert: child.text || '', attributes: Object.keys(attrs).length ? attrs : undefined });
        }
      });
    });

    return { ops: ops };
  }

  function blocksToPlainText(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';
    var text = '';
    blocks.forEach(function (block) {
      if (block._type === 'block' && block.children) {
        block.children.forEach(function (child) {
          if (child.text) text += child.text;
        });
        text += '\n';
      }
    });
    return text.trim();
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
    window.location.href = '/login';
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
    var navBtn = document.getElementById('admin-login-btn');
    var mobileAdmin = document.getElementById('nav-mobile-admin');

    if (loginLink) loginLink.style.display = isLoggedIn ? 'none' : '';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? '' : 'none';
    if (adminToolbar) adminToolbar.style.display = isLoggedIn ? 'flex' : 'none';
    addButtons.forEach(function (b) { b.style.display = isLoggedIn ? '' : 'none'; });

    if (mobileAdmin) {
      if (isLoggedIn) {
        mobileAdmin.textContent = 'Logout Admin';
        mobileAdmin.href = '#';
        mobileAdmin.onclick = function (e) { e.preventDefault(); closeMobileNav(); doLogout(); };
      } else {
        mobileAdmin.textContent = 'Login Admin';
        mobileAdmin.href = '/login';
        mobileAdmin.onclick = function (e) { e.preventDefault(); closeMobileNav(); window.location.href = '/login'; };
      }
    }

    if (navBtn) {
      if (isLoggedIn) {
        navBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span style="margin-left:6px;font-size:13px">Logout Admin</span>';
        navBtn.title = 'Logout Admin';
        navBtn.setAttribute('aria-label', 'Logout Admin');
        navBtn.onclick = function (e) { e.preventDefault(); doLogout(); };
      } else {
        navBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><span style="margin-left:6px;font-size:13px">Login Admin</span>';
        navBtn.title = 'Login Admin';
        navBtn.setAttribute('aria-label', 'Login Admin');
        navBtn.onclick = function (e) { e.preventDefault(); showLoginForm(); };
      }
    }

    if (isLoggedIn) {
      injectActionButtons();
      document.body.classList.add('admin-logged-in');
    } else {
      removeActionButtons();
      document.body.classList.remove('admin-logged-in');
    }
  }

  function closeMobileNav() {
    var hamburger = document.getElementById('navHamburger');
    var navMobile = document.getElementById('navMobile');
    if (hamburger) hamburger.classList.remove('active');
    if (navMobile) navMobile.classList.remove('open');
  }

  function injectActionButtons() {
    $$('.team-member').forEach(function (card) {
      if (card.querySelector('.admin-actions')) return;
      var actions = document.createElement('div');
      actions.className = 'admin-actions';
      actions.innerHTML =
        '<button class="admin-btn-edit" data-type="mentor" title="Edit">✎ Edit</button>' +
        '<button class="admin-btn-delete" data-type="mentor" title="Hapus">✕ Hapus</button>';
      card.style.position = 'relative';
      card.appendChild(actions);
    });

    $$('.testi-card-new').forEach(function (card) {
      if (card.querySelector('.admin-actions')) return;
      var actions = document.createElement('div');
      actions.className = 'admin-actions';
      actions.innerHTML =
        '<button class="admin-btn-edit" data-type="testimonial" title="Edit">✎ Edit</button>' +
        '<button class="admin-btn-delete" data-type="testimonial" title="Hapus">✕ Hapus</button>';
      card.style.position = 'relative';
      card.appendChild(actions);
    });

    $$('.news-card').forEach(function (card) {
      if (card.querySelector('.admin-actions')) return;
      var actions = document.createElement('div');
      actions.className = 'admin-actions';
      actions.innerHTML =
        '<button class="admin-btn-edit" data-type="news" title="Edit">✎ Edit</button>' +
        '<button class="admin-btn-delete" data-type="news" title="Hapus">✕ Hapus</button>';
      card.style.position = 'relative';
      card.appendChild(actions);
    });

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
    if (target) { e.preventDefault(); e.stopPropagation(); openEditForm(target); return; }
    target = e.target.closest('.admin-btn-delete');
    if (target) { e.preventDefault(); e.stopPropagation(); openDeleteConfirm(target); return; }
    target = e.target.closest('.admin-add-btn');
    if (target) { e.preventDefault(); openAddForm(target.dataset.type); return; }
  }

  function getDocIdFromCard(card, type) {
    if (card.dataset.id) return card.dataset.id;
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
      data.nama = (card.querySelector('.team-member-name') || {}).textContent || '';
      data.jabatan = (card.querySelector('.team-member-role') || {}).textContent || '';
      data.kampus = (card.querySelector('.team-member-school') || {}).textContent || '';
      data.kategori = card.closest('.team-core-grid-horizontal') ? 'tim-inti' : 'tim-mentor';
    } else if (type === 'testimonial') {
      data.nama = (card.querySelector('.testi-name-new') || {}).textContent || '';
      data.asalKampus = (card.querySelector('.testi-meta-new') || {}).textContent || '';
      data.isi = (card.querySelector('.testi-quote-new') || {}).textContent || '';
      data.rating = card.querySelectorAll('.star').length || 5;
    } else if (type === 'news') {
      data.judul = (card.querySelector('.news-title') || {}).textContent || '';
      data.ringkasan = (card.querySelector('.news-summary') || {}).textContent || '';
      data.tanggal = (card.querySelector('.news-date') || {}).textContent || '';
      data.isiLengkap = card.dataset.isiLengkap || '';
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

    var formHtml = '<div class="admin-modal-content" style="max-width:' + (type === 'news' ? '720px' : '480px') + '">';
    formHtml += '<h3 style="margin:0 0 20px;font-family:var(--font-heading)">' + title + '</h3>';
    formHtml += '<div id="crud-error" style="color:#ef4444;font-size:14px;margin-bottom:12px;display:none"></div>';

    var inputStyle = 'width:100%;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px;font-family:var(--font-body)';
    var labelStyle = 'display:block;margin-bottom:4px;font-size:13px;font-weight:600';

    if (type === 'mentor') {
      formHtml +=
        '<label style="' + labelStyle + '">Nama</label><input type="text" id="f-nama" value="' + esc(data.nama) + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Jabatan</label><input type="text" id="f-jabatan" value="' + esc(data.jabatan) + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Kampus</label><input type="text" id="f-kampus" value="' + esc(data.kampus) + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Kategori</label><select id="f-kategori" style="' + inputStyle + '">' +
        '<option value="tim-inti"' + (data.kategori === 'tim-inti' ? ' selected' : '') + '>Tim Inti</option>' +
        '<option value="tim-mentor"' + (data.kategori === 'tim-mentor' || !data.kategori ? ' selected' : '') + '>Tim Mentor</option></select>' +
        '<label style="' + labelStyle + '">Foto (upload baru atau kosongkan)</label><input type="file" id="f-foto" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">' +
        '<label style="' + labelStyle + '">Logo Kampus (upload baru atau kosongkan)</label><input type="file" id="f-logo" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">';
    } else if (type === 'testimonial') {
      formHtml +=
        '<label style="' + labelStyle + '">Nama</label><input type="text" id="f-nama" value="' + esc(data.nama) + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Asal Kampus</label><input type="text" id="f-asalKampus" value="' + esc(data.asalKampus || '') + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Isi Testimoni</label><textarea id="f-isi" rows="4" style="' + inputStyle + 'resize:vertical">' + esc(data.isi || '') + '</textarea>' +
        '<label style="' + labelStyle + '">Rating (1-5)</label><input type="number" id="f-rating" min="1" max="5" value="' + (data.rating || 5) + '" style="width:80px;padding:10px 14px;border-radius:8px;border:1px solid var(--color-card-border);background:var(--color-card-bg);color:var(--color-card-text);margin-bottom:12px;font-size:14px">' +
        '<label style="' + labelStyle + '">Foto (upload baru atau kosongkan)</label><input type="file" id="f-foto" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">';
    } else if (type === 'news') {
      formHtml +=
        '<label style="' + labelStyle + '">Judul</label><input type="text" id="f-judul" value="' + esc(data.judul || '') + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Ringkasan</label><textarea id="f-ringkasan" rows="3" style="' + inputStyle + 'resize:vertical">' + esc(data.ringkasan || '') + '</textarea>' +
        '<label style="' + labelStyle + '">Tanggal</label><input type="date" id="f-tanggal" value="' + esc(data.tanggal || new Date().toISOString().split('T')[0]) + '" style="' + inputStyle + '">' +
        '<label style="' + labelStyle + '">Gambar Sampul (upload baru atau kosongkan)</label><input type="file" id="f-gambar" accept="image/*" style="width:100%;margin-bottom:12px;font-size:14px">' +
        '<label style="' + labelStyle + '">Isi Artikel</label>' +
        '<div id="quill-toolbar" style="border:1px solid var(--color-card-border);border-bottom:none;border-radius:8px 8px 0 0;background:#f8fafc;padding:8px">' +
        '<span class="ql-formats"><button class="ql-bold" title="Bold"></button><button class="ql-italic" title="Italic"></button><button class="ql-underline" title="Underline"></button><button class="ql-strike" title="Strike"></button></span>' +
        '<span class="ql-formats"><button class="ql-header" value="2" title="Heading 2"></button><button class="ql-header" value="3" title="Heading 3"></button></span>' +
        '<span class="ql-formats"><button class="ql-blockquote" title="Quote"></button><button class="ql-code-block" title="Code Block"></button></span>' +
        '<span class="ql-formats"><button class="ql-list" value="ordered" title="Numbered List"></button><button class="ql-list" value="bullet" title="Bullet List"></button></span>' +
        '<span class="ql-formats"><button class="ql-link" title="Insert Link"></button><button id="quill-image-btn" title="Insert Image"></button></span>' +
        '<span class="ql-formats"><button class="ql-clean" title="Clear Formatting"></button></span>' +
        '</div>' +
        '<div id="f-editor" style="height:300px;border:1px solid var(--color-card-border);border-radius:0 0 8px 8px;background:#fff;color:#111;font-size:15px"></div>' +
        '<input type="hidden" id="f-isiLengkap">';
    }

    formHtml +=
      '<div id="crud-status" style="font-size:14px;margin-bottom:12px;display:none"></div>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
      '<button id="crud-submit" class="liquid-glass" style="flex:1;padding:10px;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">' + (isEdit ? 'Simpan Perubahan' : 'Tambah') + '</button>' +
      '<button id="crud-cancel" style="padding:10px 20px;border:1px solid var(--color-card-border);border-radius:8px;background:transparent;color:var(--color-card-text);cursor:pointer;font-size:15px">Batal</button>' +
      '</div></div>';

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.innerHTML = formHtml;
    currentModal = 'crud';

    $('#crud-submit').addEventListener('click', function () { submitCrud(type, id); });
    $('#crud-cancel').addEventListener('click', hideModal);

    if (type === 'news') {
      initQuillEditor(data.isiLengkap);
    }
  }

  // ===== QUILL INIT =====
  function initQuillEditor(existingContent) {
    loadQuill().then(function () {
      var toolbarHandler = function () {
        var range = this.quill.getSelection();
        if (!range) return;
        var value = this.value;
        if (value === 'image') {
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = function () {
            var file = input.files[0];
            if (!file) return;
            var statusEl = $('#crud-status');
            if (statusEl) { statusEl.textContent = 'Uploading gambar...'; statusEl.style.display = 'block'; statusEl.style.color = '#F59E0B'; }
            uploadImage(file).then(function (r) {
              if (r.url) {
                quillEditor.insertEmbed(range.index, 'image', r.url);
                quillEditor.setSelection(range.index + 1);
              }
              if (statusEl) statusEl.style.display = 'none';
            }).catch(function () {
              if (statusEl) { statusEl.textContent = 'Gagal upload gambar'; statusEl.style.color = '#ef4444'; }
            });
          };
          input.click();
        }
      };

      quillEditor = new Quill('#f-editor', {
        theme: 'snow',
        modules: {
          toolbar: {
            container: '#quill-toolbar',
            handlers: { image: toolbarHandler }
          }
        },
        placeholder: 'Tulis isi artikel di sini...'
      });

      var imgBtn = document.getElementById('quill-image-btn');
      if (imgBtn) {
        imgBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        imgBtn.className = '';
      }

      if (existingContent) {
        try {
          var parsed = JSON.parse(existingContent);
          var delta = blocksToDelta(parsed);
          if (delta.ops && delta.ops.length) quillEditor.setContents(delta);
        } catch (e) {
          quillEditor.setText(existingContent);
        }
      }
    });
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

    var fotoRef = null, logoRef = null, gambarRef = null;
    var fotoFile = $('#f-foto') && $('#f-foto').files && $('#f-foto').files[0];
    var logoFile = $('#f-logo') && $('#f-logo').files && $('#f-logo').files[0];
    var gambarFile = $('#f-gambar') && $('#f-gambar').files && $('#f-gambar').files[0];

    var uploads = [];
    if (fotoFile) uploads.push(uploadImage(fotoFile).then(function (r) { fotoRef = r.ref; }));
    if (logoFile) uploads.push(uploadImage(logoFile).then(function (r) { logoRef = r.ref; }));
    if (gambarFile) uploads.push(uploadImage(gambarFile).then(function (r) { gambarRef = r.ref; }));

    Promise.all(uploads)
      .then(function () {
        var payload = {};
        if (type === 'mentor') {
          payload.nama = ($('#f-nama') || {}).value || '';
          payload.jabatan = ($('#f-jabatan') || {}).value || '';
          payload.kampus = ($('#f-kampus') || {}).value || '';
          payload.kategori = ($('#f-kategori') || {}).value || 'tim-mentor';
          if (fotoRef) payload.foto = fotoRef;
          if (logoRef) payload.logoKampus = logoRef;
        } else if (type === 'testimonial') {
          payload.nama = ($('#f-nama') || {}).value || '';
          payload.asalKampus = ($('#f-asalKampus') || {}).value || '';
          payload.isi = ($('#f-isi') || {}).value || '';
          payload.rating = parseInt(($('#f-rating') || {}).value, 10) || 5;
          if (fotoRef) payload.foto = fotoRef;
        } else if (type === 'news') {
          payload.judul = ($('#f-judul') || {}).value || '';
          payload.ringkasan = ($('#f-ringkasan') || {}).value || '';
          payload.tanggal = ($('#f-tanggal') || {}).value || '';
          if (gambarRef) payload.gambar = gambarRef;
          if (quillEditor) {
            var delta = quillEditor.getContents();
            var blocks = deltaToBlocks(delta);
            payload.isiLengkap = JSON.stringify(blocks);
          } else {
            payload.isiLengkap = ($('#f-isiLengkap') || {}).value || '';
          }
        }

        var method = id ? 'PATCH' : 'POST';
        var plural = { mentor: 'mentors', testimonial: 'testimonials', news: 'news' }[type] || type + 's';
        var url = '/api/' + plural + (id ? '/' + id : '');

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
          statusEl.textContent = '✓ Berhasil disimpan!';
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
    if (type === 'mentor') label = 'mentor "' + ((card.querySelector('.team-member-name') || {}).textContent || '') + '"';
    else if (type === 'testimonial') label = 'testimoni "' + ((card.querySelector('.testi-name-new') || {}).textContent || '') + '"';
    else if (type === 'news') label = 'berita "' + ((card.querySelector('.news-title') || {}).textContent || '') + '"';

    var overlay = document.getElementById('admin-overlay');
    var modal = document.getElementById('admin-modal');
    if (!overlay || !modal) return;

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    currentModal = 'confirm-delete';
    modal.innerHTML =
      '<div class="admin-modal-content" style="max-width:400px;text-align:center">' +
      '<div style="font-size:48px;margin-bottom:12px">🗑️</div>' +
      '<h3 style="margin:0 0 8px;font-family:var(--font-heading)">Hapus ' + label + '?</h3>' +
      '<p style="color:var(--color-muted);font-size:14px;margin:0 0 20px">Tindakan ini tidak bisa dibatalkan.</p>' +
      '<div id="delete-status" style="font-size:14px;margin-bottom:12px;display:none"></div>' +
      '<div style="display:flex;gap:10px">' +
      '<button id="delete-yes" class="liquid-glass" style="flex:1;padding:10px;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;background:#ef4444;color:#fff">Ya, Hapus</button>' +
      '<button id="delete-no" style="padding:10px 20px;border:1px solid var(--color-card-border);border-radius:8px;background:transparent;color:var(--color-card-text);cursor:pointer;font-size:15px">Batal</button>' +
      '</div></div>';

    $('#delete-yes').addEventListener('click', function () {
      var statusEl = $('#delete-status');
      var btnYes = $('#delete-yes');
      btnYes.disabled = true;
      btnYes.textContent = 'Menghapus...';
      statusEl.style.display = 'none';

      var plural = { mentor: 'mentors', testimonial: 'testimonials', news: 'news' }[type] || type + 's';
      var url = '/api/' + plural + '/' + (id || '');
      fetch(url, { method: 'DELETE', credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            statusEl.textContent = '✓ Berhasil dihapus!';
            statusEl.style.display = 'block';
            statusEl.style.color = '#14B8A6';
            setTimeout(function () {
              hideModal();
              if (typeof refreshScholarifyData === 'function') refreshScholarifyData();
            }, 800);
          } else {
            statusEl.textContent = 'Gagal: ' + (data.error || 'Unknown');
            statusEl.style.display = 'block';
            statusEl.style.color = '#ef4444';
            btnYes.disabled = false;
            btnYes.textContent = 'Ya, Hapus';
          }
        })
        .catch(function () {
          statusEl.textContent = 'Terjadi kesalahan jaringan.';
          statusEl.style.display = 'block';
          statusEl.style.color = '#ef4444';
          btnYes.disabled = false;
          btnYes.textContent = 'Ya, Hapus';
        });
    });
    $('#delete-no').addEventListener('click', hideModal);
  }

  // ===== MODAL =====
  function hideModal() {
    var overlay = document.getElementById('admin-overlay');
    var modal = document.getElementById('admin-modal');
    if (overlay) overlay.classList.add('hidden');
    if (modal) modal.classList.add('hidden');
    quillEditor = null;
    currentModal = null;
    editingId = null;
    editingType = null;
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
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

  window.admin = { showLogin: showLoginForm, logout: doLogout };

  var origRefresh = window.refreshScholarifyData;
  if (origRefresh) {
    window.refreshScholarifyData = function () {
      return (origRefresh() || Promise.resolve()).then(function () {
        if (isLoggedIn) injectActionButtons();
      });
    };
  }
})();
