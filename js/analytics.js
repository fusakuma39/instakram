/**
 * 学びの実践ストック＆成長蓄積カリキュラム分析 コントローラー (レベル表記なし・ストック型)
 */
class AnalyticsController {
  constructor(app) {
    this.app = app;
    this.aspectsStockGrid = document.getElementById("aspectsStockGrid");
    this.insightsContent = document.getElementById("insightsContent");
    this.totalStockCount = document.getElementById("totalStockCount");
    this.activeAspectsCount = document.getElementById("activeAspectsCount");

    document.getElementById("btnOpenPrintFromAnalytics")?.addEventListener("click", () => {
      this.app.openPrintSelector();
    });
  }

  async render() {
    if (!this.aspectsStockGrid || !this.insightsContent) return;

    const records = await this.app.getFilteredRecords();
    const totalRecords = records.length;

    // 各領域の実践ストック数と記録リスト
    const aspectStats = {};
    TEN_ASPECTS.forEach(a => {
      aspectStats[a.id] = {
        aspect: a,
        count: 0,
        recentRecords: []
      };
    });

    records.forEach(r => {
      (r.aspects || []).forEach(aspectId => {
        if (aspectStats[aspectId]) {
          aspectStats[aspectId].count++;
          if (aspectStats[aspectId].recentRecords.length < 4) {
            aspectStats[aspectId].recentRecords.push(r);
          }
        }
      });
    });

    const activeCount = Object.values(aspectStats).filter(s => s.count > 0).length;

    if (this.totalStockCount) this.totalStockCount.textContent = `${totalRecords} 件`;
    if (this.activeAspectsCount) this.activeAspectsCount.textContent = `${activeCount} / 10 姿`;

    // 1. 各姿のストックカード描画
    this.aspectsStockGrid.innerHTML = "";

    TEN_ASPECTS.forEach(aspect => {
      const stat = aspectStats[aspect.id];
      const count = stat.count;

      // 積み上げブロック（5個単位のスタックブロック）
      const maxVisualBlocks = 12;
      const filledBlocks = Math.min(count, maxVisualBlocks);
      let blocksHtml = "";
      for (let i = 0; i < maxVisualBlocks; i++) {
        const isFilled = i < filledBlocks;
        blocksHtml += `<span class="stock-block ${isFilled ? 'filled' : 'empty'}" title="${isFilled ? `実践 ${i+1}件目` : ''}"></span>`;
      }
      if (count > maxVisualBlocks) {
        blocksHtml += `<span class="stock-block-plus">+${count - maxVisualBlocks}</span>`;
      }

      // 最近の投稿写真サムネイルプレビュー
      let recentThumbsHtml = "";
      if (stat.recentRecords.length > 0) {
        const thumbs = stat.recentRecords.map(r => `
          <img src="${r.photoUrl}" alt="${r.className}" class="aspect-mini-thumb" title="${r.className} (${r.date}): ${r.comment.slice(0, 30)}..." loading="lazy">
        `).join("");
        recentThumbsHtml = `<div class="aspect-recent-thumbs">${thumbs}</div>`;
      }

      const card = document.createElement("div");
      card.className = `aspect-stock-card ${count > 0 ? 'has-stock' : 'no-stock'}`;

      card.innerHTML = `
        <div class="stock-card-top">
          <div class="stock-title-row">
            <div class="stock-hash-tag">
              <span class="hash-mark">#</span>
              <span class="aspect-title-text">${aspect.title}</span>
            </div>
          </div>
          <div class="stock-count-display">
            <span class="stock-big-num">${count}</span>
            <span class="stock-unit">件の実践蓄積</span>
          </div>
        </div>

        <p class="aspect-desc-text">${aspect.description}</p>

        <!-- Visual Stack Meter -->
        <div class="visual-stack-meter">
          <div class="stack-blocks-row">${blocksHtml}</div>
          <div class="stack-meter-labels">
            <span>実践ストックメーター</span>
            <span class="stack-status-text">${count === 0 ? 'これからの実践' : `累計 ${count} 回の学び合い`}</span>
          </div>
        </div>

        <!-- Recent Photos Preview -->
        ${recentThumbsHtml}

        <div class="stock-card-footer">
          <button class="btn-filter-aspect-records" data-aspect-id="${aspect.id}">
            この姿の実践 (${count}件) を見る <i data-lucide="chevron-right"></i>
          </button>
        </div>
      `;

      card.querySelector(".btn-filter-aspect-records")?.addEventListener("click", () => {
        this.app.filterByAspect(aspect.id);
      });

      this.aspectsStockGrid.appendChild(card);
    });

    // 2. カリキュラムマネジメントへの示唆
    this.generateInsights(aspectStats, totalRecords);

    if (window.lucide) window.lucide.createIcons();
  }

  generateInsights(aspectStats, totalRecords) {
    if (totalRecords === 0) {
      this.insightsContent.innerHTML = `
        <p class="text-muted">投稿が蓄積されると、子どもたちの学びのストック状況や単元展開へのヒントがここに表示されます。</p>
      `;
      return;
    }

    const sorted = Object.values(aspectStats).sort((a, b) => b.count - a.count);
    const topAspect = sorted[0].aspect;
    const topCount = sorted[0].count;
    const secondAspect = sorted[1].aspect;
    const secondCount = sorted[1].count;
    const lowestAspect = sorted[sorted.length - 1].aspect;
    const lowestCount = sorted[sorted.length - 1].count;

    let suggestionHtml = `
      <div class="insights-grid">
        <div class="insight-block highlight-top">
          <div class="insight-badge success"><i data-lucide="trending-up"></i> 最も豊かに蓄積されている学び</div>
          <h4>${topAspect.tag} (${topCount}件) ＆ ${secondAspect.tag} (${secondCount}件)</h4>
          <p>
            子どもたちが夢中になって対話し、試行錯誤する場面が多く蓄積されています。日々の授業や生活・総合での探究活動が定着し、児童の主体的な姿がしっかりと育まれている証左です。
          </p>
        </div>

        <div class="insight-block highlight-next">
          <div class="insight-badge focus"><i data-lucide="compass"></i> これからストックを増やしたい領域</div>
          <h4>${lowestAspect.tag} (${lowestCount}件) の意識的な授業構想</h4>
          <p>
            これからの単元・学級活動で ${lowestAspect.title} を引き出す場面（例: 根拠をもとに話し合うサークルタイム、観察記録の言葉化、学習成果の他学年への発信など）を意識的に取り入れることで、児童の資質・能力がよりバランス良く育まれます。
          </p>
        </div>
      </div>
    `;

    this.insightsContent.innerHTML = suggestionHtml;
  }
}

window.AnalyticsController = AnalyticsController;
