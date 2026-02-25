const SITE_URL = "./data/site.json";
const DATA_URL = "./data/products.json";

const el = {
  siteTitle: document.getElementById("siteTitle"),
  siteTitle2: document.getElementById("siteTitle2"),
  siteDescription: document.getElementById("siteDescription"),
  affiliateDisclosure: document.getElementById("affiliateDisclosure"),
  siteFooterNote: document.getElementById("siteFooterNote"),
  updated: document.getElementById("updated"),
  year: document.getElementById("year"),

  q: document.getElementById("q"),
  category: document.getElementById("category"),
  sort: document.getElementById("sort"),
  grid: document.getElementById("grid"),

  tagAll: document.getElementById("tagAll"),
  tagList: document.getElementById("tagList"),

  summaryText: document.getElementById("summaryText"),
  summaryCats: document.getElementById("summaryCats")
};

let state = {
  items: [],
  activeTag: "ALL"
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function toJaDate(d = new Date()){
  return d.toLocaleDateString("ja-JP", { year:"numeric", month:"long", day:"numeric" });
}

function safeNumber(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeItem(x){
  return {
    id: String(x.id ?? "").trim(),
    name: String(x.name ?? "").trim(),
    category: String(x.category ?? "").trim() || "その他",
    tags: Array.isArray(x.tags) ? x.tags.map(t=>String(t).trim()).filter(Boolean) : [],
    description: String(x.description ?? "").trim(),
    imageUrl: String(x.imageUrl ?? "").trim(),
    buyUrl: String(x.buyUrl ?? "").trim(),
    detailUrl: String(x.detailUrl ?? "").trim(),
    price: safeNumber(x.price),
    popularity: safeNumber(x.popularity),
    publishedAt: String(x.publishedAt ?? "").trim(),
    score: safeNumber(x.score)
  };
}

async function loadJson(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`読み込み失敗: ${url}`);
  return await res.json();
}

function applySiteConfig(cfg){
  const title = cfg.title || "おすすめまとめ";
  const desc = cfg.description || "";
  const accent = cfg.accentColor || "#6aa8ff";

  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", desc);

  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", accent);

  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent2", hexToRgba(accent, 0.18));

  el.siteTitle.textContent = title;
  el.siteTitle2.textContent = title;
  el.siteDescription.textContent = desc;

  if (cfg.affiliateDisclosure) el.affiliateDisclosure.textContent = cfg.affiliateDisclosure;
  if (cfg.footerNote) el.siteFooterNote.textContent = cfg.footerNote;
}

function hexToRgba(hex, a){
  // #rrggbb を想定（不正なら既定色）
  const h = String(hex || "").replace("#","").trim();
  if (h.length !== 6) return `rgba(106,168,255,${a})`;
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  if (![r,g,b].every(Number.isFinite)) return `rgba(106,168,255,${a})`;
  return `rgba(${r},${g},${b},${a})`;
}

function buildCategoryOptions(items){
  const cats = ["すべて", ...Array.from(new Set(items.map(i => i.category))).sort((a,b)=>a.localeCompare(b,"ja"))];
  el.category.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function buildTagChips(items){
  const tags = Array.from(new Set(items.flatMap(i => i.tags))).sort((a,b)=>a.localeCompare(b,"ja"));
  el.tagList.innerHTML = "";
  for (const t of tags){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = `#${t}`;
    b.onclick = () => setActiveTag(t);
    el.tagList.appendChild(b);
  }
}

function setActiveTag(tag){
  state.activeTag = tag ? tag : "ALL";
  // UI反映
  el.tagAll.classList.toggle("active", state.activeTag === "ALL");
  [...el.tagList.querySelectorAll(".chip")].forEach(ch => {
    const t = ch.textContent.replace(/^#/,"");
    ch.classList.toggle("active", state.activeTag === t);
  });
  render();
}

function matchesQuery(item, q){
  if (!q) return true;
  const hay = (item.name + " " + item.description + " " + item.category + " " + item.tags.join(" ")).toLowerCase();
  return hay.includes(q.toLowerCase());
}

function matchesTag(item){
  if (state.activeTag === "ALL") return true;
  return item.tags.includes(state.activeTag);
}

function parseDate(s){
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

function sortItems(list, mode){
  const a = [...list];
  switch(mode){
    case "newest": a.sort((x,y)=>parseDate(y.publishedAt)-parseDate(x.publishedAt)); break;
    case "popular": a.sort((x,y)=>(y.popularity??0)-(x.popularity??0)); break;
    case "priceAsc": a.sort((x,y)=>(x.price??Number.POSITIVE_INFINITY)-(y.price??Number.POSITIVE_INFINITY)); break;
    case "priceDesc": a.sort((x,y)=>(y.price??0)-(x.price??0)); break;
    case "recommended":
    default: a.sort((x,y)=>(y.score??0)-(x.score??0)); break;
  }
  return a;
}

function renderSummary(items){
  const total = items.length;
  const cats = {};
  for (const it of items) cats[it.category] = (cats[it.category] ?? 0) + 1;

  const topCats = Object.entries(cats)
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 3)
    .map(([c,n]) => `${c}（${n}）`)
    .join(" / ");

  el.summaryText.textContent = `${total}件の掲載中。検索・カテゴリ・タグで絞り込めます。`;
  el.summaryCats.textContent = topCats || "（まだカテゴリがありません）";
}

function renderCards(list){
  el.grid.innerHTML = "";
  if (list.length === 0){
    el.grid.innerHTML = `<div class="note muted">該当するアイテムがありません。条件を変えてみてください。</div>`;
    return;
  }

  for (const it of list){
    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (it.imageUrl){
      const img = document.createElement("img");
      img.src = it.imageUrl;
      img.alt = it.name;
      img.loading = "lazy";
      thumb.appendChild(img);
    } else {
      thumb.textContent = "画像なし";
    }

    const content = document.createElement("div");
    content.className = "content";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<span class="tag">${escapeHtml(it.category)}</span>` +
      it.tags.map(t=>`<span class="tag">#${escapeHtml(t)}</span>`).join("");

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = it.name || "(名称未設定)";

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = it.description || "";

    const actions = document.createElement("div");
    actions.className = "actions";

    const buy = document.createElement("a");
    buy.className = "btn";
    buy.textContent = "詳細を見る（広告）";
    buy.target = "_blank";
    buy.rel = "nofollow sponsored noopener";
    buy.href = it.buyUrl || "#";
    if (!it.buyUrl){
      buy.style.opacity = "0.6";
      buy.onclick = (e)=>{ e.preventDefault(); alert("buyUrl が未設定です（data/products.jsonを確認）"); };
    }
    actions.appendChild(buy);

    if (it.detailUrl){
      const d = document.createElement("a");
      d.className = "btn ghost";
      d.textContent = "レビュー/解説";
      d.href = it.detailUrl;
      d.target = "_blank";
      d.rel = "noopener";
      actions.appendChild(d);
    }

    const price = document.createElement("span");
    price.className = "price";
    if (it.price != null) price.textContent = `目安：¥${Math.round(it.price).toLocaleString("ja-JP")}`;
    actions.appendChild(price);

    content.appendChild(meta);
    content.appendChild(name);
    content.appendChild(desc);
    content.appendChild(actions);

    card.appendChild(thumb);
    card.appendChild(content);
    el.grid.appendChild(card);
  }
}

function render(){
  const q = el.q.value.trim();
  const cat = el.category.value || "すべて";
  const mode = el.sort.value || "recommended";

  let list = state.items
    .filter(it => matchesQuery(it, q))
    .filter(it => (cat === "すべて" || it.category === cat))
    .filter(matchesTag);

  list = sortItems(list, mode);
  renderCards(list);
}

async function init(){
  el.year.textContent = String(new Date().getFullYear());
  el.updated.textContent = toJaDate(new Date());

  const site = await loadJson(SITE_URL);
  applySiteConfig(site);

  const data = await loadJson(DATA_URL);
  const items = Array.isArray(data.items) ? data.items : [];
  state.items = items.map(normalizeItem).filter(x => x.id && x.name);

  buildCategoryOptions(state.items);
  buildTagChips(state.items);
  renderSummary(state.items);

  el.tagAll.onclick = () => setActiveTag(null);

  el.q.addEventListener("input", render);
  el.category.addEventListener("change", render);
  el.sort.addEventListener("change", render);

  render();
}

init().catch(err => {
  console.error(err);
  el.grid.innerHTML = `<div class="note">読み込みエラー：${escapeHtml(err?.message || String(err))}</div>`;
});
