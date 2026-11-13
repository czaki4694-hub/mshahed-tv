
const channels = [
 {id:1,name:"Al Aoula",country:"المغرب",category:"general",logo:"الأولى",style:"orange",desc:"قناة عامة"},
 {id:2,name:"Laayoune",country:"المغرب",category:"general",logo:"العيون",style:"orange",desc:"قناة جهوية"},
 {id:3,name:"Arryadia TV",country:"المغرب",category:"sports",logo:"الرياضية",style:"blue",desc:"رياضة"},
 {id:4,name:"Athaqafia TV",country:"المغرب",category:"culture",logo:"الثقافية",style:"purple",desc:"ثقافة"},
 {id:5,name:"Al Maghribia",country:"المغرب",category:"general",logo:"المغربية",style:"gray",desc:"قناة عامة"},
 {id:6,name:"Assadissa",country:"المغرب",category:"culture",logo:"السادسة",style:"green",desc:"دينية وثقافية"},
 {id:7,name:"Tamazight TV",country:"المغرب",category:"culture",logo:"تمازيغت",style:"sand",desc:"أمازيغية"},
 {id:8,name:"2M",country:"المغرب",category:"general",logo:"2M",style:"black",desc:"قناة عامة"},
 {id:9,name:"Télé Maroc",country:"المغرب",category:"general",logo:"télé",style:"red",desc:"قناة عامة"},
 {id:10,name:"Medi 1 TV Maghreb",country:"المغرب",category:"general",logo:"M1",style:"black",desc:"أخبار"},
 {id:11,name:"Medi 1 TV Arabic",country:"المغرب",category:"general",logo:"M1",style:"black",desc:"أخبار"},
 {id:12,name:"Medi 1 TV Afrique",country:"المغرب",category:"general",logo:"M1",style:"black",desc:"أخبار"},
 {id:13,name:"France 24 عربي",country:"المغرب",category:"general",logo:"France 24",style:"blue",desc:"أخبار",stream:"https://www.france24.com/ar/live"}
];

let selectedView = "all";
let selectedFilter = "all";
let hlsPlayer = null;

let favorites = JSON.parse(localStorage.getItem("mch-favorites") || "[]");

const grid = document.getElementById("channelGrid");
const empty = document.getElementById("emptyState");
const search = document.getElementById("search");
const count = document.getElementById("count");

const titles = {
 all:"كل القنوات",
 favorites:"قنواتك المفضلة",
 recent:"القنوات المضافة حديثاً"
};

// إخفاء قسم الدول
document.querySelectorAll("[data-country]").forEach(button => {
 const section = button.closest("section");
 if (section) section.hidden = true;
 else button.hidden = true;
});

// إخفاء العناصر المعروفة الخاصة بقائمة الدول
[
 "#countriesSection",
 "#countrySection",
 ".countries-section",
 ".country-section",
 ".countries-grid"
].forEach(selector => {
 document.querySelectorAll(selector).forEach(el => el.hidden = true);
});

// ملء الشاشة
const videoPlayer = document.getElementById("videoPlayer");
const fullscreenBtn = document.createElement("button");

fullscreenBtn.id = "fullscreenBtn";
fullscreenBtn.textContent = "⛶ ملء الشاشة";
fullscreenBtn.style.cssText =
 "display:none;width:100%;padding:12px;margin-top:10px;border:0;border-radius:8px;background:#2563eb;color:white;font-size:16px;";

videoPlayer.insertAdjacentElement("afterend", fullscreenBtn);

fullscreenBtn.addEventListener("click", async () => {
 try {
  if (document.fullscreenElement) {
   await document.exitFullscreen();
  } else if (videoPlayer.requestFullscreen) {
   await videoPlayer.requestFullscreen();
  } else if (videoPlayer.webkitEnterFullscreen) {
   videoPlayer.webkitEnterFullscreen();
  }
 } catch (error) {
  console.error("خطأ ملء الشاشة:", error);
 }
});

function render() {
 const q = search.value.trim().toLowerCase();
 let list = [...channels];

 if (selectedView === "favorites")
  list = list.filter(c => favorites.includes(c.id));

 if (selectedView === "recent")
  list = list.slice(-4).reverse();

 if (selectedFilter !== "all")
  list = list.filter(c => c.category === selectedFilter);

 if (q)
  list = list.filter(c =>
   (c.name + " " + c.logo + " " + c.desc).toLowerCase().includes(q)
  );

 count.textContent = list.length;

 document.getElementById("sectionTitle").childNodes[0].textContent =
  titles[selectedView] || "كل القنوات";

 const crumb = document.getElementById("crumb");
 if (crumb) crumb.textContent = "كل القنوات";

 grid.innerHTML = "";

 list.forEach(c => {
  const card = document.createElement("article");
  card.className = "channel-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "فتح " + c.name);

  card.innerHTML = `
   <span class="channel-badge">${c.desc}</span>
   <button class="fav-btn ${favorites.includes(c.id) ? "selected" : ""}" aria-label="إضافة للمفضلة">
   ${favorites.includes(c.id) ? "♥" : "♡"}</button>
   <div class="channel-logo">
    <div class="logo-shape ${c.style}">${c.logo}</div>
   </div>
   <div class="channel-name">${c.name}</div>
   <div class="channel-meta">${c.country} · ${c.desc}</div>
  `;

  card.querySelector(".fav-btn").addEventListener("click", e => {
   e.stopPropagation();
   toggleFavorite(c.id);
  });

  card.addEventListener("click", () => openPlayer(c));

  card.addEventListener("keydown", e => {
   if (e.key === "Enter") openPlayer(c);
  });

  grid.appendChild(card);
 });

 empty.hidden = list.length !== 0;
 grid.hidden = list.length === 0;
}

function toggleFavorite(id) {
 favorites = favorites.includes(id)
  ? favorites.filter(x => x !== id)
  : [...favorites, id];

 localStorage.setItem("mch-favorites", JSON.stringify(favorites));
 render();

 toast(favorites.includes(id) ? "أضيفت إلى المفضلة" : "حذفت من المفضلة");
}

// تشغيل القناة
function openPlayer(c) {
 document.getElementById("playerTitle").textContent = c.name;

 const modal = document.getElementById("playerModal");
 const video = document.getElementById("videoPlayer");
 const placeholder = document.getElementById("videoPlaceholder");

 stopPlayer();

 placeholder.style.display = "flex";
 fullscreenBtn.style.display = "none";

 modal.classList.add("open");
 modal.setAttribute("aria-hidden", "false");

 if (!c.stream) {
  placeholder.querySelector("p").textContent = "لا يوجد رابط بث لهذه القناة حالياً.";
  return;
 }

 placeholder.querySelector("p").textContent = "جارٍ تحميل البث...";
 placeholder.style.display = "flex";

 video.style.display = "block";
 fullscreenBtn.style.display = "block";

 const url = c.stream.trim();

 if (url.includes(".m3u8")) {
  if (window.Hls && Hls.isSupported()) {
   hlsPlayer = new Hls();
   hlsPlayer.loadSource(url);
   hlsPlayer.attachMedia(video);

   hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
    placeholder.style.display = "none";
    video.play().catch(() => {});
   });

   hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
     placeholder.style.display = "flex";
     placeholder.querySelector("p").textContent =
      "تعذر تشغيل البث. تحقق من الرابط أو صلاحيات خادم البث.";
     console.error("HLS error:", data);
    }
   });

  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
   video.src = url;

   video.addEventListener("loadedmetadata", () => {
    placeholder.style.display = "none";
    video.play().catch(() => {});
   }, { once: true });

   video.addEventListener("error", () => {
    placeholder.style.display = "flex";
    placeholder.querySelector("p").textContent = "تعذر تشغيل رابط البث.";
   }, { once: true });

  } else {
   placeholder.querySelector("p").textContent =
    "متصفحك لا يدعم تشغيل هذا النوع من البث.";
  }

 } else {
  video.src = url;

  video.addEventListener("loadedmetadata", () => {
   placeholder.style.display = "none";
   video.play().catch(() => {});
  }, { once: true });

  video.addEventListener("error", () => {
   placeholder.style.display = "flex";
   placeholder.querySelector("p").textContent =
    "تعذر تشغيل الفيديو. تأكد أن الرابط مباشر وصحيح.";
  }, { once: true });
 }
}

function stopPlayer() {
 const video = document.getElementById("videoPlayer");

 video.pause();

 if (hlsPlayer) {
  hlsPlayer.destroy();
  hlsPlayer = null;
 }

 video.removeAttribute("src");
 video.load();
}

function closePlayer() {
 const modal = document.getElementById("playerModal");

 stopPlayer();

 document.getElementById("videoPlaceholder").style.display = "flex";
 fullscreenBtn.style.display = "none";

 modal.classList.remove("open");
 modal.setAttribute("aria-hidden", "true");
}

document.getElementById("closePlayer").addEventListener("click", closePlayer);

document.getElementById("playerModal").addEventListener("click", e => {
 if (e.target.id === "playerModal") closePlayer();
});

document.addEventListener("keydown", e => {
 if (e.key === "Escape") closePlayer();
});

// القائمة الرئيسية
document.querySelectorAll("[data-view]").forEach(b => {
 b.addEventListener("click", () => {
  selectedView = b.dataset.view;

  document.querySelectorAll("[data-view]").forEach(x =>
   x.classList.toggle("active", x === b)
  );

  render();
 });
});

// فلاتر القنوات
document.querySelectorAll("[data-filter]").forEach(b => {
 b.addEventListener("click", () => {
  selectedFilter = b.dataset.filter;

  document.querySelectorAll("[data-filter]").forEach(x =>
   x.classList.toggle("active", x === b)
  );

  render();
 });
});

search.addEventListener("input", render);

document.getElementById("browseBtn").addEventListener("click", () => {
 document.getElementById("channelsSection").scrollIntoView({
  behavior: "smooth"
 });
});

let toastTimer;

function toast(msg) {
 const el = document.getElementById("toast");
 el.textContent = msg;
 el.classList.add("show");

 clearTimeout(toastTimer);
 toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

// Supabase
const SUPABASE_URL = "https://irkjsubiecrbhladkdko.supabase.co";
const SUPABASE_KEY = "sb_publishable_-wc1SLRAQm_pZLzLExy-Aw_j0kxFdjc";

async function loadPublishedChannels() {
 try {
  const response = await fetch(
   `${SUPABASE_URL}/rest/v1/channels?select=id,name,logo_url,stream_url,category,is_published,country_id&is_published=eq.true`,
   {
    headers: {
     apikey: SUPABASE_KEY,
     Authorization: `Bearer ${SUPABASE_KEY}`
    }
   }
  );

  if (!response.ok) throw new Error(await response.text());

  const rows = await response.json();

  rows.forEach(row => {
   const name = (row.name || "").trim().toLowerCase();

   // منع تكرار القناة إذا كانت موجودة مسبقاً
   const existing = channels.find(c =>
    c.name.trim().toLowerCase() === name
   );

   if (existing) {
    if (row.stream_url) existing.stream = row.stream_url;
    if (row.logo_url) existing.logo = row.logo_url;
    return;
   }

   const categoryText = (row.category || "").toLowerCase();

   let category = "general";
   if (categoryText.includes("رياض") || categoryText.includes("sport"))
    category = "sports";
   else if (categoryText.includes("ثقاف") || categoryText.includes("culture"))
    category = "culture";

   channels.push({
    id: "db-" + row.id,
    name: row.name,
    country: "المغرب",
    category,
    logo: row.logo_url || row.name,
    style: "blue",
    desc: row.category || "قناة عامة",
    stream: row.stream_url
   });
  });

  render();

 } catch (error) {
  console.error("خطأ تحميل القنوات:", error);
 }
}

render();
loadPublishedChannels();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
 navigator.serviceWorker.register("./sw.js").catch(() => {});
}
