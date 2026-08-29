/**
 * 完全クラウド同期対応 ストレージサービス (Google Apps Script / Drive / Spreadsheet)
 * ローカルストレージ(IndexedDB, localStorage)を廃止し、sessionStorageとメモリで状態管理を行います。
 */
class StorageService {
  constructor() {
    this.userNameKey = "instaKuram_current_user";
    this.gradeHierarchyKey = "instaKuram_grade_hierarchy";
    
    // GAS Web AppエンドポイントURL
    this.gasUrl = "https://script.google.com/macros/s/AKfycbyNWrW3UEwegNLdFYIN2fBhjV7mbjmC18ZBxmNviVUqjgyO_Dg1lD92NzbY2bGYh-VUvg/exec";

    // メモリ上のレコードキャッシュ
    this.records = [];
  }

  // 初期化 (GASからデータ取得)
  async init() {
    // 1. ローカルキャッシュからの高速起動
    try {
      const cached = localStorage.getItem("insta_records_cache");
      if (cached) {
        this.records = JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to load cache", e);
    }

    // 2. バックグラウンドで最新データをGASから取得
    this.fetchFromCloudBackground();
    
    return true;
  }

  async fetchFromCloudBackground() {
    try {
      if (!this.gasUrl) return;
      const res = await fetch(this.gasUrl, { method: "GET" });
      if (res.ok) {
        const cloudRecords = await res.json();
        if (Array.isArray(cloudRecords)) {
          this.processCloudRecords(cloudRecords);
          localStorage.setItem("insta_records_cache", JSON.stringify(this.records));
          // UI更新を通知
          document.dispatchEvent(new CustomEvent('instaDataUpdated'));
        }
      }
    } catch (err) {
      console.error("Cloud sync background error:", err);
    }
  }

  processCloudRecords(cloudRecords) {
    cloudRecords.forEach(r => {
      if (r.date && r.date.includes("T")) {
        const d = new Date(r.date);
        if (!isNaN(d)) {
          r.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
      }

      if (r.photoUrl && r.photoUrl.includes("drive.google.com")) {
        const urls = r.photoUrl.split(',');
        r.photoUrl = urls.map(url => {
          const match = url.match(/id=([a-zA-Z0-9_-]+)/);
          if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
          return url;
        }).join(',');
      }

      if (typeof r.likes === 'number') {
        r.likes = Array(r.likes).fill('先生');
      } else if (typeof r.likes === 'string') {
        r.likes = r.likes ? r.likes.split(',') : [];
      } else if (!Array.isArray(r.likes)) {
        r.likes = [];
      }
    });

    const systemRecIndex = cloudRecords.findIndex(r => r.id === "system_hierarchy_config" && r.className === "_SYSTEM_");
    if (systemRecIndex !== -1) {
      const sysRec = cloudRecords[systemRecIndex];
      try {
        if (sysRec.comment) {
          const cloudHierarchy = JSON.parse(sysRec.comment);
          localStorage.setItem(this.gradeHierarchyKey, JSON.stringify(cloudHierarchy));
        }
      } catch (e) {
        console.error("Failed to parse system hierarchy:", e);
      }
      cloudRecords.splice(systemRecIndex, 1);
    }

    this.records = cloudRecords.sort((a, b) => {
      const timeA = (a.createdAt && a.createdAt.includes("T")) ? a.createdAt.split("T")[1] : "00:00:00";
      const timeB = (b.createdAt && b.createdAt.includes("T")) ? b.createdAt.split("T")[1] : "00:00:00";
      const dateA = new Date(a.date + "T" + timeA);
      const dateB = new Date(b.date + "T" + timeB);
      return dateB - dateA;
    });
  }

  // ユーザー名 (sessionStorageを使用)
  getCurrentUser() {
    return sessionStorage.getItem(this.userNameKey) || "";
  }

  setCurrentUser(name) {
    sessionStorage.setItem(this.userNameKey, name.trim());
  }

  // 学年・クラス階層構造
  getGradeHierarchy() {
    try {
      const raw = sessionStorage.getItem(this.gradeHierarchyKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return typeof DEFAULT_GRADE_HIERARCHY !== 'undefined' ? DEFAULT_GRADE_HIERARCHY : [];
  }

  saveGradeHierarchy(hierarchy) {
    sessionStorage.setItem(this.gradeHierarchyKey, JSON.stringify(hierarchy));
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
    return this.records.length;
  }

  async getAllRecords() {
    return this.records;
  }

  async getRecordById(id) {
    return this.records.find(r => r.id === id) || null;
  }

  // 投稿の保存（GASへの直接送信後、メモリを更新）
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

    // 1. GASに送信 (非同期ではなく待機する。失敗してもローカルメモリには保存する)
    try {
      await this.sendToGas(record);
    } catch (err) {
      console.error("GAS Error:", err);
      alert("ドライブへの保存に失敗しました。\nエラー詳細: " + err.message + "\n\n※AIアシスタントにこのエラーメッセージを伝えてください。");
    }
      
    // 2. メモリのレコードを更新
    const index = this.records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      this.records[index] = record;
    } else {
      this.records.unshift(record); // 先頭に追加
    }

    // 降順ソート維持
    this.records.sort((a, b) => {
      const dateA = new Date(a.date + "T" + (a.createdAt ? a.createdAt.split("T")[1] : "00:00:00"));
      const dateB = new Date(b.date + "T" + (b.createdAt ? b.createdAt.split("T")[1] : "00:00:00"));
      return dateB - dateA;
    });

    return record;
  }

  // GASへ投稿データ全体（写真Base64＋テキスト一式）を送信
  async sendToGas(record) {
    if (!this.gasUrl) return true;
    try {
      const payload = {
        action: "save",
        ...record,
        likes: Array.isArray(record.likes) ? record.likes.join(',') : record.likes
      };

      const res = await fetch(this.gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`GAS request failed: ${res.status}`);
      }

      const result = await res.json();
      if (result && result.photoUrl && result.photoUrl !== record.photoUrl) {
        let newPhotoUrl = result.photoUrl;
        if (newPhotoUrl.includes("drive.google.com")) {
          const urls = newPhotoUrl.split(',');
          newPhotoUrl = urls.map(url => {
            const match = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
            return url;
          }).join(',');
        }
        record.photoUrl = newPhotoUrl;
      }
      return true;
    } catch (e) {
      throw e;
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
    
    // 全体を保存（通信）
    await this.saveRecord(record);
    return record;
  }

  async deleteRecord(id) {
    if (this.gasUrl) {
      try {
        await fetch(this.gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "delete", id: id })
        });
      } catch (err) {
        console.warn("Delete request to GAS failed", err);
      }
    }

    this.records = this.records.filter(r => r.id !== id);
    return true;
  }

  async toggleLike(id) {
    const rec = this.records.find(r => r.id === id);
    if (rec) {
      const currentUser = this.getCurrentUser() || "先生";
      if (!Array.isArray(rec.likes)) rec.likes = [];
      const index = rec.likes.indexOf(currentUser);
      if (index >= 0) {
        rec.likes.splice(index, 1); // remove like
      } else {
        rec.likes.push(currentUser); // add like
      }
      
      // Update memory cache
      await this.saveRecord(rec);
      return rec;
    }
    return null;
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
      version: "5.0_cloud_only",
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
        const aspect = (typeof TEN_ASPECTS !== 'undefined') ? TEN_ASPECTS.find(a => a.id === id) : null;
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

  // --- GASを使用したクラウド設定同期 (学年・学級) ---
  async saveSystemHierarchy(hierarchy) {
    const systemRecord = {
      id: "system_hierarchy_config",
      authorName: "SYSTEM",
      date: "2099-12-31",
      className: "_SYSTEM_",
      photoUrl: "",
      driveUrl: "",
      comment: JSON.stringify(hierarchy),
      aspects: [],
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };
    return await this.sendToGas(systemRecord);
  }
}

window.storageService = new StorageService();
