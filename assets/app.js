const CONTENT_URL = "./data/content.json";

const el = {
  siteTitle: document.getElementById("siteTitle"),
  siteTitle2: document.getElementById("siteTitle2"),
  siteSubtitle: document.getElementById("siteSubtitle"),
  updated: document.getElementById("updated"),
  year: document.getElementById("year"),
  disclosureText: document.getElementById("disclosureText"),

  heroTitle: document.getElementById("heroTitle"),
  heroLead: document.getElementById("heroLead"),
  updateNote: document.getElementById("updateNote"),

  tocList: document.getElementById("tocList"),

  pickCards: document.getElementById("pickCards"),
  compareTable: document.getElementById("compareTable"),

  guideTitle: document.getElementById("guideTitle"),
  guideBody: document.getElementById("guideBody"),

  rankingTitle: document.getElementById("rankingTitle"),
  rankingNote: document.getElementById("rankingNote"),
  rankList: document.getElementById("rankList"),

  topicsTitle: document.getElementById("topicsTitle"),
  topicsList: document.getElementById("topicsList"),

  linksTitle: document.getElementById("linksTitle"),
  linksList: document.getElementById("linksList"),

  footerNote: document.getElementById("footerNote"),
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

// 段落/箇条書きのみ
function renderMarkdownLines(lines) {
  const arr = Array.isArray(lines) ? lines : [String(lines ?? "")];
  const blocks = [];
  let ul = [];

  const flushUl = () => {
    if (ul.length) {
      blocks.push("<ul>" + ul.map(x => `<li>${escapeHtml(x)}</li>`).join("") + "</ul>");
      ul = [];
    }
  };

  for (const line of arr) {
    const s = String(line ?? "");
    if (s.trim().startsWith("- ")) {
      ul.push(s.trim().slice(2));
      continue;
    }
    if (s.trim() === "") {
      flushUl();
      continue;
    }
    flushUl();
    blocks.push(`<p>${escapeHtml(s)}</p>`);
  }
  flushUl();
  return blocks.join("");
}

function toJaDate(d = new Date()) {
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function buildTOC() {
  const items = [
    { id: "toc", label: "目次" },
    { id: "quickpicks", label: "Top Picks（結論）" },
    { id: "compare", label: "比較表（ざっくり）" },
    { id: "guide", label: "選び方・違い" },
    { id: "ranking", label: "ランキング（詳細）" },
    { id: "topics", label: "よくある疑問・話題" },
    { id: "links", label: "他ジャンルのおすすめ" }
  ];
  el.tocList.innerHTML = items.map(x => `<li><a href="#${x.id}">${escapeHtml(x.label)}</a></li>`).join("");
}

function safeHref(url) {
  const u = String(url ?? "").trim();
  return u ? u : "#";
}

function renderPickCards(ranking) {
  el.pickCards.innerHTML = ranking.map(item => `
    <article class="pick">
      <div class="pick-top">
        <span class="pill">#${escapeHtml(item.rank)}</span>
        <a class="pill" href="#rank-${escapeHtml(item.rank)}" style="text-decoration:none">詳細へ</a>
      </div>
      <div class="pick-name">${escapeHtml(item.shortName || item.name || "")}</div>
      <div class="pick-desc">${escapeHtml(item.summary || "")}</div>
      <div class="pick-actions">
        <a href="${escapeHtml(safeHref(item.buyUrl))}" target="_blank" rel="nofollow sponsored noopener">購入リンク（テスト）</a>
        <span class="muted small">${escapeHtml(item.meta || "")}</span>
      </div>
    </article>
  `).join("");
}

function renderCompareTable(ranking) {
  // “違い”が分かるように、超簡易の軸だけ並べる
  const rows = ranking.map(item => `
    <tr>
      <td><b>#${escapeHtml(item.rank)}</b> ${escapeHtml(item.shortName || item.name || "")}</td>
      <td>${escapeHtml(item.compare?.shape || "（ここに形状のメモ）")}</td>
      <td>${escapeHtml(item.compare?.weight || "（ここに重量のメモ）")}</td>
      <td>${escapeHtml(item.compare?.price || "（ここに価格帯のメモ）")}</td>
      <td>${escapeHtml(item.compare?.forWho || "（どんな人向けか）")}</td>
    </tr>
  `).join("");

  el.compareTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>製品</th>
          <th>形状</th>
          <th>重さ</th>
          <th>価格帯</th>
          <th>向いている人</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderRanking(list) {
  el.rankList.innerHTML = "";
  for (const item of list) {
    const rank = Number(item.rank);
    const id = `rank-${Number.isFinite(rank) ? rank : String(item.rank)}`;

    const card = document.createElement("article");
    card.className = "rank";
    card.id = id;

    const img = item.imageUrl ?? "";
    const buyUrl = String(item.buyUrl ?? "").trim();
    const detailUrl = String(item.detailUrl ?? "").trim();

    const points = Array.isArray(item.points) ? item.points : [];
    const pros = Array.isArray(item.pros) ? item.pros : [];
    const cons = Array.isArray(item.cons) ? item.cons : [];

    const specs = item.specs ?? {};
    const specRows = [
      ["重量", specs.weight || "ここに重量（テスト）"],
      ["形状", specs.shape || "ここに形状（テスト）"],
      ["接続", specs.connection || "ここに接続（テスト）"],
      ["センサー/遅延", specs.sensor || "ここにセンサー（テスト）"],
      ["対象", specs.forWho || "ここに対象（テスト）"],
    ].map(([k,v]) => `
      <div class="row">
        <span class="k">${escapeHtml(k)}</span>
        <span class="v">${escapeHtml(v)}</span>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="rank-head">
        <div class="rank-no">#${escapeHtml(rank)}</div>
        <div>
          <p class="rank-title">${escapeHtml(item.name || "")}</p>
          <div class="rank-sub">${escapeHtml(item.summary || "")}</div>
        </div>
      </div>

      <div class="rank-body">
        <div class="thumb">
          ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}" loading="lazy">`
               : "画像URLをここに（テスト）"}
        </div>

        <div class="rank-right">
          <ul class="bullets">
            ${points.map(p => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>

          <div class="two-col">
            <div class="box">
              <div class="box-title">What we like（良い点）</div>
              <ul class="bullets pros">${pros.map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
            </div>
            <div class="box">
              <div class="box-title">What we don’t like（注意点）</div>
              <ul class="bullets cons">${cons.map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
            </div>
          </div>

          <div class="specs">
            ${specRows}
          </div>

          <div class="rank-actions">
            <a class="primary" href="${escapeHtml(safeHref(buyUrl))}" target="_blank" rel="nofollow sponsored noopener">
              購入ページを見る（広告/テスト）
            </a>

            ${detailUrl ? `
              <a href="${escapeHtml(detailUrl)}" target="_blank" rel="noopener">詳細解説（テスト）</a>
            ` : ""}

            <span class="meta">${escapeHtml(item.meta || "")}</span>
          </div>
        </div>
      </div>
    `;

    // buyUrlがメモ（httpsで始まらない）でも、とりあえず遷移はさせず事故防止
    if (!buyUrl || !/^https?:\/\//i.test(buyUrl)) {
      const a = card.querySelector("a.primary");
      a.style.opacity = "0.65";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        alert("buyUrl はテスト用メモです。実運用では https:// のリンクを入れてください。");
      });
    }

    el.rankList.appendChild(card);
  }
}

function renderTopics(topics) {
  el.topicsTitle.textContent = topics?.title ?? "話題";
  const items = Array.isArray(topics?.items) ? topics.items : [];

  el.topicsList.innerHTML = items.map(t => `
    <article class="topic">
      <h3>${escapeHtml(t.title ?? "")}</h3>
      <div class="body prose">${renderMarkdownLines(t.bodyMarkdown ?? [])}</div>
    </article>
  `).join("");
}

function renderLinks(otherSites) {
  el.linksTitle.textContent = otherSites?.title ?? "他サイト";
  const links = Array.isArray(otherSites?.links) ? otherSites.links : [];
  el.linksList.innerHTML = links.map(l => `
    <li><a href="${escapeHtml(safeHref(l.url))}" target="_blank" rel="noopener">${escapeHtml(l.label ?? "")}</a></li>
  `).join("");
}

async function init() {
  buildTOC();

  el.year.textContent = String(new Date().getFullYear());
  el.updated.textContent = toJaDate();

  const res = await fetch(CONTENT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("content.json の読み込みに失敗しました");
  const data = await res.json();

  // site
  const site = data.site ?? {};
  const title = site.title ?? "おすすめランキング";
  document.title = title;
  el.siteTitle.textContent = title;
  el.siteTitle2.textContent = title;
  el.siteSubtitle.textContent = site.subtitle ?? "";
  el.disclosureText.textContent = site.disclosure ?? "本ページにはアフィリエイト広告が含まれています。";
  el.footerNote.textContent = site.footerNote ?? "";
  if (el.heroTitle) el.heroTitle.textContent = site.heroTitle ?? title;
  if (el.heroLead) el.heroLead.textContent = site.heroLead ?? "";
  if (el.updateNote) el.updateNote.textContent = site.updateNote ?? "";

  // guide
  el.guideTitle.textContent = data.sections?.guideTitle ?? "選び方・違い";
  el.guideBody.innerHTML = renderMarkdownLines(data.sections?.guideBodyMarkdown ?? []);

  // ranking
  el.rankingTitle.textContent = data.sections?.rankingTitle ?? "ランキング";
  el.rankingNote.textContent = data.sections?.rankingNote ?? "";
  const ranking = Array.isArray(data.ranking) ? data.ranking : [];

  // new blocks
  renderPickCards(ranking);
  renderCompareTable(ranking);
  renderRanking(ranking);

  // topics & links
  renderTopics(data.topics);
  renderLinks(data.otherSites);
}

init().catch(err => {
  console.error(err);
  el.rankList.innerHTML =
    `<div class="card">読み込みエラー：${escapeHtml(err?.message || String(err))}</div>`;
});
