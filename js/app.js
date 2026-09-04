/**
 * insta倉m - メインアプリケーション コントローラー (印刷選択 & UI最適化)
 */
class EduRecordApp {
  constructor() {
    this.currentView = "calendar";
    this.currentGradeFilter = "all";
    this.currentClassFilter = "all";
    this.currentAspectFilter = null;
    this.searchQuery = "";

    // Sub-controllers
    this.calendarCtrl = null;
    this.feedCtrl = null;
    this.analyticsCtrl = null;

    // Elements
    this.gradeStoriesContainer = document.getElementById("gradeStoriesContainer");
    this.subClassBar = document.getElementById("subClassBar");
    this.subClassGradeLabel = document.getElementById("subClassGradeLabel");
    this.subClassesContainer = document.getElementById("subClassesContainer");

    this.tabButtons = document.querySelectorAll(".tab-btn");
    this.views = document.querySelectorAll(".app-view");
    this.searchInput = document.getElementById("searchInput");
    this.btnClearSearch = document.getElementById("btnClearSearch");
    this.currentFilterTag = document.getElementById("currentFilterTag");
    this.btnResetFilter = document.getElementById("btnResetFilter");

    // User name
    this.welcomeModal = document.getElementById("welcomeModal");
    this.userNameForm = document.getElementById("userNameForm");
    this.inputUserName = document.getElementById("inputUserName");
    this.displayHeaderUserName = document.getElementById("displayHeaderUserName");
    this.btnEditUserName = document.getElementById("btnEditUserName");

    // Modal elements
    this.postModal = document.getElementById("postModal");
    this.recordForm = document.getElementById("recordForm");
    this.postModalTitle = document.getElementById("postModalTitle");
    this.btnClosePostModal = document.getElementById("btnClosePostModal");
    this.btnCancelPost = document.getElementById("btnCancelPost");
    this.btnNewPost = document.getElementById("btnNewPost");
    this.fabNewPost = document.getElementById("fabNewPost");

    // Form inputs
    this.recordIdInput = document.getElementById("recordId");
    this.recordAuthorInput = document.getElementById("recordAuthor");
    this.recordDateInput = document.getElementById("recordDate");
    this.recordGradeSelect = document.getElementById("recordGradeSelect");
    this.recordClassSelect = document.getElementById("recordClassSelect");
    this.recordCommentInput = document.getElementById("recordComment");
    this.photoFileInput = document.getElementById("photoFileInput");
    this.photoDropZone = document.getElementById("photoDropZone");
    this.uploadPlaceholder = document.getElementById("uploadPlaceholder");
    this.previewContainer = document.getElementById("previewContainer");
    this.previewImagesWrapper = document.getElementById("previewImagesWrapper");
    this.btnRemovePhoto = document.getElementById("btnRemovePhoto");
    this.tenAspectsChipsContainer = document.getElementById("tenAspectsChipsContainer");
    this.aspectSelectionCounter = document.getElementById("aspectSelectionCounter");

    // Current form state
    this.selectedAspectIds = new Set();
    this.currentPhotoData = "";

    // Class Management Modal
    this.classesModal = document.getElementById("classesModal");
    this.btnManageClasses = document.getElementById("btnManageClasses");
    this.btnCloseClassesModal = document.getElementById("btnCloseClassesModal");
    this.manageGradeSelect = document.getElementById("manageGradeSelect");
    this.addClassForm = document.getElementById("addClassForm");
    this.newClassNameInput = document.getElementById("newClassNameInput");
    this.classesListContainer = document.getElementById("classesListContainer");
    this.btnResetDefaultClasses = document.getElementById("btnResetDefaultClasses");
    this.btnSaveClassesDone = document.getElementById("btnSaveClassesDone");

    // Print Selector Modal Elements
    this.printSelectModal = document.getElementById("printSelectModal");
    this.btnPrintSelectorOpen = document.getElementById("btnPrintSelectorOpen");
    this.btnClosePrintSelectModal = document.getElementById("btnClosePrintSelectModal");
    this.btnCancelPrintSelect = document.getElementById("btnCancelPrintSelect");
    this.btnSelectAllPrint = document.getElementById("btnSelectAllPrint");
    this.btnDeselectAllPrint = document.getElementById("btnDeselectAllPrint");
    this.selectedPrintCounter = document.getElementById("selectedPrintCounter");
    this.printSelectItemsContainer = document.getElementById("printSelectItemsContainer");
    this.btnExecuteSelectedPrint = document.getElementById("btnExecuteSelectedPrint");
    this.printOutputContainer = document.getElementById("printOutputContainer");
    this.printFilterGradeSelect = document.getElementById("printFilterGradeSelect");
    this.printFilterClassSelect = document.getElementById("printFilterClassSelect");

    this.selectedPrintRecordIds = new Set();
    this.currentPrintGradeFilter = "all";
    this.currentPrintClassFilter = "all";

    // Export
    this.btnExportData = document.getElementById("btnExportData");

    // Toast
    this.toastEl = document.getElementById("toastNotification");
    this.toastMessage = document.getElementById("toastMessage");
  }

  async init() {
    await window.storageService.init();

    document.addEventListener('instaDataUpdated', () => {
      this.refreshAllViews();
    });

    this.calendarCtrl = new CalendarController(this);
    this.feedCtrl = new FeedController(this);
    this.analyticsCtrl = new AnalyticsController(this);

    this.setupUserAuth();
    this.setupHierarchicalStories();
    this.setupFormGradeClassOptions();
    this.setupViewTabs();
    this.setupSearch();
    this.setupFormModal();
    this.setupClassesModal();
    this.setupPrintSelectorModal();
    this.setupAspectChips();
    this.setupExport();

    await this.refreshAllViews();

    if (window.lucide) window.lucide.createIcons();
  }

  // ================= ユーザー名 =================

  setupUserAuth() {
    const currentUser = window.storageService.getCurrentUser();
    if (!currentUser) {
      this.welcomeModal?.classList.remove("hidden");
    } else {
      this.updateHeaderUserName(currentUser);
    }

    this.userNameForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = this.inputUserName.value.trim();
      if (!name) return;
      window.storageService.setCurrentUser(name);
      this.updateHeaderUserName(name);
      this.welcomeModal?.classList.add("hidden");
      this.showToast(`${name} としてログインしました！ようこそ insta倉m へ📸`);
    });

    this.btnEditUserName?.addEventListener("click", () => {
      const current = window.storageService.getCurrentUser();
      const newName = prompt("投稿やコメントに表示するお名前を入力してください:", current);
      if (newName && newName.trim()) {
        window.storageService.setCurrentUser(newName);
        this.updateHeaderUserName(newName);
        this.showToast("お名前を更新しました");
      }
    });
  }

  updateHeaderUserName(name) {
    if (this.displayHeaderUserName) {
      this.displayHeaderUserName.textContent = name || "お名前を設定";
    }
  }

  // ================= 階層ストーリーバー =================

  setupHierarchicalStories() {
    if (!this.gradeStoriesContainer) return;
    this.gradeStoriesContainer.innerHTML = "";

    const hierarchy = window.storageService.getGradeHierarchy();

    hierarchy.forEach(g => {
      const item = document.createElement("div");
      const isAll = g.gradeId === "all";
      const isActive = isAll ? (this.currentGradeFilter === "all") : (this.currentGradeFilter === g.gradeId);
      
      item.className = `story-item grade-ring-item ${isActive ? 'active' : ''}`;
      item.dataset.gradeId = g.gradeId;

      item.innerHTML = `
        <div class="story-ring-wrap">
          <div class="story-avatar" style="background-color: ${g.color || '#2E7D32'}">
            <i data-lucide="${g.icon || 'users'}"></i>
          </div>
        </div>
        <span class="story-label">${g.gradeName}</span>
      `;

      item.addEventListener("click", () => {
        this.setGradeFilter(g.gradeId);
      });

      this.gradeStoriesContainer.appendChild(item);
    });

    this.renderSubClassStoryBar();
    if (window.lucide) window.lucide.createIcons();
  }

  setGradeFilter(gradeId) {
    this.currentGradeFilter = gradeId;
    this.currentClassFilter = "all";
    this.currentAspectFilter = null;

    document.querySelectorAll(".grade-ring-item").forEach(el => {
      el.classList.toggle("active", el.dataset.gradeId === gradeId);
    });

    this.renderSubClassStoryBar();
    this.updateFilterLabel();
    this.refreshAllViews();
  }

  renderSubClassStoryBar() {
    if (!this.subClassBar || !this.subClassesContainer) return;

    if (this.currentGradeFilter === "all") {
      this.subClassBar.classList.add("hidden");
      return;
    }

    const hierarchy = window.storageService.getGradeHierarchy();
    const currentGrade = hierarchy.find(g => g.gradeId === this.currentGradeFilter);

    if (!currentGrade || !currentGrade.classes || currentGrade.classes.length === 0) {
      this.subClassBar.classList.add("hidden");
      return;
    }

    if (this.subClassGradeLabel) {
      this.subClassGradeLabel.textContent = `${currentGrade.gradeName}の学級:`;
    }

    this.subClassesContainer.innerHTML = "";

    const allGradePill = document.createElement("button");
    allGradePill.type = "button";
    allGradePill.className = `sub-class-pill ${this.currentClassFilter === 'all' ? 'active' : ''}`;
    allGradePill.innerHTML = `<i data-lucide="layers"></i> ${currentGrade.gradeName}全体`;
    allGradePill.addEventListener("click", () => {
      this.setClassFilter("all");
    });
    this.subClassesContainer.appendChild(allGradePill);

    currentGrade.classes.forEach(clsName => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `sub-class-pill ${this.currentClassFilter === clsName ? 'active' : ''}`;
      pill.innerHTML = `<span>${clsName}</span>`;
      pill.addEventListener("click", () => {
        this.setClassFilter(clsName);
      });
      this.subClassesContainer.appendChild(pill);
    });

    this.subClassBar.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  setClassFilter(className) {
    this.currentClassFilter = className;
    this.currentAspectFilter = null;

    document.querySelectorAll(".sub-class-pill").forEach(el => {
      if (className === "all") {
        el.classList.toggle("active", el.textContent.includes("全体"));
      } else {
        el.classList.toggle("active", el.textContent.trim() === className);
      }
    });

    this.updateFilterLabel();
    this.refreshAllViews();
  }

  filterByAspect(aspectId) {
    this.currentAspectFilter = aspectId;
    const aspect = TEN_ASPECTS.find(a => a.id === aspectId);
    
    this.updateFilterLabel();
    this.switchView("feed");
    this.refreshAllViews();
    this.showToast(`「${aspect?.tag || ''}」で絞り込みました`);
  }

  updateFilterLabel() {
    let label = "";

    if (this.currentGradeFilter !== "all") {
      const hierarchy = window.storageService.getGradeHierarchy();
      const g = hierarchy.find(gr => gr.gradeId === this.currentGradeFilter);
      label += g ? g.gradeName : "";
      
      if (this.currentClassFilter !== "all") {
        label += ` ＞ ${this.currentClassFilter}`;
      } else {
        label += " 全体";
      }
    } else {
      label = "全校・すべての学年・学級";
    }

    if (this.currentAspectFilter) {
      const aspect = TEN_ASPECTS.find(a => a.id === this.currentAspectFilter);
      if (aspect) label += (label ? " ＋ " : "") + aspect.tag;
    }
    if (this.searchQuery) {
      label += (label ? " ＋ " : "") + `検索: "${this.searchQuery}"`;
    }

    if (this.currentFilterTag) this.currentFilterTag.textContent = label;
    if (this.btnResetFilter) {
      const isFiltered = this.currentGradeFilter !== "all" || this.currentClassFilter !== "all" || this.currentAspectFilter !== null || this.searchQuery !== "";
      this.btnResetFilter.classList.toggle("hidden", !isFiltered);
    }
  }

  resetAllFilters() {
    this.currentGradeFilter = "all";
    this.currentClassFilter = "all";
    this.currentAspectFilter = null;
    this.searchQuery = "";
    if (this.searchInput) this.searchInput.value = "";
    if (this.btnClearSearch) this.btnClearSearch.classList.add("hidden");
    
    this.setupHierarchicalStories();
    this.updateFilterLabel();
    this.refreshAllViews();
  }

  async getFilteredRecords() {
    const all = await window.storageService.getAllRecords();
    const hierarchy = window.storageService.getGradeHierarchy();
    const currentGrade = hierarchy.find(g => g.gradeId === this.currentGradeFilter);

    return all.filter(rec => {
      if (this.currentGradeFilter !== "all") {
        if (this.currentClassFilter !== "all") {
          if (rec.className !== this.currentClassFilter) return false;
        } else if (currentGrade) {
          const isBelong = (currentGrade.classes || []).includes(rec.className) || rec.className.startsWith(currentGrade.gradeName);
          if (!isBelong) return false;
        }
      }
      if (this.currentAspectFilter && !(rec.aspects || []).includes(this.currentAspectFilter)) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const text = `${rec.className} ${rec.authorName || ''} ${rec.comment} ${rec.date}`.toLowerCase();
        const aspectMatch = (rec.aspects || []).some(aid => {
          const a = TEN_ASPECTS.find(asp => asp.id === aid);
          return a && (a.title.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q));
        });
        if (!text.includes(q) && !aspectMatch) return false;
      }
      return true;
    });
  }

  // ================= 投稿フォーム =================

  setupFormGradeClassOptions() {
    if (!this.recordGradeSelect || !this.recordClassSelect) return;

    const hierarchy = window.storageService.getGradeHierarchy().filter(g => g.gradeId !== "all");

    this.recordGradeSelect.innerHTML = "";
    hierarchy.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.gradeId;
      opt.textContent = g.gradeName;
      this.recordGradeSelect.appendChild(opt);
    });

    this.updateFormClassOptions(hierarchy[0]?.gradeId);

    this.recordGradeSelect.addEventListener("change", (e) => {
      this.updateFormClassOptions(e.target.value);
    });
  }

  updateFormClassOptions(gradeId, selectedClassName) {
    if (!this.recordClassSelect) return;
    this.recordClassSelect.innerHTML = "";

    const hierarchy = window.storageService.getGradeHierarchy();
    const targetGrade = hierarchy.find(g => g.gradeId === gradeId) || hierarchy[1];

    if (!targetGrade || !targetGrade.classes || targetGrade.classes.length === 0) {
      const opt = document.createElement("option");
      opt.value = targetGrade ? targetGrade.gradeName : "1年1組";
      opt.textContent = opt.value;
      this.recordClassSelect.appendChild(opt);
      return;
    }

    targetGrade.classes.forEach(clsName => {
      const opt = document.createElement("option");
      opt.value = clsName;
      opt.textContent = clsName;
      if (selectedClassName && selectedClassName === clsName) {
        opt.selected = true;
      }
      this.recordClassSelect.appendChild(opt);
    });
  }

  setupViewTabs() {
    // Top tabs
    this.tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const viewName = btn.dataset.view;
        this.switchView(viewName);
      });
    });

    // Mobile bottom navigation items
    document.querySelectorAll(".mobile-nav-item[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        const viewName = btn.dataset.view;
        this.switchView(viewName);
      });
    });

    // Mobile center post button
    document.getElementById("mobileNavPost")?.addEventListener("click", () => {
      this.openNewPostModal();
    });

    this.btnResetFilter?.addEventListener("click", () => {
      this.resetAllFilters();
    });

    document.getElementById("btnLogoHome")?.addEventListener("click", () => {
      this.resetAllFilters();
      this.switchView("calendar");
    });
  }

  switchView(viewName) {
    this.currentView = viewName;
    
    // Update top tabs
    this.tabButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    // Update mobile bottom nav
    document.querySelectorAll(".mobile-nav-item[data-view]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    this.views.forEach(v => {
      v.classList.remove("active");
    });
    
    const target = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
    if (target) target.classList.add("active");

    this.refreshCurrentView();
  }

  async refreshCurrentView() {
    if (this.currentView === "calendar") {
      await this.calendarCtrl.render();
    } else if (this.currentView === "feed") {
      await this.feedCtrl.renderFeed();
    } else if (this.currentView === "gallery") {
      await this.feedCtrl.renderGallery();
    } else if (this.currentView === "analytics") {
      await this.analyticsCtrl.render();
    }
  }

  async refreshAllViews() {
    try {
      await this.calendarCtrl?.render();
      if (this.currentView === "feed") await this.feedCtrl?.renderFeed();
      if (this.currentView === "gallery") await this.feedCtrl?.renderGallery();
      if (this.currentView === "analytics") await this.analyticsCtrl?.render();
    } catch (err) {
      console.error("refreshAllViews error:", err);
      alert("デバッグ情報: 画面の更新中にエラーが発生しました。\n" + err.toString());
    }
  }

  setupSearch() {
    this.searchInput?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim();
      this.btnClearSearch?.classList.toggle("hidden", !this.searchQuery);
      this.updateFilterLabel();
      this.refreshAllViews();
    });

    this.btnClearSearch?.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.btnClearSearch.classList.add("hidden");
      this.updateFilterLabel();
      this.refreshAllViews();
    });
  }

  setupAspectChips() {
    if (!this.tenAspectsChipsContainer) return;
    this.tenAspectsChipsContainer.innerHTML = "";

    TEN_ASPECTS.forEach(aspect => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "aspect-chip-btn";
      chip.dataset.id = aspect.id;
      chip.innerHTML = `
        <span class="chip-hash-symbol">#</span>
        <span class="chip-label">${aspect.shortName}</span>
      `;

      chip.addEventListener("click", () => {
        if (this.selectedAspectIds.has(aspect.id)) {
          this.selectedAspectIds.delete(aspect.id);
          chip.classList.remove("selected");
        } else {
          this.selectedAspectIds.add(aspect.id);
          chip.classList.add("selected");
        }
        this.updateAspectCounter();
      });

      this.tenAspectsChipsContainer.appendChild(chip);
    });
  }

  updateAspectCounter() {
    if (this.aspectSelectionCounter) {
      this.aspectSelectionCounter.textContent = `${this.selectedAspectIds.size}個選択中`;
    }
  }

  setupFormModal() {
    this.btnNewPost?.addEventListener("click", () => this.openNewPostModal());
    this.fabNewPost?.addEventListener("click", () => this.openNewPostModal());
    this.btnClosePostModal?.addEventListener("click", () => this.closePostModal());
    this.btnCancelPost?.addEventListener("click", () => this.closePostModal());

    this.postModal?.addEventListener("click", (e) => {
      if (e.target === this.postModal) this.closePostModal();
    });

    this.photoDropZone?.addEventListener("click", (e) => {
      if (e.target.closest("#btnRemovePhoto")) return;
      this.photoFileInput?.click();
    });

    this.photoFileInput?.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleImageFiles(e.target.files);
      }
    });

    this.photoDropZone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.photoDropZone.classList.add("drag-over");
    });

    this.photoDropZone?.addEventListener("dragleave", () => {
      this.photoDropZone.classList.remove("drag-over");
    });

    this.photoDropZone?.addEventListener("drop", (e) => {
      e.preventDefault();
      this.photoDropZone.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleImageFiles(e.dataTransfer.files);
      }
    });

    this.btnRemovePhoto?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.clearPhoto();
    });

    this.recordForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.savePostRecord();
    });
  }

  handleImageFiles(files) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 6);
    if (validFiles.length === 0) {
      alert("画像ファイル（JPG, PNG, HEIC等）を選択してください。");
      return;
    }

    this.currentPhotosData = [];
    this.previewImagesWrapper.innerHTML = "";
    this.uploadPlaceholder.classList.add("hidden");
    this.previewContainer.classList.remove("hidden");

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIDE = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIDE) { height *= MAX_SIDE / width; width = MAX_SIDE; }
          } else {
            if (height > MAX_SIDE) { width *= MAX_SIDE / height; height = MAX_SIDE; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          this.currentPhotosData.push(dataUrl);

          const imgEl = document.createElement("img");
          imgEl.src = dataUrl;
          imgEl.className = "preview-image";
          this.previewImagesWrapper.appendChild(imgEl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  clearPhoto() {
    this.currentPhotosData = [];
    if (this.photoFileInput) this.photoFileInput.value = "";
    if (this.previewImagesWrapper) this.previewImagesWrapper.innerHTML = "";
    this.previewContainer.classList.add("hidden");
    this.uploadPlaceholder.classList.remove("hidden");
  }

  openNewPostModal(defaults = {}) {
    this.recordForm.reset();
    this.recordIdInput.value = "";
    this.postModalTitle.textContent = "新しい実践を記録";
    this.clearPhoto();

    const currentUser = window.storageService.getCurrentUser() || "";
    this.recordAuthorInput.value = currentUser;

    const today = new Date().toISOString().slice(0, 10);
    this.recordDateInput.value = defaults.date || today;

    if (this.currentGradeFilter !== "all" && this.recordGradeSelect) {
      this.recordGradeSelect.value = this.currentGradeFilter;
      this.updateFormClassOptions(this.currentGradeFilter, this.currentClassFilter !== "all" ? this.currentClassFilter : null);
    } else {
      this.updateFormClassOptions(this.recordGradeSelect?.value);
    }

    this.selectedAspectIds.clear();
    this.updateAspectChipsUI();

    this.postModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (window.lucide) window.lucide.createIcons();
  }

  openEditPostModal(rec) {
    this.recordIdInput.value = rec.id;
    this.postModalTitle.textContent = "投稿の編集";
    this.recordAuthorInput.value = rec.authorName || window.storageService.getCurrentUser() || "";
    this.recordDateInput.value = rec.date;
    this.recordCommentInput.value = rec.comment;

    const hierarchy = window.storageService.getGradeHierarchy();
    let matchedGrade = hierarchy.find(g => (g.classes || []).includes(rec.className));
    if (!matchedGrade) matchedGrade = hierarchy[1];

    if (this.recordGradeSelect) {
      this.recordGradeSelect.value = matchedGrade.gradeId;
      this.updateFormClassOptions(matchedGrade.gradeId, rec.className);
    }

    this.currentPhotosData = (rec.optimisticPhotoUrls && rec.optimisticPhotoUrls.length > 0) ? [...rec.optimisticPhotoUrls] : (rec.photoUrl ? rec.photoUrl.split(',') : []);
    this.previewImagesWrapper.innerHTML = "";
    this.currentPhotosData.forEach(url => {
      const imgEl = document.createElement("img");
      imgEl.src = url;
      imgEl.className = "preview-image";
      this.previewImagesWrapper.appendChild(imgEl);
    });
    this.uploadPlaceholder.classList.add("hidden");
    this.previewContainer.classList.remove("hidden");

    this.selectedAspectIds = new Set(rec.aspects || []);
    this.updateAspectChipsUI();

    this.postModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (window.lucide) window.lucide.createIcons();
  }

  updateAspectChipsUI() {
    document.querySelectorAll(".aspect-chip-btn").forEach(chip => {
      const id = chip.dataset.id;
      chip.classList.toggle("selected", this.selectedAspectIds.has(id));
    });
    this.updateAspectCounter();
  }

  closePostModal() {
    this.postModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  async savePostRecord() {
    if (!this.currentPhotosData || this.currentPhotosData.length === 0) {
      alert("授業や活動の写真を1枚以上アップロードしてください。");
      return;
    }

    // 連打防止＆処理中UIの表示
    const btnSubmit = document.getElementById("btnSubmitPost");
    if (btnSubmit) btnSubmit.disabled = true;
    
    const loadingOverlay = document.getElementById("globalLoadingOverlay");
    if (loadingOverlay) loadingOverlay.classList.remove("hidden");

    // ブラウザに「処理中画面」を描画させるための微小な待機（重い処理でフリーズする前に描画させる）
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const isEdit = !!this.recordIdInput.value;
      const recordId = this.recordIdInput.value || "rec_" + Date.now();
    const author = this.recordAuthorInput.value.trim() || window.storageService.getCurrentUser() || "先生";
    const selectedClass = this.recordClassSelect.value;

    if (author) window.storageService.setCurrentUser(author);
    this.updateHeaderUserName(author);

    const base64Images = this.currentPhotosData.filter(url => url.startsWith("data:image/"));
    const existingUrls = this.currentPhotosData.filter(url => !url.startsWith("data:image/"));

    const recordData = {
      id: recordId,
      authorName: author,
      date: this.recordDateInput.value,
      className: selectedClass,
      photoUrl: existingUrls.join(','),
      images: base64Images,
      filename: recordId + ".jpg",
      driveUrl: "",
      comment: this.recordCommentInput.value,
      aspects: Array.from(this.selectedAspectIds),
      syncedDrive: true
    };

    if (isEdit) {
      const existing = await window.storageService.getRecordById(recordId);
      if (existing && existing.comments) {
        recordData.comments = existing.comments;
      }
    }

    await window.storageService.saveRecord(recordData);
    this.closePostModal();

    this.showToast(isEdit ? "投稿を更新しました！" : "新しい実践を投稿しました！📸✨");
    if (!isEdit && typeof confetti === "function") {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    }

    // モーダルが閉じるアニメーションを阻害しないよう、少し遅延させてからDOMを再描画する
    setTimeout(() => {
      this.refreshAllViews();
    }, 50);

    } catch (err) {
      console.error(err);
      alert("エラーが発生しました。");
    } finally {
      const loadingOverlay = document.getElementById("globalLoadingOverlay");
      if (loadingOverlay) loadingOverlay.classList.add("hidden");
      const btnSubmit = document.getElementById("btnSubmitPost");
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }

  // ================= 印刷選択モーダル =================

  setupPrintSelectorModal() {
    this.btnPrintSelectorOpen?.addEventListener("click", () => {
      this.openPrintSelector();
    });

    this.btnClosePrintSelectModal?.addEventListener("click", () => {
      this.closePrintSelector();
    });
    this.btnCancelPrintSelect?.addEventListener("click", () => {
      this.closePrintSelector();
    });

    this.printSelectModal?.addEventListener("click", (e) => {
      if (e.target === this.printSelectModal) this.closePrintSelector();
    });

    // 学年セレクト変更
    this.printFilterGradeSelect?.addEventListener("change", (e) => {
      this.currentPrintGradeFilter = e.target.value;
      this.updatePrintFilterClassOptions(this.currentPrintGradeFilter);
      this.currentPrintClassFilter = "all";
      this.refreshPrintSelectItems();
    });

    // クラスセレクト変更
    this.printFilterClassSelect?.addEventListener("change", (e) => {
      this.currentPrintClassFilter = e.target.value;
      this.refreshPrintSelectItems();
    });

    this.btnSelectAllPrint?.addEventListener("click", () => {
      document.querySelectorAll(".print-select-card-checkbox").forEach(cb => {
        cb.checked = true;
        this.selectedPrintRecordIds.add(cb.dataset.id);
      });
      this.updatePrintSelectCounter();
    });

    this.btnDeselectAllPrint?.addEventListener("click", () => {
      document.querySelectorAll(".print-select-card-checkbox").forEach(cb => {
        cb.checked = false;
        this.selectedPrintRecordIds.delete(cb.dataset.id);
      });
      this.updatePrintSelectCounter();
    });

    this.btnExecuteSelectedPrint?.addEventListener("click", () => {
      this.executeSelectedPrint();
    });
  }

  setupPrintFilterDropdowns() {
    if (!this.printFilterGradeSelect || !this.printFilterClassSelect) return;
    
    const hierarchy = window.storageService.getGradeHierarchy();

    // 学年セレクトの構築
    this.printFilterGradeSelect.innerHTML = "";
    hierarchy.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.gradeId;
      opt.textContent = g.gradeName;
      this.printFilterGradeSelect.appendChild(opt);
    });

    // 現在のメイン画面のフィルター状態を初期値として反映
    this.currentPrintGradeFilter = this.currentGradeFilter;
    this.printFilterGradeSelect.value = this.currentGradeFilter;

    this.updatePrintFilterClassOptions(this.currentGradeFilter);
    this.currentPrintClassFilter = this.currentClassFilter;
    this.printFilterClassSelect.value = this.currentClassFilter;
  }

  updatePrintFilterClassOptions(gradeId) {
    if (!this.printFilterClassSelect) return;
    this.printFilterClassSelect.innerHTML = "";

    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = gradeId === "all" ? "すべての学級" : "学年全体";
    this.printFilterClassSelect.appendChild(allOpt);

    if (gradeId === "all") return;

    const hierarchy = window.storageService.getGradeHierarchy();
    const grade = hierarchy.find(g => g.gradeId === gradeId);
    if (!grade || !grade.classes) return;

    grade.classes.forEach(cls => {
      const opt = document.createElement("option");
      opt.value = cls;
      opt.textContent = cls;
      this.printFilterClassSelect.appendChild(opt);
    });
  }

  async openPrintSelector() {
    this.setupPrintFilterDropdowns();
    
    const records = await window.storageService.getAllRecords();
    if (records.length === 0) {
      alert("印刷対象となる投稿がありません。");
      return;
    }

    this.selectedPrintRecordIds.clear();
    // 全件デフォルト選択
    records.forEach(r => this.selectedPrintRecordIds.add(r.id));

    await this.refreshPrintSelectItems();

    this.printSelectModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (window.lucide) window.lucide.createIcons();
  }

  async refreshPrintSelectItems() {
    const allRecords = await window.storageService.getAllRecords();
    const hierarchy = window.storageService.getGradeHierarchy();
    const currentGrade = hierarchy.find(g => g.gradeId === this.currentPrintGradeFilter);

    const filtered = allRecords.filter(rec => {
      if (this.currentPrintGradeFilter !== "all") {
        if (this.currentPrintClassFilter !== "all") {
          if (rec.className !== this.currentPrintClassFilter) return false;
        } else if (currentGrade) {
          const isBelong = (currentGrade.classes || []).includes(rec.className) || rec.className.startsWith(currentGrade.gradeName);
          if (!isBelong) return false;
        }
      }
      return true;
    });

    this.renderPrintSelectItems(filtered);
    this.updatePrintSelectCounter();
  }

  closePrintSelector() {
    this.printSelectModal?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  renderPrintSelectItems(records) {
    if (!this.printSelectItemsContainer) return;
    this.printSelectItemsContainer.innerHTML = "";

    if (records.length === 0) {
      this.printSelectItemsContainer.innerHTML = `
        <div class="empty-feed-state" style="padding: 24px;">
          <p class="empty-main-text">指定した学年・学級の記録はありません</p>
          <p class="empty-sub-text">条件を変更して再度ご確認ください。</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    records.forEach(rec => {
      const item = document.createElement("div");
      item.className = "print-select-item-card";

      const isChecked = this.selectedPrintRecordIds.has(rec.id);
      const aspectTagsHtml = (rec.aspects || []).map(aspectId => {
        const aspect = TEN_ASPECTS.find(a => a.id === aspectId);
        return aspect ? `<span class="print-mini-tag">${aspect.tag}</span>` : "";
      }).join(" ");

      item.innerHTML = `
        <label class="print-item-label">
          <input type="checkbox" class="print-select-card-checkbox" data-id="${rec.id}" ${isChecked ? 'checked' : ''}>
          <img src="${rec.photoUrl}" alt="写真" class="print-item-thumb" loading="lazy">
          <div class="print-item-info">
            <div class="print-item-header-meta">
              <span class="print-item-class">${rec.className}</span>
              <span class="print-item-author">${rec.authorName || '先生'}</span>
              <span class="print-item-date">${rec.date}</span>
            </div>
            <p class="print-item-comment">${rec.comment}</p>
            <div class="print-item-aspects">${aspectTagsHtml}</div>
          </div>
        </label>
      `;

      const cb = item.querySelector(".print-select-card-checkbox");
      cb.addEventListener("change", () => {
        if (cb.checked) {
          this.selectedPrintRecordIds.add(rec.id);
        } else {
          this.selectedPrintRecordIds.delete(rec.id);
        }
        this.updatePrintSelectCounter();
      });

      this.printSelectItemsContainer.appendChild(item);
    });
  }

  updatePrintSelectCounter() {
    if (this.selectedPrintCounter) {
      this.selectedPrintCounter.textContent = `${this.selectedPrintRecordIds.size} 件選択中`;
    }
  }

  async executeSelectedPrint() {
    if (this.selectedPrintRecordIds.size === 0) {
      alert("印刷する記録を1件以上選択してください。");
      return;
    }

    const allRecords = await window.storageService.getAllRecords();
    const targetRecords = allRecords.filter(r => this.selectedPrintRecordIds.has(r.id));

    if (!this.printOutputContainer) return;

    // 印刷用HTMLの構築
    this.printOutputContainer.innerHTML = `
      <div class="print-sheet-header">
        <h1 class="print-sheet-title">小学校 実践の学び・カリキュラムポートフォリオ</h1>
        <div class="print-sheet-meta">
          <span>出力日: ${new Date().toLocaleDateString('ja-JP')}</span>
          <span>選択件数: ${targetRecords.length}件</span>
        </div>
      </div>
      <div class="print-sheet-grid">
        ${targetRecords.map(r => {
          const tags = (r.aspects || []).map(aid => {
            const a = TEN_ASPECTS.find(asp => asp.id === aid);
            return a ? `<span class="print-aspect-badge">${a.tag}</span>` : "";
          }).join(" ");

          return `
            <div class="print-record-card">
              <div class="print-card-img-wrap">
                <img src="${r.photoUrl ? r.photoUrl.split(',')[0] : ''}" alt="投稿写真" class="print-card-img">
              </div>
              <div class="print-card-body">
                <div class="print-card-top-row">
                  <span class="print-card-class">${r.className}</span>
                  <span class="print-card-author">${r.authorName || '先生'}</span>
                  <span class="print-card-date">${r.date}</span>
                </div>
                <div class="print-card-tags">${tags}</div>
                <p class="print-card-comment">${r.comment}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    this.closePrintSelector();

    // 印刷実行
    setTimeout(() => {
      window.print();
    }, 200);
  }

  // ================= クラス設定モーダル =================

  setupClassesModal() {
    this.btnManageClasses?.addEventListener("click", () => {
      this.populateManageGradeSelect();
      this.renderHierarchicalClassesList();
      this.classesModal?.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      if (window.lucide) window.lucide.createIcons();
    });

    this.btnCloseClassesModal?.addEventListener("click", () => {
      this.classesModal?.classList.add("hidden");
      document.body.style.overflow = "";
    });

    this.btnSaveClassesDone?.addEventListener("click", async () => {
      if (!confirm("この設定で学年・学級を保存し、他の端末とも設定を同期しますか？")) return;
      
      const hierarchy = window.storageService.getGradeHierarchy();
      
      // ボタンを一時的に無効化
      if (this.btnSaveClassesDone) {
        this.btnSaveClassesDone.disabled = true;
        this.btnSaveClassesDone.innerHTML = `<i data-lucide="loader" class="spin"></i> 保存中...`;
        if (window.lucide) window.lucide.createIcons();
      }

      try {
        await window.storageService.saveSystemHierarchy(hierarchy);
        this.classesModal?.classList.add("hidden");
        document.body.style.overflow = "";
        this.setupHierarchicalStories();
        this.setupFormGradeClassOptions();
        this.refreshAllViews();
        this.showToast("学年・学級設定を保存・同期しました");
      } catch (e) {
        alert("同期に失敗しました。通信環境を確認してください。");
        console.error(e);
      } finally {
        if (this.btnSaveClassesDone) {
          this.btnSaveClassesDone.disabled = false;
          this.btnSaveClassesDone.innerHTML = `<i data-lucide="save"></i> 保存して閉じる`;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });

    this.manageGradeSelect?.addEventListener("change", () => {
      this.renderHierarchicalClassesList();
    });

    this.addClassForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const targetGradeId = this.manageGradeSelect.value;
      const newName = this.newClassNameInput.value.trim();
      if (!newName) return;

      const hierarchy = window.storageService.getGradeHierarchy();
      const targetGrade = hierarchy.find(g => g.gradeId === targetGradeId);
      if (!targetGrade) return;

      if (!targetGrade.classes) targetGrade.classes = [];
      if (targetGrade.classes.includes(newName)) {
        alert("そのクラス名は既に登録されています。");
        return;
      }

      targetGrade.classes.push(newName);
      window.storageService.saveGradeHierarchy(hierarchy);
      this.newClassNameInput.value = "";
      this.renderHierarchicalClassesList();
    });

    this.btnResetDefaultClasses?.addEventListener("click", () => {
      if (confirm("学年・学級設定を初期状態に戻しますか？")) {
        window.storageService.saveGradeHierarchy(DEFAULT_GRADE_HIERARCHY);
        this.populateManageGradeSelect();
        this.renderHierarchicalClassesList();
        this.showToast("学級設定を初期値に戻しました");
      }
    });
  }

  populateManageGradeSelect() {
    if (!this.manageGradeSelect) return;
    const hierarchy = window.storageService.getGradeHierarchy().filter(g => g.gradeId !== "all");

    this.manageGradeSelect.innerHTML = "";
    hierarchy.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.gradeId;
      opt.textContent = `${g.gradeName} （${(g.classes || []).length}クラス）`;
      this.manageGradeSelect.appendChild(opt);
    });
  }

  renderHierarchicalClassesList() {
    if (!this.classesListContainer || !this.manageGradeSelect) return;
    this.classesListContainer.innerHTML = "";

    const selectedGradeId = this.manageGradeSelect.value;
    const hierarchy = window.storageService.getGradeHierarchy();
    const grade = hierarchy.find(g => g.gradeId === selectedGradeId);

    if (!grade || !grade.classes || grade.classes.length === 0) {
      this.classesListContainer.innerHTML = `<p class="text-muted" style="padding: 8px;">登録されているクラスはありません</p>`;
      return;
    }

    grade.classes.forEach((clsName, idx) => {
      const item = document.createElement("div");
      item.className = "class-manage-item";
      item.innerHTML = `
        <div class="class-item-name">
          <i data-lucide="users"></i>
          <span>${clsName}</span>
        </div>
        <button type="button" class="btn-delete-class" data-idx="${idx}" title="削除">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      item.querySelector(".btn-delete-class")?.addEventListener("click", () => {
        if (confirm(`「${clsName}」をリストから削除しますか？`)) {
          grade.classes.splice(idx, 1);
          window.storageService.saveGradeHierarchy(hierarchy);
          this.renderHierarchicalClassesList();
          this.populateManageGradeSelect();
        }
      });

      this.classesListContainer.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  setupExport() {
    this.btnExportData?.addEventListener("click", () => {
      const choice = confirm("【データ出力】\nOK: カリキュラム一覧CSVを出力\nキャンセル: JSON完全バックアップを出力");
      if (choice) {
        window.storageService.exportCsv();
      } else {
        window.storageService.exportJson();
      }
    });
  }

  showToast(message) {
    if (!this.toastEl || !this.toastMessage) return;
    this.toastMessage.textContent = message;
    this.toastEl.classList.remove("hidden");
    setTimeout(() => {
      this.toastEl.classList.add("hidden");
    }, 3200);
  }
  showListModal(title, items) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
    overlay.style.zIndex = "9999";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backdropFilter = "blur(4px)";
    
    const modal = document.createElement("div");
    modal.style.background = "var(--bg-surface)";
    modal.style.borderRadius = "var(--radius-lg)";
    modal.style.padding = "20px";
    modal.style.width = "90%";
    modal.style.maxWidth = "320px";
    modal.style.boxShadow = "var(--shadow-xl)";
    modal.style.animation = "modalFadeIn 0.3s ease";
    
    const h3 = document.createElement("h3");
    h3.textContent = title;
    h3.style.marginTop = "0";
    h3.style.marginBottom = "16px";
    h3.style.fontSize = "1.1rem";
    h3.style.color = "var(--text-primary)";
    h3.style.borderBottom = "1px solid var(--border-light)";
    h3.style.paddingBottom = "8px";
    h3.style.display = "flex";
    h3.style.justifyContent = "space-between";
    h3.style.alignItems = "center";

    const closeIcon = document.createElement("button");
    closeIcon.innerHTML = "&times;";
    closeIcon.style.background = "none";
    closeIcon.style.border = "none";
    closeIcon.style.fontSize = "1.5rem";
    closeIcon.style.color = "var(--text-muted)";
    closeIcon.style.cursor = "pointer";
    closeIcon.onclick = () => overlay.remove();
    h3.appendChild(closeIcon);
    
    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    ul.style.margin = "0 0 20px 0";
    ul.style.maxHeight = "300px";
    ul.style.overflowY = "auto";
    
    if (items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "まだありません";
      li.style.color = "var(--text-muted)";
      li.style.padding = "8px 0";
      li.style.textAlign = "center";
      ul.appendChild(li);
    } else {
      items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        li.style.padding = "10px 0";
        li.style.borderBottom = "1px solid var(--border-light)";
        li.style.fontWeight = "600";
        ul.appendChild(li);
      });
    }
    
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "閉じる";
    closeBtn.className = "btn btn-primary";
    closeBtn.style.width = "100%";
    closeBtn.onclick = () => overlay.remove();
    
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
    
    modal.appendChild(h3);
    modal.appendChild(ul);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  openDetailModal(rec) {
    this.feedCtrl?.openDetailModal(rec);
  }
}

// 起動
document.addEventListener("DOMContentLoaded", () => {
  if (navigator.userAgent.indexOf("Line") > -1) {
    const banner = document.createElement("div");
    banner.style.background = "#FFEBEE";
    banner.style.color = "#C62828";
    banner.style.padding = "12px 16px";
    banner.style.textAlign = "center";
    banner.style.fontSize = "0.85rem";
    banner.style.fontWeight = "bold";
    banner.style.borderBottom = "1px solid #FFCDD2";
    banner.style.zIndex = "10000";
    banner.style.position = "relative";
    banner.innerHTML = "⚠️ LINEのブラウザでは写真が表示されません。<br>右下のメニュー（⋮ または ⠇）から「ブラウザで開く」を選び、SafariやChromeでご覧ください。";
    document.body.prepend(banner);
  }

  window.app = new EduRecordApp();
  window.app.init();
});
