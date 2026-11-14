
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

let favorites = [];

try {
 favorites = JSON.parse(localStorage.getItem("mch-favorites") || "[]");
 if (!Array.isArray(favorites)) favorites = [];
} catch (e) {
 favorites = [];
}

const grid = document.getElementById("channelGrid");
const empty = document.getElementById("emptyState");
const search = document.getElementById("search");
const count = document.getElementById("count");

const videoPlayer = document.getElementById("videoPlayer");
const modal = document.getElementById("playerModal");
const placeholder = document.getElementById("videoPlaceholder");

const titles = {
 all: "كل القنوات",
 favorites: "قنواتك المفضلة",
 recent: "القنوات المضافة حديثاً"
};

// التأكد من وجود عناصر الصفحة
if (!grid || !empty || !search || !count ||
    !videoPlayer || !modal || !placeholder) {
 console.error("بعض عناصر واجهة التطبيق غير موجودة.");
}

// إخفاء قسم الدول
document.querySelectorAll("[data-country]").forEach(button => {
 const section = button.closest("section");
 if (section) section.hidden = true;
 else button.hidden = true;
});

[
 "#countriesSection",
 "#countrySection",
 ".countries-section",
 ".country-section",
 ".countries-grid"
].forEach(selector => {
 document.querySelectorAll(selector).forEach(el => {
  el.hidden = true;
 });
});

// زر ملء الشاشة
const fullscreenBtn = document.createElement("button");

fullscreenBtn.id = "fullscreenBtn";
fullscreenBtn.textContent = "⛶ ملء الشاشة";
fullscreenBtn.style.cssText =
 "display:none;width:100%;padding:12px;margin-top:10px;border:0;border-radius:8px;background:#2563eb;color:white;font-size:16px;";

if (videoPlayer) {
 videoPlayer.insertAdjacentElement("afterend", fullscreenBtn);
}

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

// تحديث عنوان القسم
function updateSectionTitle() {
 const title = document.getElementById("sectionTitle");
 if (!title) return;

 const first = title.firstChild;

 if (first && first.nodeType === Node.TEXT_NODE) {
  first.nodeValue = titles[selectedView] || titles.all;
 } else {
  title.textContent = titles[selectedView] || titles.all;
 }
}

// عرض القنوات
function render() {
 if (!grid || !search || !count || !empty) return;

 const q = search.value.trim().toLowerCase();

 let list = [...channels];

 if (selectedView === "favorites") {
  list = list.filter(c => favorites.includes(c.id));
 }

 if (selectedView === "recent") {
  list = list.slice(-4).reverse();
 }

 if (selectedFilter !== "all") {
  list = list.filter(c => c.category === selectedFilter);
 }

 if (q) {
  list = list.filter(c =>
   (c.name + " " + c.logo + " " + c.desc)
    .toLowerCase().includes(q)
  );
 }

 count.textContent = list.length;

 updateSectionTitle();

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
   <span class="channel-badge"></span>
   <button class="fav-btn" aria-label="إضافة للمفضلة"></button>
   <div class="channel-logo">
    <div class="logo-shape"></div>
   </div>
   <div class="channel-name"></div>
   <div class="channel-meta"></div>
  `;

  card.querySelector(".channel-badge").textContent = c.desc || "";
  card.querySelector(".channel-name").textContent = c.name;
  card.querySelector(".channel-meta").textContent =
   (c.country || "المغرب") + " · " + (c.desc || "");

  const logo = card.querySelector(".logo-shape");
  logo.className = "logo-shape " + (c.style || "blue");
  logo.textContent = c.logo || c.name;

  const favButton = card.querySelector(".fav-btn");
  const isFavorite = favorites.includes(c.id);

  favButton.classList.toggle("selected", isFavorite);
  favButton.textContent = isFavorite ? "♥" : "♡";

  favButton.addEventListener("click", e => {
   e.stopPropagation();
   toggleFavorite(c.id);
  });

  card.addEventListener("click", () => openPlayer(c));

  card.addEventListener("keydown", e => {
   if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openPlayer(c);
   }
  });

  grid.appendChild(card);
 });

 empty.hidden = list.length !== 0;
 grid.hidden = list.length === 0;
}

// المفضلة
function toggleFavorite(id) {
 favorites = favorites.includes(id)
  ? favorites.filter(x => x !== id)
  : [...favorites, id];

 try {
  localStorage.setItem("mch-favorites", JSON.stringify(favorites));
 } catch (e) {
  console.error("تعذر حفظ المفضلة:", e);
 }

 render();

 toast(favorites.includes(id)
  ? "أضيفت إلى المفضلة"
  : "حذفت من المفضلة");
}

// فتح المشغل
function openPlayer(c) {
 document.getElementById("playerTitle").textContent = c.name;

 stopPlayer();

 placeholder.style.display = "flex";
 placeholder.querySelector("p").textContent =
  "جارٍ تحميل البث...";

 fullscreenBtn.style.display = "none";

 modal.classList.add("open");
 modal.setAttribute("aria-hidden", "false");

 if (!c.stream) {
  placeholder.querySelector("p").textContent =
   "لا يوجد رابط بث لهذه القناة حالياً.";
  return;
 }

 const url = c.stream.trim();

 if (!/^https?:\/\//i.test(url)) {
  placeholder.querySelector("p").textContent =
   "رابط البث غير صالح.";
  return;
 }

 videoPlayer.style.display = "block";
 fullscreenBtn.style.display = "block";

 videoPlayer.controls = true;
 videoPlayer.playsInline = true;

 // تشغيل بث HLS
 if (url.toLowerCase().includes(".m3u8")) {

  if (window.Hls && Hls.isSupported()) {
   hlsPlayer = new Hls({
    enableWorker: true,
    maxBufferLength: 30
   });

   hlsPlayer.loadSource(url);
   hlsPlayer.attachMedia(videoPlayer);

   hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
    placeholder.style.display = "none";
    videoPlayer.play().catch(() => {});
   });

   hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
     console.error("HLS error:", data);

     placeholder.style.display = "flex";
     placeholder.querySelector("p").textContent =
      "تعذر تشغيل البث. تحقق من رابط القناة أو خادم البث.";

     stopPlayer();
    }
   });

  } else if (
   videoPlayer.canPlayType("application/vnd.apple.mpegurl")
  ) {
   videoPlayer.src = url;

   videoPlayer.addEventListener("loadedmetadata", () => {
    placeholder.style.display = "none";
    videoPlayer.play().catch(() => {});
   }, { once: true });

   videoPlayer.addEventListener("error", () => {
    placeholder.style.display = "flex";
    placeholder.querySelector("p").textContent =
     "تعذر تشغيل رابط البث.";
   }, { once: true });

  } else {
   placeholder.querySelector("p").textContent =
    "متصفحك لا يدعم تشغيل بث HLS.";
  }

 } else {
  // تشغيل رابط فيديو مباشر
  videoPlayer.src = url;

  videoPlayer.addEventListener("loadedmetadata", () => {
   placeholder.style.display = "none";
   videoPlayer.play().catch(() => {});
  }, { once: true });

  videoPlayer.addEventListener("error", () => {
   placeholder.style.display = "flex";
   placeholder.querySelector("p").textContent =
    "تعذر تشغيل الفيديو. تأكد أن الرابط مباشر وصحيح.";
  }, { once: true });
 }
}

// إيقاف المشغل
function stopPlayer() {
 if (!videoPlayer) return;

 videoPlayer.pause();

 if (hlsPlayer) {
  hlsPlayer.destroy();
  hlsPlayer = null;
 }

 videoPlayer.removeAttribute("src");
 videoPlayer.load();
 videoPlayer.style.display = "none";
}

// إغلاق المشغل
function closePlayer() {
 stopPlayer();

 placeholder.style.display = "flex";
 fullscreenBtn.style.display = "none";

 modal.classList.remove("open");
 modal.setAttribute("aria-hidden", "true");
}

document.getElementById("closePlayer")
 .addEventListener("click", closePlayer);

modal.addEventListener("click", e => {
 if (e.target === modal) closePlayer();
});

document.addEventListener("keydown", e => {
 if (e.key === "Escape" && modal.classList.contains("open")) {
  closePlayer();
 }
});

// القائمة الرئيسية
document.querySelectorAll("[data-view]").forEach(button => {
 button.addEventListener("click", () => {
  selectedView = button.dataset.view;

  document.querySelectorAll("[data-view]").forEach(item => {
   item.classList.toggle("active", item === button);
  });

  render();
 });
});

// فلاتر القنوات
document.querySelectorAll("[data-filter]").forEach(button => {
 button.addEventListener("click", () => {
  selectedFilter = button.dataset.filter;

  document.querySelectorAll("[data-filter]").forEach(item => {
   item.classList.toggle("active", item === button);
  });

  render();
 });
});

search.addEventListener("input", render);

// زر تصفح القنوات
document.getElementById("browseBtn")
 .addEventListener("click", () => {
  document.getElementById("channelsSection")
   .scrollIntoView({ behavior: "smooth" });
 });

// رسائل التنبيه
let toastTimer;

function toast(msg) {
 const el = document.getElementById("toast");
 if (!el) return;

 el.textContent = msg;
 el.classList.add("show");

 clearTimeout(toastTimer);

 toastTimer = setTimeout(() => {
  el.classList.remove("show");
 }, 1800);
}

// ===================================
// Supabase
// ===================================

const SUPABASE_URL =
 "https://irkjsubiecrbhladkdko.supabase.co";

const SUPABASE_KEY =
 "sb_publishable_-wc1SLRAQm_pZLzLExy-Aw_j0kxFdjc";

// تحويل تصنيف القناة
function getCategory(value) {
 const text = String(value || "").toLowerCase();

 if (
  text.includes("رياض") ||
  text.includes("sport")
 ) return "sports";

 if (
  text.includes("ثقاف") ||
  text.includes("culture")
 ) return "culture";

 return "general";
}

// تحميل القنوات المنشورة
async function loadPublishedChannels() {
 try {
  const response = await fetch(
   `${SUPABASE_URL}/rest/v1/channels?select=id,name,logo_url,stream_url,category,is_published&is_published=eq.true&order=created_at.desc`,
   {
    method: "GET",
    headers: {
     apikey: SUPABASE_KEY,
     Authorization: `Bearer ${SUPABASE_KEY}`,
     Accept: "application/json"
    },
    cache: "no-store"
   }
  );

  if (!response.ok) {
   const errorText = await response.text();
   throw new Error(
    "Supabase HTTP " + response.status + ": " + errorText
   );
  }

  const rows = await response.json();

  if (!Array.isArray(rows)) {
   throw new Error("استجابة قاعدة البيانات غير صحيحة.");
  }

  rows.forEach(row => {
   const name = String(row.name || "").trim();

   if (!name) return;

   // منع التكرار بالاسم
   const existing = channels.find(c =>
    c.name.trim().toLowerCase() === name.toLowerCase()
   );

   if (existing) {
    if (row.stream_url) {
     existing.stream = row.stream_url;
    }

    if (row.logo_url) {
     existing.logo = row.logo_url;
    }

    if (row.category) {
     existing.category = getCategory(row.category);
     existing.desc = row.category;
    }

    return;
   }

   // إضافة قناة جديدة من قاعدة البيانات
   channels.push({
    id: "db-" + row.id,
    name: name,
    country: "المغرب",
    category: getCategory(row.category),
    logo: row.logo_url || name,
    style: "blue",
    desc: row.category || "قناة عامة",
    stream: row.stream_url || ""
   });
  });

  render();

  console.log(
   "تم تحميل القنوات المنشورة بنجاح:",
   rows.length
  );

 } catch (error) {
  console.error("خطأ تحميل القنوات:", error);
  toast("تعذر تحميل القنوات من قاعدة البيانات");
 }
}

// تشغيل التطبيق
render();
loadPublishedChannels();

// إلغاء تسجيل Service Worker القديم
if ("serviceWorker" in navigator) {
 navigator.serviceWorker.getRegistrations()
  .then(registrations => {
   registrations.forEach(registration => {
    registration.unregister();
   });
  })
  .catch(error => {
   console.error("Service Worker:", error);
  });
}
