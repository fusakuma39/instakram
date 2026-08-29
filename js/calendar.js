/**
 * カレンダービュー & 日付別実践タイムライン コントローラー
 */
class CalendarController {
  constructor(app) {
    this.app = app;
    this.currentDate = new Date();
    this.selectedDate = new Date();
    
    this.monthLabel = document.getElementById("calendarMonthLabel");
    this.daysGrid = document.getElementById("calendarDaysGrid");
    this.btnPrevMonth = document.getElementById("btnPrevMonth");
    this.btnNextMonth = document.getElementById("btnNextMonth");
    this.btnToday = document.getElementById("btnToday");
    
    this.dayDetailPanel = document.getElementById("dayDetailPanel");
    this.selectedDateBadge = document.getElementById("selectedDateBadge");
    this.selectedDateHeading = document.getElementById("selectedDateHeading");
    this.selectedDateSub = document.getElementById("selectedDateSub");
    this.dayRecordsList = document.getElementById("dayRecordsList");
    this.btnAddRecordForDate = document.getElementById("btnAddRecordForDate");

    this.initEvents();
  }

  initEvents() {
    this.btnPrevMonth?.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    this.btnNextMonth?.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    this.btnToday?.addEventListener("click", () => {
      this.currentDate = new Date();
      this.selectedDate = new Date();
      this.render();
      this.renderDayDetail();
    });

    this.btnAddRecordForDate?.addEventListener("click", () => {
      const dateStr = this.formatDate(this.selectedDate);
      this.app.openNewPostModal({ date: dateStr });
    });
  }

  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    if (this.monthLabel) {
      this.monthLabel.textContent = `${year}年 ${month + 1}月`;
    }

    const allRecords = await this.app.getFilteredRecords();
    
    const recordsByDate = {};
    for (const rec of allRecords) {
      if (!recordsByDate[rec.date]) {
        recordsByDate[rec.date] = [];
      }
      recordsByDate[rec.date].push(rec);
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    if (!this.daysGrid) return;
    this.daysGrid.innerHTML = "";

    const todayStr = this.formatDate(new Date());
    const selectedDateStr = this.formatDate(this.selectedDate);

    // 1. 前月はみ出し
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevLastDay - i;
      const cell = document.createElement("div");
      cell.className = "calendar-day prev-month-day";
      cell.innerHTML = `<span class="day-number">${dayNum}</span>`;
      this.daysGrid.appendChild(cell);
    }

    // 2. 当月
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const dateStr = this.formatDate(cellDate);
      const dayOfWeek = cellDate.getDay();
      
      const cell = document.createElement("div");
      cell.className = "calendar-day current-month-day";
      
      if (dateStr === todayStr) cell.classList.add("is-today");
      if (dateStr === selectedDateStr) cell.classList.add("is-selected");
      if (dayOfWeek === 0) cell.classList.add("is-sunday");
      if (dayOfWeek === 6) cell.classList.add("is-saturday");

      const dayRecords = recordsByDate[dateStr] || [];
      const hasRecords = dayRecords.length > 0;

      if (hasRecords) {
        cell.classList.add("has-records");
      }

      let thumbHtml = "";
      if (hasRecords) {
        const latestRec = dayRecords[0];
        thumbHtml = `
          <div class="calendar-day-thumb">
            <img src="${latestRec.photoUrl}" alt="サムネイル" loading="lazy">
            <span class="record-count-badge">${dayRecords.length}</span>
          </div>
        `;
      }

      // ハッシュタグインジケーター
      let tagCountHtml = "";
      if (hasRecords) {
        const totalTags = dayRecords.reduce((sum, r) => sum + (r.aspects || []).length, 0);
        if (totalTags > 0) {
          tagCountHtml = `<span class="calendar-tag-count"># ${totalTags}</span>`;
        }
      }

      cell.innerHTML = `
        <div class="day-cell-header">
          <span class="day-number">${day}</span>
          ${hasRecords && dayRecords.some(r => r.syncedGcs) ? '<span class="cell-gcs-icon" title="GCS連携済"><i data-lucide="cloud"></i></span>' : ''}
        </div>
        ${thumbHtml}
        <div class="day-cell-footer">${tagCountHtml}</div>
      `;

      cell.addEventListener("click", () => {
        this.selectedDate = new Date(year, month, day);
        const allCells = this.daysGrid.querySelectorAll(".calendar-day");
        allCells.forEach(c => c.classList.remove("is-selected"));
        cell.classList.add("is-selected");

        this.renderDayDetail();

        if (window.innerWidth <= 860 && this.dayDetailPanel) {
          this.dayDetailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      this.daysGrid.appendChild(cell);
    }

    // 3. 翌月はみ出し
    const totalCells = startingDayOfWeek + totalDays;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day next-month-day";
      cell.innerHTML = `<span class="day-number">${day}</span>`;
      this.daysGrid.appendChild(cell);
    }

    if (window.lucide) window.lucide.createIcons();

    this.renderDayDetail();
  }

  async renderDayDetail() {
    const dateStr = this.formatDate(this.selectedDate);
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth() + 1;
    const day = this.selectedDate.getDate();
    const dayOfWeekStr = ["日", "月", "火", "水", "木", "金", "土"][this.selectedDate.getDay()];

    if (this.selectedDateBadge) {
      this.selectedDateBadge.textContent = `${month}/${day}`;
    }

    if (this.selectedDateHeading) {
      this.selectedDateHeading.textContent = `${year}年${month}月${day}日 (${dayOfWeekStr}) の実践記録`;
    }

    const allFiltered = await this.app.getFilteredRecords();
    const dayRecords = allFiltered.filter(r => r.date === dateStr);

    if (this.selectedDateSub) {
      this.selectedDateSub.textContent = `${dayRecords.length} 件の実践記録があります`;
    }

    if (!this.dayRecordsList) return;
    this.dayRecordsList.innerHTML = "";

    if (dayRecords.length === 0) {
      this.dayRecordsList.innerHTML = `
        <div class="empty-day-state">
          <div class="empty-icon-wrap">
            <i data-lucide="book-open"></i>
          </div>
          <p class="empty-main-text">この日の実践記録はまだありません</p>
          <p class="empty-sub-text">児童のつぶやきや学びの瞬間を写真と一緒に記録してみましょう。</p>
          <button class="btn btn-primary btn-sm" id="btnEmptyDayAdd">
            <i data-lucide="camera"></i> 今すぐこの日に記録を追加
          </button>
        </div>
      `;
      document.getElementById("btnEmptyDayAdd")?.addEventListener("click", () => {
        this.app.openNewPostModal({ date: dateStr });
      });
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    dayRecords.forEach(rec => {
      const card = this.createDayRecordCard(rec);
      this.dayRecordsList.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  createDayRecordCard(rec) {
    const card = document.createElement("article");
    card.className = "day-record-card";
    card.dataset.id = rec.id;

    const authorDisplayName = rec.authorName || "先生";
    const currentUserName = window.storageService.getCurrentUser() || "先生";

    // ハッシュタグ表示
    const aspectTagsHtml = (rec.aspects || []).map(aspectId => {
      const aspect = TEN_ASPECTS.find(a => a.id === aspectId);
      if (!aspect) return "";
      return `<button class="card-hashtag-pill" data-aspect-id="${aspect.id}">${aspect.tag}</button>`;
    }).join(" ");

    const reactionsHtml = (rec.reactions || []).map(r => `<span class="reaction-emoji-badge">${r}</span>`).join("");
    const commentsList = rec.comments || [];

    card.innerHTML = `
      <div class="record-card-top">
        <div class="record-class-author-group">
          <span class="record-class-tag"><i data-lucide="users"></i> ${this.escapeHtml(rec.className)}</span>
          <span class="record-author-tag"><i data-lucide="user"></i> ${this.escapeHtml(authorDisplayName)}</span>
        </div>
        <div class="card-action-menu">
          ${rec.syncedGcs ? '<span class="gcs-synced-badge" title="GCS連携済"><i data-lucide="cloud"></i> GCS</span>' : ''}
          <button class="btn-card-icon btn-edit" title="編集"><i data-lucide="edit-3"></i></button>
          <button class="btn-card-icon btn-delete" title="削除"><i data-lucide="trash-2"></i></button>
        </div>
      </div>

      <div class="record-photo-wrapper">
        <img src="${rec.photoUrl}" alt="実践写真" class="record-main-photo" loading="lazy">
        <button class="btn-photo-expand" title="写真を拡大"><i data-lucide="maximize-2"></i></button>
      </div>

      <div class="record-card-body">
        ${aspectTagsHtml ? `<div class="aspects-list-row">${aspectTagsHtml}</div>` : ''}

        <p class="record-comment-text">${this.escapeHtml(rec.comment)}</p>

        <!-- Comments Mini Count & Trigger -->
        <div class="card-comments-bar">
          <button class="btn-card-comments-link" title="コメントを見る・書く">
            <i data-lucide="message-circle"></i> コメント (${commentsList.length}件)
          </button>
        </div>

        <div class="record-card-footer">
          <div class="record-reactions">
            <button class="btn-like-action ${(rec.likes || []).includes(window.storageService.getCurrentUser() || '先生') ? 'liked fill-liked' : ''}" data-id="${rec.id}">
              <i data-lucide="heart"></i> <span class="like-count">${(rec.likes || []).length}</span>
            </button>
            <div class="reactions-list">${reactionsHtml}</div>
            <div class="reaction-picker-drop">
              <button class="btn-add-stamp" title="スタンプを押す"><i data-lucide="smile-plus"></i></button>
              <div class="stamp-palette hidden">
                <span class="stamp-opt" data-emoji="👏">👏</span>
                <span class="stamp-opt" data-emoji="💡">💡</span>
                <span class="stamp-opt" data-emoji="✨">✨</span>
                <span class="stamp-opt" data-emoji="🌱">🌱</span>
                <span class="stamp-opt" data-emoji="❤️">❤️</span>
              </div>
            </div>
          </div>
          <span class="record-time-text">${rec.createdAt ? new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
    `;

    card.querySelector(".btn-photo-expand")?.addEventListener("click", () => {
      this.app.openDetailModal(rec);
    });
    card.querySelector(".btn-card-comments-link")?.addEventListener("click", () => {
      this.app.openDetailModal(rec);
    });

    card.querySelector(".btn-edit")?.addEventListener("click", () => {
      this.app.openEditPostModal(rec);
    });

    card.querySelector(".btn-delete")?.addEventListener("click", async () => {
      if (confirm(`「${rec.className}」のこの実践記録を削除してもよろしいですか？`)) {
        await window.storageService.deleteRecord(rec.id);
        this.app.showToast("実践記録を削除しました");
        this.app.refreshAllViews();
      }
    });

    card.querySelectorAll(".card-hashtag-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        const aspectId = btn.dataset.aspectId;
        this.app.filterByAspect(aspectId);
      });
    });

    // いいね
    const btnLike = card.querySelector(".btn-like-action");
    btnLike?.addEventListener("click", async () => {
      const updated = await window.storageService.toggleLike(rec.id);
      if (updated) {
        const currentUserName = window.storageService.getCurrentUser() || "先生";
        const hasLiked = (updated.likes || []).includes(currentUserName);
        btnLike.querySelector(".like-count").textContent = (updated.likes || []).length;
        if (hasLiked) {
          btnLike.classList.add("liked", "fill-liked");
        } else {
          btnLike.classList.remove("liked", "fill-liked");
        }
        if (typeof confetti === "function") {
          confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
        }
      }
    });

    // スタンプ
    const btnAddStamp = card.querySelector(".btn-add-stamp");
    const stampPalette = card.querySelector(".stamp-palette");
    btnAddStamp?.addEventListener("click", (e) => {
      e.stopPropagation();
      stampPalette?.classList.toggle("hidden");
    });

    card.querySelectorAll(".stamp-opt").forEach(opt => {
      opt.addEventListener("click", async (e) => {
        e.stopPropagation();
        const emoji = opt.dataset.emoji;
        stampPalette?.classList.add("hidden");
        await window.storageService.addReaction(rec.id, emoji);
        this.app.refreshAllViews();
      });
    });

    return card;
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
}

window.CalendarController = CalendarController;
