const CONTENT_URL = "./data/content.json";

const el = {
  siteTitle: document.getElementById("siteTitle"),
  siteTitle2: document.getElementById("siteTitle2"),
  siteSubtitle: document.getElementById("siteSubtitle"),
  updated: document.getElementById("updated"),
  year: document.getElementById("year"),
  disclosureText: document.getElementById("disclosureText"),

  tocList: document.getElementById("tocList"),

  guideTitle: document.getElementById("guideTitle"),
  guideBody: document.getElementById("guideBody"),

  rankingTitle: document.getElementById("rankingTitle"),
  rankingNote: document.getElementById("rankingNote"),
  rankList: document.getElementById("rankList"),

  topicsTitle: document.getElementById("topicsTitle"),
  topicsList: document.getElementById("topicsList"),

  linksTitle: document.getElementById("linksTitle"),
  linksList: document.getElementById("linksList"),

  footerNote: document.getElementById("footerNote")
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

// 安全のため：段落と箇条書きのみ（HTMLは通さない）
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
  // サイト内容に合わせた目次
  const items = [
    { id: "toc", label: "目次" },
    { id: "guide", label: "ゲーミングマウスの選び方・違い" },
    { id: "ranking", label: "ゲーミングマウスおすすめランキング" },
    { id: "topics", label: "プロゲーマーがよく使うマウスの傾向" },
    { id: "links", label: "他ジャンルのおすすめサイト" }
  ];
  el.tocList.innerHTML = items.map(x => `<li><a href="#${x.id}">${escapeHtml(x.label)}</a></li>`).join("");
}

function renderRanking(list) {
  el.rankList.innerHTML = "";
  for (const item of list) {
    const rank = Number(item.rank);
    const name = item.name ?? "";
    const summary = item.summary ?? "";
    const img = item.imageUrl ?? "";
    const buyUrl = item.buyUrl ?? "";
    const detailUrl = item.detailUrl ?? "";
    const meta = item.meta ?? "";
    const points = Array.isArray(item.points) ? item.points : [];

    const card = document.createElement("article");
    card.className = "rank";

    card.innerHTML = `
      <div class="rank-head">
        <div class="rank-no">#${escapeHtml(Number.isFinite(rank) ? rank : "")}</div>
        <div>
          <p class="rank-title">${escapeHtml(name)}</p>
          <div class="rank-sub">${escapeHtml(summary)}</div>
        </div>
      </div>

      <div class="rank-body">
        <div class="thumb">
          ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(name)}" loading="lazy">` : "画像URLをここに入れる（テスト）"}
        </div>

        <div class="rank-points">
          <ul class="points">
            ${points.map(p => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>

          <div class="rank-actions">
            <a class="primary" href="${escapeHtml(buyUrl || "#")}" target="_blank" rel="nofollow sponsored noopener">
              購入ページを見る（広告/テスト）
            </a>

            ${detailUrl ? `
              <a href="${escapeHtml(detailUrl)}" target="_blank" rel="noopener">
                詳細解説（テスト）
              </a>
            ` : ""}

            <span class="meta">${escapeHtml(meta)}</span>
          </div>
        </div>
      </div>
    `;

    // URL未設定時の事故防止
    if (!buyUrl) {
      const a = card.querySelector("a.primary");
      a.style.opacity = "0.6";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        alert("buyUrl が未設定です（data/content.json にメモURLを入れてください）");
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
    <li><a href="${escapeHtml(l.url ?? "#")}" target="_blank" rel="noopener">${escapeHtml(l.label ?? "")}</a></li>
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

  // guide
  el.guideTitle.textContent = data.sections?.guideTitle ?? "選び方・違い";
  el.guideBody.innerHTML = renderMarkdownLines(data.sections?.guideBodyMarkdown ?? []);

  // ranking
  el.rankingTitle.textContent = data.sections?.rankingTitle ?? "ランキング";
  el.rankingNote.textContent = data.sections?.rankingNote ?? "";
  renderRanking(Array.isArray(data.ranking) ? data.ranking : []);

  // topics
  renderTopics(data.topics);

  // other sites
  renderLinks(data.otherSites);
}

init().catch(err => {
  console.error(err);
  el.rankList.innerHTML =
    `<div class="card">読み込みエラー：${escapeHtml(err?.message || String(err))}</div>`;
});
