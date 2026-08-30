/**
 * Instagram風タイムラインフィード & 写真グリッドギャラリー コントローラー
 */
class FeedController {
  constructor(app) {
    this.app = app;
    this.feedContainer = document.getElementById("feedContainer");
    this.galleryGrid = document.getElementById("galleryGrid");
    this.detailModal = document.getElementById("detailModal");
    this.detailModalBody = document.getElementById("detailModalBody");
    this.btnCloseDetailModal = document.getElementById("btnCloseDetailModal");

    // Lightbox Modal
    this.lightboxModal = document.getElementById("lightboxModal");
    this.lightboxImg = document.getElementById("lightboxImg");
    this.lightboxCaption = document.getElementById("lightboxCaption");
    this.btnCloseLightbox = document.getElementById("btnCloseLightbox");

    this.initEvents();
  }

  initEvents() {
    this.btnCloseDetailModal?.addEventListener("click", () => {
      this.closeDetailModal();
    });

    this.detailModal?.addEventListener("click", (e) => {
      if (e.target === this.detailModal) {
        this.closeDetailModal();
      }
    });

    // Lightbox close
    this.btnCloseLightbox?.addEventListener("click", () => {
      this.closeLightbox();
    });

    this.lightboxModal?.addEventListener("click", (e) => {
      if (e.target === this.lightboxModal) {
        this.closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!this.lightboxModal?.classList.contains("hidden")) {
          this.closeLightbox();
        } else if (!this.detailModal?.classList.contains("hidden")) {
          this.closeDetailModal();
        }
      }
    });

    // Lightbox carousel
    this.lightboxPrevBtn = document.getElementById("lightboxPrevBtn");
    this.lightboxNextBtn = document.getElementById("lightboxNextBtn");
    
    this.lightboxPrevBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.lightboxCurrentIndex > 0) {
        this.lightboxCurrentIndex--;
        this.updateLightboxImage();
      }
    });
    this.lightboxNextBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.lightboxCurrentIndex < this.lightboxUrls.length - 1) {
        this.lightboxCurrentIndex++;
        this.updateLightboxImage();
      }
    });
  }

  openLightbox(photoUrls, captionText, initialIndex = 0) {
    if (!this.lightboxModal || !this.lightboxImg) return;
    this.lightboxUrls = Array.isArray(photoUrls) ? photoUrls : (photoUrls ? photoUrls.split(',') : []);
    this.lightboxCurrentIndex = initialIndex;
    this.lightboxCaptionText = captionText || "";
    
    this.updateLightboxImage();
    this.lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (window.lucide) window.lucide.createIcons();
  }

  updateLightboxImage() {
    const url = this.lightboxUrls[this.lightboxCurrentIndex];
    if (!url) return;
    
    this.lightboxImg.src = url.replace("&sz=w1000", "&sz=w2000"); // Request higher resolution
    if (this.lightboxCaption) {
      this.lightboxCaption.textContent = this.lightboxCaptionText + (this.lightboxUrls.length > 1 ? ` (${this.lightboxCurrentIndex + 1}/${this.lightboxUrls.length})` : "");
    }
    const fullSizeLink = document.getElementById("lightboxFullSizeLink");
    if (fullSizeLink) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match) {
        fullSizeLink.href = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      } else {
        fullSizeLink.href = url.replace("&sz=w1000", "&sz=w3000");
      }
    }

    if (this.lightboxPrevBtn) {
      this.lightboxPrevBtn.style.display = (this.lightboxUrls.length > 1 && this.lightboxCurrentIndex > 0) ? 'flex' : 'none';
    }
    if (this.lightboxNextBtn) {
      this.lightboxNextBtn.style.display = (this.lightboxUrls.length > 1 && this.lightboxCurrentIndex < this.lightboxUrls.length - 1) ? 'flex' : 'none';
    }
  }

  closeLightbox() {
    this.lightboxModal?.classList.add("hidden");
    if (this.detailModal?.classList.contains("hidden")) {
      document.body.style.overflow = "";
    }
  }

  // タイムラインフィード描画
  async renderFeed() {
    if (!this.feedContainer) return;
    this.feedContainer.innerHTML = "";

    const records = await this.app.getFilteredRecords();

    if (records.length === 0) {
      this.feedContainer.innerHTML = `
        <div class="empty-feed-state">
          <div class="empty-icon-wrap"><i data-lucide="image-off"></i></div>
          <p class="empty-main-text">表示できる投稿がありません</p>
          <p class="empty-sub-text">条件を変更するか、右上の「記録を追加」から投稿してください。</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    records.forEach(rec => {
      const postCard = this.createFeedPostCard(rec);
      this.feedContainer.appendChild(postCard);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  createFeedPostCard(rec) {
    const card = document.createElement("article");
    card.className = "insta-feed-card";
    card.dataset.id = rec.id;

    const classInitial = rec.className.charAt(0);
    const authorDisplayName = rec.authorName || "先生";
    const currentUserName = window.storageService.getCurrentUser() || "先生";

    const aspectTagsHtml = (rec.aspects || []).map(aspectId => {
      const aspect = TEN_ASPECTS.find(a => a.id === aspectId);
      if (!aspect) return "";
      return `<button class="feed-hashtag-btn" data-aspect-id="${aspect.id}">${aspect.tag}</button>`;
    }).join(" ");

    const reactionCounts = {};
    const myReactions = new Set();
    (rec.reactions || []).forEach(r => {
      let emoji = typeof r === 'string' ? r : r.emoji;
      let author = typeof r === 'string' ? '' : r.author;
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
      if (author === currentUserName) myReactions.add(emoji);
    });

    const reactionsHtml = Object.entries(reactionCounts).map(([emoji, count]) => 
      `<span class="reaction-emoji-badge ${myReactions.has(emoji) ? 'my-reaction' : ''}" data-emoji="${emoji}">${emoji} ${count > 1 ? count : ''}</span>`
    ).join("");
    const commentsList = rec.comments || [];

    let commentsPreviewHtml = "";
    if (commentsList.length > 0) {
      const recentComments = commentsList.slice(-2);
      const recentHtml = recentComments.map(c => `
        <div class="feed-inline-comment">
          <strong class="comment-author">${this.escapeHtml(c.author)}:</strong>
          <span class="comment-text">${this.escapeHtml(c.text)}</span>
        </div>
      `).join("");

      commentsPreviewHtml = `
        <div class="feed-comments-preview">
          ${commentsList.length > 2 ? `<button class="btn-view-all-comments" data-id="${rec.id}">他 ${commentsList.length - 2} 件のコメントをすべて見る</button>` : ''}
          ${recentHtml}
        </div>
      `;
    }

    card.innerHTML = `
      <!-- Post Header -->
      <div class="insta-card-header">
        <div class="insta-user-info">
          <div class="insta-avatar-ring">
            <div class="insta-avatar">${classInitial}</div>
          </div>
          <div class="insta-meta-texts">
            <span class="insta-class-name">${rec.className}</span>
            <span class="insta-post-meta">
              <span class="author-tag"><i data-lucide="user"></i> ${this.escapeHtml(authorDisplayName)}</span>
              <span class="dot-sep">•</span>
              <span class="date-tag"><i data-lucide="calendar"></i> ${rec.date}</span>
            </span>
          </div>
        </div>
        <div class="insta-header-actions">
          <button class="btn-post-menu btn-feed-detail" title="詳細を見る"><i data-lucide="more-horizontal"></i></button>
        </div>
      </div>

      <!-- Post Photo: Natural Aspect Ratio with Lightbox Click & Double-Tap Heart -->
      <div class="insta-photo-box natural-aspect" title="横スクロールで複数枚表示（右下クリックで拡大）">
        <div class="insta-carousel">
          ${(rec.photoUrl ? rec.photoUrl.split(',') : []).map((url, idx) => `
            <img src="${url}" alt="投稿写真" class="insta-photo-img natural-fit" loading="${idx === 0 ? 'lazy' : 'lazy'}">
          `).join('')}
        </div>
        ${(rec.photoUrl && rec.photoUrl.split(',').length > 1) ? `<div class="multi-photo-indicator"><i data-lucide="layers"></i> ${rec.photoUrl.split(',').length}枚</div>` : ''}
        ${(rec.photoUrl && rec.photoUrl.split(',').length > 1) ? `
          <button class="carousel-btn prev-btn hidden"><i data-lucide="chevron-left"></i></button>
          <button class="carousel-btn next-btn"><i data-lucide="chevron-right"></i></button>
        ` : ''}
        <div class="heart-overlay-anim hidden"><i data-lucide="heart"></i></div>
        <button class="btn-fullscreen-trigger" title="全画面表示"><i data-lucide="maximize-2"></i></button>
      </div>
      ${(rec.photoUrl && rec.photoUrl.split(',').length > 1) ? `
      <div class="carousel-dots-container">
        ${rec.photoUrl.split(',').map((_, idx) => `<span class="carousel-dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}
      </div>` : ''}

      <!-- Post Action Bar -->
      <div class="insta-actions-bar">
        <div class="insta-left-actions" style="position: relative;">
          <button class="btn-insta-action btn-feed-like ${(rec.likes || []).includes(currentUserName) ? 'liked' : ''}" title="いいね">
            <i data-lucide="heart"></i>
          </button>
          <button class="btn-insta-action btn-feed-stamp-trigger" title="スタンプ">
            <i data-lucide="smile"></i>
          </button>
          <button class="btn-insta-action btn-feed-comment-focus" title="コメント">
            <i data-lucide="message-circle"></i>
          </button>
          
          <!-- Mini Stamp Selector Popup -->
          <div class="feed-stamp-popup hidden">
            <span class="stamp-opt" data-emoji="👏">👏 すごい</span>
            <span class="stamp-opt" data-emoji="💡">💡 発見</span>
            <span class="stamp-opt" data-emoji="✨">✨ 輝き</span>
            <span class="stamp-opt" data-emoji="🌱">🌱 成長</span>
            <span class="stamp-opt" data-emoji="❤️">❤️ すてき</span>
          </div>
        </div>
        <div class="insta-reactions-display">
          ${reactionsHtml}
        </div>
      </div>

      <!-- Likes count -->
      <div class="insta-likes-count">
        <span>いいね <strong>${(rec.likes || []).length}</strong> 件</span>
      </div>

      <!-- Post Content & Hashtags -->
      <div class="insta-content-box">
        <div class="insta-caption">
          <span class="insta-caption-author">${this.escapeHtml(authorDisplayName)}</span>
          <span class="insta-caption-text">${this.escapeHtml(rec.comment)}</span>
        </div>

        ${aspectTagsHtml ? `<div class="insta-aspects-hashtags">${aspectTagsHtml}</div>` : ''}

        <!-- Inline Comments Section -->
        ${commentsPreviewHtml}

        <!-- Add Inline Comment Form -->
        <form class="feed-add-comment-form" data-id="${rec.id}">
          <input type="text" class="feed-comment-input" placeholder="${this.escapeHtml(currentUserName)} としてコメントを追加..." required>
          <button type="submit" class="feed-comment-submit">投稿</button>
        </form>
      </div>
    `;

    // 写真クリック / ダブルタップ
    const photoBox = card.querySelector(".insta-photo-box");
    let lastTap = 0;
    photoBox.addEventListener("click", async (e) => {
      if (e.target.closest(".btn-fullscreen-trigger")) {
        const carousel = photoBox.querySelector(".insta-carousel");
        const scrollLeft = carousel ? carousel.scrollLeft : 0;
        const width = carousel ? carousel.clientWidth : 1;
        const currentIndex = Math.round(scrollLeft / width);
        this.openLightbox(rec.photoUrl, `${rec.className} (${rec.date}) - ${rec.comment}`, currentIndex);
        return;
      }

      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap -> Like (Only if not liked yet)
        const currentUserName = window.storageService.getCurrentUser() || "先生";
        const hasLiked = (rec.likes || []).includes(currentUserName);
        if (!hasLiked) {
          const heartAnim = card.querySelector(".heart-overlay-anim");
          heartAnim?.classList.remove("hidden");
          setTimeout(() => heartAnim?.classList.add("hidden"), 800);
          
          await window.storageService.toggleLike(rec.id);
          this.app.refreshAllViews();
          if (typeof confetti === "function") {
            confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
          }
        }
      } else {
        // Single tap -> Open Lightbox
        setTimeout(() => {
          if (Date.now() - lastTap >= 300) {
            const carousel = photoBox.querySelector(".insta-carousel");
            const scrollLeft = carousel ? carousel.scrollLeft : 0;
            const width = carousel ? carousel.clientWidth : 1;
            const currentIndex = Math.round(scrollLeft / width);
            this.openLightbox(rec.photoUrl, `${rec.className} (${rec.date}) - ${rec.comment}`, currentIndex);
          }
        }, 300);
      }
      lastTap = now;
    });

    // いいね
    card.querySelector(".btn-feed-like")?.addEventListener("click", async () => {
      const updated = await window.storageService.toggleLike(rec.id);
      if (updated) {
        const currentUserName = window.storageService.getCurrentUser() || "先生";
        const hasLiked = (updated.likes || []).includes(currentUserName);
        this.app.refreshAllViews();
        if (hasLiked && typeof confetti === "function") {
          confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
        }
      }
    });

    card.querySelector(".insta-likes-count span")?.addEventListener("click", () => {
      if (rec.likes && rec.likes.length > 0) {
        this.app.showListModal("いいねした人", rec.likes);
      }
    });

    // 詳細モーダル表示
    card.querySelector(".btn-feed-detail")?.addEventListener("click", () => {
      this.openDetailModal(rec);
    });
    card.querySelector(".btn-view-all-comments")?.addEventListener("click", () => {
      this.openDetailModal(rec);
    });

    // コメント入力フォーカス
    card.querySelector(".btn-feed-comment-focus")?.addEventListener("click", () => {
      const input = card.querySelector(".feed-comment-input");
      input?.focus();
    });

    // コメント送信
    const commentForm = card.querySelector(".feed-add-comment-form");
    commentForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = commentForm.querySelector(".feed-comment-input");
      const text = input.value.trim();
      if (!text) return;
      
      await window.storageService.addComment(rec.id, text, currentUserName);
      input.value = "";
      this.app.showToast("コメントを投稿しました！💬");
      this.app.refreshAllViews();
    });

    // ハッシュタグクリックで絞り込み
    card.querySelectorAll(".feed-hashtag-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const aspectId = btn.dataset.aspectId;
        this.app.filterByAspect(aspectId);
      });
    });

    // スタンプポップアップ
    const btnStamp = card.querySelector(".btn-feed-stamp-trigger");
    const stampPopup = card.querySelector(".feed-stamp-popup");
    btnStamp?.addEventListener("click", (e) => {
      e.stopPropagation();
      stampPopup?.classList.toggle("hidden");
    });

    card.querySelectorAll(".stamp-opt").forEach(opt => {
      opt.addEventListener("click", async (e) => {
        e.stopPropagation();
        stampPopup?.classList.add("hidden");
        const emoji = opt.dataset.emoji.split(" ")[0];
        
        await window.storageService.toggleReaction(rec.id, emoji);
        this.app.refreshAllViews();
      });
    });

    card.querySelectorAll(".reaction-emoji-badge").forEach(badge => {
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        const emoji = badge.dataset.emoji;
        const reactionAuthors = (rec.reactions || [])
          .filter(r => (typeof r === 'object' ? r.emoji : r) === emoji)
          .map(r => typeof r === 'object' ? r.author : '先生');
        
        if (reactionAuthors.length > 0) {
          this.app.showListModal(`${emoji} した人`, reactionAuthors);
        }
      });
    });

    const carousel = card.querySelector(".insta-carousel");
    const prevBtn = card.querySelector(".prev-btn");
    const nextBtn = card.querySelector(".next-btn");
    const dots = card.querySelectorAll(".carousel-dot");
    if (carousel) {
      const updateCarouselUI = () => {
        const scrollLeft = carousel.scrollLeft;
        const width = carousel.clientWidth || 1;
        const maxScrollLeft = carousel.scrollWidth - width;
        if (prevBtn) {
          if (scrollLeft > 5) prevBtn.classList.remove("hidden");
          else prevBtn.classList.add("hidden");
        }
        if (nextBtn) {
          if (scrollLeft < maxScrollLeft - 5) nextBtn.classList.remove("hidden");
          else nextBtn.classList.add("hidden");
        }
        if (dots.length > 0) {
          const index = Math.round(scrollLeft / width);
          dots.forEach((d, i) => d.classList.toggle("active", i === index));
        }
      };
      carousel.addEventListener("scroll", updateCarouselUI);
      setTimeout(updateCarouselUI, 100);

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          carousel.scrollBy({ left: -carousel.clientWidth, behavior: "smooth" });
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          carousel.scrollBy({ left: carousel.clientWidth, behavior: "smooth" });
        });
      }
    }

    return card;
  }

  // 写真グリッドギャラリー描画
  async renderGallery() {
    if (!this.galleryGrid) return;
    this.galleryGrid.innerHTML = "";

    const records = await this.app.getFilteredRecords();

    if (records.length === 0) {
      this.galleryGrid.innerHTML = `
        <div class="empty-feed-state" style="grid-column: 1 / -1;">
          <div class="empty-icon-wrap"><i data-lucide="image-off"></i></div>
          <p class="empty-main-text">写真がありません</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    records.forEach(rec => {
      const tile = document.createElement("div");
      tile.className = "gallery-tile";
      tile.innerHTML = `
        <img src="${rec.photoUrl}" alt="写真" class="gallery-tile-img" loading="lazy">
        <div class="gallery-tile-overlay">
          <div class="overlay-stats">
            <span><i data-lucide="heart"></i> ${(rec.likes || []).length}</span>
            <span><i data-lucide="message-circle"></i> ${(rec.comments || []).length}</span>
          </div>
          <span class="overlay-author">${this.escapeHtml(rec.authorName || '')}</span>
          <span class="overlay-class">${rec.className}</span>
          <span class="overlay-date">${rec.date}</span>
        </div>
      `;

      tile.addEventListener("click", () => {
        this.openDetailModal(rec);
      });

      this.galleryGrid.appendChild(tile);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // 詳細モーダルオープン
  openDetailModal(rec) {
    if (!this.detailModal || !this.detailModalBody) return;

    const currentUserName = window.storageService.getCurrentUser() || "先生";
    const authorDisplayName = rec.authorName || "先生";

    const aspectTagsHtml = (rec.aspects || []).map(aspectId => {
      const aspect = TEN_ASPECTS.find(a => a.id === aspectId);
      if (!aspect) return "";
      return `<span class="detail-hashtag-pill">${aspect.tag}</span>`;
    }).join(" ");

    const commentsList = rec.comments || [];
    let commentsListHtml = "";
    if (commentsList.length === 0) {
      commentsListHtml = `<p class="no-comments-text">まだコメントはありません。最初のコメントを投稿しましょう！</p>`;
    } else {
      commentsListHtml = commentsList.map(c => `
        <div class="modal-comment-item">
          <div class="comment-avatar">${(c.author || '先').charAt(0)}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author-name">${this.escapeHtml(c.author)}</span>
              <span class="comment-time">${c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <p class="comment-content">${this.escapeHtml(c.text)}</p>
          </div>
        </div>
      `).join("");
    }

    this.detailModalBody.innerHTML = `
      <div class="detail-left-col" style="display: flex; flex-direction: column; background: var(--bg-surface);">
        <div class="detail-left-media" title="横スクロールで複数枚表示（クリックで拡大）" style="flex: 1; min-height: 300px;">
          <div class="insta-carousel">
            ${(rec.photoUrl ? rec.photoUrl.split(',') : []).map((url, idx) => `
              <img src="${url}" alt="投稿写真" class="detail-full-photo insta-photo-img natural-fit" loading="${idx === 0 ? 'lazy' : 'lazy'}">
            `).join('')}
          </div>
          ${(rec.photoUrl && rec.photoUrl.split(',').length > 1) ? `<div class="multi-photo-indicator"><i data-lucide="layers"></i> ${rec.photoUrl.split(',').length}枚</div>` : ''}
          ${(rec.photoUrl && rec.photoUrl.split(',').length > 1) ? `
            <button class="carousel-btn prev-btn hidden" style="left:8px;top:50%;transform:translateY(-50%);position:absolute;z-index:20;"><i data-lucide="chevron-left"></i></button>
            <button class="carousel-btn next-btn" style="right:8px;top:50%;transform:translateY(-50%);position:absolute;z-index:20;"><i data-lucide="chevron-right"></i></button>
          ` : ''}
          ${(rec.photoUrl && rec.photoUrl.split(',').length > 1) ? `
          <div class="carousel-dots-container" style="position: absolute; bottom: 12px; width: 100%; margin: 0; z-index: 20;">
            ${rec.photoUrl.split(',').map((_, idx) => `<span class="carousel-dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}
          </div>` : ''}
        </div>
        <div class="detail-left-caption" style="padding: 20px; border-top: 1px solid var(--border-light);">
          <h4 class="detail-section-title" style="margin-top: 0;"><i data-lucide="message-square"></i> 実践の様子・児童のつぶやき</h4>
          <p class="detail-comment-text">${this.escapeHtml(rec.comment)}</p>
          ${aspectTagsHtml ? `<div class="detail-aspects-hashtags">${aspectTagsHtml}</div>` : ''}
        </div>
      </div>
      <div class="detail-right-content">
        <div class="detail-content-header">
          <div class="detail-class-info">
            <span class="detail-class-badge">${rec.className}</span>
            <span class="detail-author-badge"><i data-lucide="user"></i> ${this.escapeHtml(authorDisplayName)}</span>
            <span class="detail-date-badge"><i data-lucide="calendar"></i> ${rec.date}</span>
          </div>
          <div class="detail-actions-top">
            <button class="btn-icon btn-sm btn-modal-edit" title="編集"><i data-lucide="edit-3"></i></button>
            <button class="btn-icon btn-sm btn-modal-delete" title="削除"><i data-lucide="trash-2"></i></button>
          </div>
        </div>

        <div class="detail-scroll-area">

          <div class="detail-section comments-thread-section">
            <h4 class="detail-section-title">
              <i data-lucide="message-circle"></i> コメントスレッド (${commentsList.length})
            </h4>
            <div class="modal-comments-list" id="modalCommentsList">
              ${commentsListHtml}
            </div>
          </div>
        </div>

        <div class="detail-footer-comment-box">
          <form id="modalAddCommentForm" class="modal-comment-form">
            <input type="text" id="modalCommentInput" class="form-input" placeholder="${this.escapeHtml(currentUserName)} としてコメントを入力..." required>
            <button type="submit" class="btn btn-primary btn-sm"><i data-lucide="send"></i> 送信</button>
          </form>
        </div>
      </div>
    `;

    // 写真クリックで拡大ボックス
    const leftMedia = this.detailModalBody.querySelector(".detail-left-media");
    if (leftMedia) {
      leftMedia.addEventListener("click", () => {
        const carousel = this.detailModalBody.querySelector(".insta-carousel");
        const scrollLeft = carousel ? carousel.scrollLeft : 0;
        const width = carousel ? carousel.clientWidth : 1;
        const currentIndex = Math.round(scrollLeft / width);
        this.openLightbox(rec.photoUrl, `${rec.className} (${rec.date}) - ${rec.comment}`, currentIndex);
      });
      
      const carousel = this.detailModalBody.querySelector(".insta-carousel");
      const prevBtn = this.detailModalBody.querySelector(".prev-btn");
      const nextBtn = this.detailModalBody.querySelector(".next-btn");
      const dots = this.detailModalBody.parentElement.querySelectorAll(".carousel-dot");
      
      if (carousel) {
        const updateCarouselUI = () => {
          const scrollLeft = carousel.scrollLeft;
          const width = carousel.clientWidth || 1;
          const maxScrollLeft = carousel.scrollWidth - width;
          if (prevBtn) {
            if (scrollLeft > 5) prevBtn.classList.remove("hidden");
            else prevBtn.classList.add("hidden");
          }
          if (nextBtn) {
            if (scrollLeft < maxScrollLeft - 5) nextBtn.classList.remove("hidden");
            else nextBtn.classList.add("hidden");
          }
          if (dots.length > 0) {
            const index = Math.round(scrollLeft / width);
            dots.forEach((d, i) => d.classList.toggle("active", i === index));
          }
        };
        carousel.addEventListener("scroll", updateCarouselUI);
        setTimeout(updateCarouselUI, 100);

        if (prevBtn) {
          prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            carousel.scrollBy({ left: -carousel.clientWidth, behavior: "smooth" });
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            carousel.scrollBy({ left: carousel.clientWidth, behavior: "smooth" });
          });
        }
      }
    }

    const modalCommentForm = this.detailModalBody.querySelector("#modalAddCommentForm");
    modalCommentForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = this.detailModalBody.querySelector("#modalCommentInput");
      const text = input.value.trim();
      if (!text) return;

      const updated = await window.storageService.addComment(rec.id, text, currentUserName);
      input.value = "";
      this.app.showToast("コメントを投稿しました！");
      this.openDetailModal(updated);
      this.app.refreshAllViews();
    });

    this.detailModalBody.querySelector(".btn-modal-edit")?.addEventListener("click", () => {
      this.closeDetailModal();
      this.app.openEditPostModal(rec);
    });

    this.detailModalBody.querySelector(".btn-modal-delete")?.addEventListener("click", async () => {
      if (confirm("この投稿を削除しますか？")) {
        await window.storageService.deleteRecord(rec.id);
        this.closeDetailModal();
        this.app.showToast("投稿を削除しました");
        this.app.refreshAllViews();
      }
    });

    this.detailModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (window.lucide) window.lucide.createIcons();
  }

  closeDetailModal() {
    this.detailModal?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
}

window.FeedController = FeedController;
