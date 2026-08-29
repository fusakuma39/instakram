/**
 * 完全クラウド同期対応 ストレージサービス (Google Apps Script / Drive / Spreadsheet)
 */
class StorageService {
  constructor() {
    this.dbName = "EduRecordDB_Elementary";
    this.dbVersion = 1;
    this.db = null;
    this.userNameKey = "instaKuram_current_user";
    this.gradeHierarchyKey = "instaKuram_grade_hierarchy";
    
    // ユーザー様から提供されたGAS Web AppエンドポイントURL
    this.gasUrl = "https://script.google.com/a/macros/edu.city.yokohama.jp/s/AKfycbwxXPm0aEbwGkSqrBW1mA9_rsowwsGG31zI8dANeGwdjXVDyCVJyWae4O4yJrVDN3Bt/exec";
  }

  // IndexedDBの初期化 & クラウドからの自動同期
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("records")) {
          const store = db.createObjectStore("records", { keyPath: "id" });
          store.createIndex("date", "date", { unique: false });
          store.createIndex("className", "className", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        
        // 1. 初回サンプルデータの投入（空の場合）
        const count = await this.countRecords();
        if (count === 0 && typeof SAMPLE_RECORDS !== "undefined") {
          for (const sample of SAMPLE_RECORDS) {
            await this.saveRecordLocal(sample);
          }
        }

        // 2. クラウド（GAS）から最新データを非同期で取得して同期
        this.syncFromCloud().catch(err => console.warn("Cloud sync initial error:", err));

        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("IndexedDB open error:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  // クラウド（GAS）から全端末の投稿データを取得して端末内DBにマージ
  async syncFromCloud() {
    if (!this.gasUrl) return;
    try {
      const res = await fetch(this.gasUrl, { method: "GET" });
      if (res.ok) {
        const cloudRecords = await res.json();
        if (Array.isArray(cloudRecords) && cloudRecords.length > 0) {
          for (const rec of cloudRecords) {
            if (rec && rec.id) {
              await this.saveRecordLocal(rec);
            }
          }
          if (window.app && typeof window.app.refreshAllViews === "function") {
            window.app.refreshAllViews();
          }
        }
      }
    } catch (e) {
      console.warn("GAS Fetch notice:", e);
    }
  }

  // ユーザー名
  getCurrentUser() {
    return localStorage.getItem(this.userNameKey) || "";
  }

  setCurrentUser(name) {
    localStorage.setItem(this.userNameKey, name.trim());
  }

  // 学年・クラス階層構造
  getGradeHierarchy() {
    try {
      const raw = localStorage.getItem(this.gradeHierarchyKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_GRADE_HIERARCHY;
  }

  saveGradeHierarchy(hierarchy) {
    localStorage.setItem(this.gradeHierarchyKey, JSON.stringify(hierarchy));
  }

  getAllClassNames() {
    const hierarchy = this.getGradeHierarchy();
    const list = [];
    hierarchy.forEach(g => {
      if (g.classes && g.classes.length > 0) {
        list.push(...g.classes);
      }
    });
    return list;
  }

  async countRecords() {
    return new Promise((resolve) => {
      const transaction = this.db.transaction(["records"], "readonly");
      const store = transaction.objectStore("records");
      const countRequest = store.count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => resolve(0);
    });
  }

  async getAllRecords() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["records"], "readonly");
      const store = transaction.objectStore("records");
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        records.sort((a, b) => new Date(b.date + "T" + (b.createdAt ? b.createdAt.split("T")[1] : "00:00:00")) - new Date(a.date + "T" + (a.createdAt ? a.createdAt.split("T")[1] : "00:00:00")));
        resolve(records);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getRecordById(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["records"], "readonly");
      const store = transaction.objectStore("records");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 端末内IndexedDBへの直接保存
  async saveRecordLocal(record) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["records"], "readwrite");
      const store = transaction.objectStore("records");
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  // 投稿の保存（ローカルIndexedDB保存 ＋ Googleドライブ/スプレッドシートへ送信）
  async saveRecord(record) {
    if (!record.id) {
      record.id = "rec_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    }
    if (!record.createdAt) {
      record.createdAt = new Date().toISOString();
    }
    if (!record.authorName) {
      record.authorName = this.getCurrentUser() || "先生";
    }
    if (!record.comments) {
      record.comments = [];
    }
    record.updatedAt = new Date().toISOString();

    // 1. まずローカルに保存して瞬時にUIに反映
    await this.saveRecordLocal(record);

    // 2. クラウド（GAS）に送信
    this.sendToGas(record).catch(err => console.warn("GAS save error:", err));

    return record;
  }

  // GASへ投稿データ全体（写真Base64＋テキスト一式）を送信
  async sendToGas(record) {
    if (!this.gasUrl) return;

    try {
      const payload = {
        id: record.id,
        authorName: record.authorName,
        date: record.date,
        className: record.className,
        image: record.photoUrl,
        filename: `${record.date}_${record.className}_${record.id}.jpg`,
        comment: record.comment,
        aspects: record.aspects || [],
        likes: record.likes || 0,
        comments: record.comments || [],
        createdAt: record.createdAt
      };

      const res = await fetch(this.gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        if (result && result.photoUrl && result.photoUrl !== record.photoUrl) {
          record.photoUrl = result.photoUrl;
          await this.saveRecordLocal(record);
        }
      }
    } catch (err) {
      console.warn("GAS POST notice:", err);
    }
  }

  async addComment(recordId, text, authorName) {
    const record = await this.getRecordById(recordId);
    if (!record) return null;

    if (!record.comments) record.comments = [];
    const newComment = {
      id: "c_" + Date.now(),
      author: authorName || this.getCurrentUser() || "先生",
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    record.comments.push(newComment);
    await this.saveRecord(record);
    return record;
  }

  async deleteRecord(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["records"], "readwrite");
      const store = transaction.objectStore("records");
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async toggleLike(id) {
    const record = await this.getRecordById(id);
    if (!record) return null;
    record.likes = (record.likes || 0) + 1;
    await this.saveRecord(record);
    return record;
  }

  async addReaction(id, emoji) {
    const record = await this.getRecordById(id);
    if (!record) return null;
    if (!record.reactions) record.reactions = [];
    record.reactions.push(emoji);
    await this.saveRecord(record);
    return record;
  }

  // ================= エクスポート =================

  async exportJson() {
    const records = await this.getAllRecords();
    const data = {
      app: "instaKuram",
      version: "4.0_cloud_synced",
      currentUser: this.getCurrentUser(),
      gradeHierarchy: this.getGradeHierarchy(),
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records: records
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insta倉m_小学校実践記録バックアップ_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportCsv() {
    const records = await this.getAllRecords();
    const headers = ["ID", "実施日", "学年学級", "投稿者", "一言コメント", "10の姿ハッシュタグ", "コメント数", "作成日時"];
    
    const rows = records.map(r => {
      const aspectNames = (r.aspects || []).map(id => {
        const aspect = TEN_ASPECTS.find(a => a.id === id);
        return aspect ? aspect.tag : id;
      }).join(" ");

      return [
        `"${r.id}"`,
        `"${r.date}"`,
        `"${r.className}"`,
        `"${r.authorName || ''}"`,
        `"${(r.comment || '').replace(/"/g, '""')}"`,
        `"${aspectNames}"`,
        `"${(r.comments || []).length}"`,
        `"${r.createdAt}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insta倉m_小学校実践一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.storageService = new StorageService();
