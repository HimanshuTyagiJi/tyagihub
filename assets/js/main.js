// ==========================================================================
// TyagiHub Main Client Script: Mobile Drawer, Theme Switcher & Live Search
// ==========================================================================

(function() {
  'use strict';

  // --- 1. THEME SWITCHER ---
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  function updateThemeIcons() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtns.forEach(btn => {
      const icon = btn.querySelector('.theme-icon') || btn;
      icon.textContent = isDark ? '☀️' : '🌙';
    });
  }

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('th_theme', next);
      updateThemeIcons();
    });
  });
  updateThemeIcons();

  // --- 2. MOBILE DRAWER TOGGLE ---
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  function openDrawer() {
    if (hamburgerBtn) hamburgerBtn.classList.add('is-active');
    if (mobileDrawer) mobileDrawer.classList.add('is-active');
    if (drawerOverlay) drawerOverlay.classList.add('is-active');
    document.body.classList.add('no-scroll');
  }

  function closeDrawer() {
    if (hamburgerBtn) hamburgerBtn.classList.remove('is-active');
    if (mobileDrawer) mobileDrawer.classList.remove('is-active');
    if (drawerOverlay) drawerOverlay.classList.remove('is-active');
    document.body.classList.remove('no-scroll');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer && mobileDrawer.classList.contains('is-active');
      isOpen ? closeDrawer() : openDrawer();
    });
  }

  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // --- 3. LIVE SEARCH SYSTEM ---
  let searchIndex = null;
  const searchModal = document.getElementById('search-modal');
  const searchTriggerBtns = document.querySelectorAll('.search-trigger-btn');
  const searchCloseBtn = document.getElementById('search-close-btn');
  const searchMainInput = document.getElementById('search-main-input');
  const searchResultsList = document.getElementById('search-results-list');
  const mobileSearchInput = document.getElementById('mobile-search-input');

  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    try {
      const res = await fetch('/search.json');
      if (res.ok) {
        searchIndex = await res.json();
      }
    } catch (e) {
      console.warn('Search index load failed:', e);
      searchIndex = [];
    }
    return searchIndex || [];
  }

  function openSearchModal() {
    if (searchModal) {
      searchModal.classList.add('is-active');
      document.body.classList.add('no-scroll');
      loadSearchIndex();
      setTimeout(() => {
        if (searchMainInput) {
          searchMainInput.focus();
          searchMainInput.select();
        }
      }, 50);
    }
  }

  function closeSearchModal() {
    if (searchModal) {
      searchModal.classList.remove('is-active');
      document.body.classList.remove('no-scroll');
      if (searchMainInput) searchMainInput.value = '';
      if (searchResultsList) searchResultsList.innerHTML = '';
    }
  }

  searchTriggerBtns.forEach(btn => btn.addEventListener('click', openSearchModal));
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearchModal);

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearchModal();
    });
  }

  // Keyboard shortcut: Press "/" or "Ctrl+K" to open search
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearchModal();
      closeDrawer();
    }
    if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearchModal();
    }
  });

  function performSearch(query, container) {
    if (!container) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      container.innerHTML = '<li class="search-empty-state">Type keywords to search verified tech guides...</li>';
      return;
    }

    if (!searchIndex || searchIndex.length === 0) {
      container.innerHTML = '<li class="search-empty-state">Loading guides index...</li>';
      return;
    }

    const matches = searchIndex.filter(item => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const descMatch = (item.description || '').toLowerCase().includes(q);
      const catMatch = (item.categories || '').toLowerCase().includes(q);
      const tagMatch = (item.tags || []).some(t => t.toLowerCase().includes(q));
      return titleMatch || descMatch || catMatch || tagMatch;
    });

    if (matches.length === 0) {
      container.innerHTML = `<li class="search-empty-state">No guides found matching <strong>"${query}"</strong>.</li>`;
      return;
    }

    container.innerHTML = matches.map(item => `
      <li class="search-result-item">
        <a href="${item.permalink}">
          <div class="search-res-cat">${item.categories || 'Guide'}</div>
          <div class="search-res-title">${item.title}</div>
          <div class="search-res-desc">${item.description}</div>
        </a>
      </li>
    `).join('');
  }

  if (searchMainInput) {
    searchMainInput.addEventListener('input', (e) => {
      performSearch(e.target.value, searchResultsList);
    });
  }

  // Mobile drawer search input -> opens search modal and transfers query
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('focus', () => {
      const q = mobileSearchInput.value;
      closeDrawer();
      openSearchModal();
      if (searchMainInput) {
        searchMainInput.value = q;
        performSearch(q, searchResultsList);
      }
    });
  }

  // --- 4. READING PROGRESS BAR ---
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + '%';
      }
    }, { passive: true });
  }

  // --- 5. BACK TO TOP BUTTON ---
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('is-active');
      } else {
        backToTopBtn.classList.remove('is-active');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 6. SOCIAL SHARE & COPY LINK ---
  const copyLinkBtn = document.getElementById('copy-link-btn');
  const copyToast = document.getElementById('copy-toast');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (copyToast) {
          copyToast.classList.add('is-active');
          setTimeout(() => copyToast.classList.remove('is-active'), 2500);
        }
      } catch (err) {
        // Fallback for older browsers or insecure contexts
        const tempInput = document.createElement('input');
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        if (copyToast) {
          copyToast.classList.add('is-active');
          setTimeout(() => copyToast.classList.remove('is-active'), 2500);
        }
      }
    });
  }

  // Populate dynamic share URLs
  const shareTwitter = document.getElementById('share-twitter');
  const shareLinkedin = document.getElementById('share-linkedin');
  const shareWhatsapp = document.getElementById('share-whatsapp');
  if (shareTwitter || shareLinkedin || shareWhatsapp) {
    const curUrl = encodeURIComponent(window.location.href);
    const curTitle = encodeURIComponent(document.title);
    if (shareTwitter) shareTwitter.href = `https://twitter.com/intent/tweet?text=${curTitle}&url=${curUrl}`;
    if (shareLinkedin) shareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${curUrl}`;
    if (shareWhatsapp) shareWhatsapp.href = `https://api.whatsapp.com/send?text=${curTitle}%20${curUrl}`;
  }

  // --- 7. CATEGORY FILTER TABS ---
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  const postCards = document.querySelectorAll('.post-card');
  if (filterBtns.length > 0 && postCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const filter = btn.getAttribute('data-filter');

        postCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (filter === 'all' || cardCat === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // --- 8. CODE BLOCKS ENHANCEMENT (HEADER & COPY BUTTON) ---
  function enhanceCodeBlocks() {
    const preElements = document.querySelectorAll('.article-content pre');
    preElements.forEach((pre) => {
      if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) {
        return;
      }

      const code = pre.querySelector('code');
      let lang = 'CODE';
      if (code && code.className) {
        const match = code.className.match(/language-(\w+)/i);
        if (match) {
          lang = match[1].toUpperCase();
        }
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span class="lang-badge">💻 <span>${lang}</span></span>
        <button class="code-copy-btn" type="button" aria-label="Copy code">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </button>
      `;

      const copyBtn = header.querySelector('.code-copy-btn');
      copyBtn.addEventListener('click', async () => {
        const textToCopy = (code || pre).innerText.trim();
        try {
          await navigator.clipboard.writeText(textToCopy);
        } catch (err) {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        copyBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Copied!</span>
        `;
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          `;
          copyBtn.classList.remove('copied');
        }, 2000);
      });

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceCodeBlocks);
  } else {
    enhanceCodeBlocks();
  }

})();
