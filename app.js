
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
 {id:12,name:"Medi 1 TV Afrique",country:"المغرب",category:"general",logo:"M1",style:"black",desc:"أخبار"}
];

let selectedCountry = "المغرب";
let selectedView = "all";
let selectedFilter = "all";

let favorites = JSON.parse(localStorage.getItem("mch-favorites") || "[]");

const grid = document.getElementById("channelGrid");
const empty = document.getElementById("emptyState");
const search = document.getElementById("search");
const count = document.getElementById("count");

const titles = {
 all:"قنوات ",
 favorites:"قنواتك المفضلة · ",
 recent:"القنوات المضافة حديثاً · "
};

// Supabase
const SUPABASE_URL = "https://irkjsubiecrbhladkdko.supabase.co";

// ضع Publishable Key الخاص بمشروعك هنا
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

  if (!response.ok) {
   throw new Error(await response.text());
  }

  const rows = await response.json();

  rows.forEach(row => {
   if (channels.some(c => c.id === "db-" + row.id)) return;

   channels.push({
    id: "db-" + row.id,
    name: row.name,
    country: "المغرب",
    category: "general",
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

function render() {
 const q = search.value.trim().toLowerCase();

 let list = channels.filter(c => c.country === selectedCountry);

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

 document.getElementById("sectionTitle").childNodes[0].textContent =
  (titles[selectedView] || "قنوات ") +
  (selectedView === "all" ? selectedCountry : "");

 grid.innerHTML = "";

 list.forEach(c => {
  const card = document.createElement("article");

  card.className = "channel-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "فتح " + c.name);

  card.innerHTML = `
   <span class="channel-badge">${c.desc}</span>
   <button class="fav-btn ${favorites.includes(c.id) ? "selected" : ""}"
    aria-label="إضافة للمفضلة">
    ${favorites.includes(c.id) ? "♥" : "♡"}
   </button>
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

 toast(
  favorites.includes(id)
   ? "أضيفت إلى المفضلة"
   : "حذفت من المفضلة"
 );
}

function openPlayer(c) {
 document.getElementById("playerTitle").textContent = c.name;

 const modal = document.getElementById("playerModal");
 const video = document.getElementById("videoPlayer");

 video.pause();
 video.removeAttribute("src");
 video.style.display = "none";

 document.getElementById("videoPlaceholder").style.display = "flex";

 if (c.stream) {
  video.src = c.stream;
  video.style.display = "block";
  document.getElementById("videoPlaceholder").style.display = "none";
  video.play().catch(() => {});
 }

 modal.classList.add("open");
 modal.setAttribute("aria-hidden", "false");
}

function closePlayer() {
 const m = document.getElementById("playerModal");
 const v = document.getElementById("videoPlayer");

 v.pause();

 m.classList.remove("open");
 m.setAttribute("aria-hidden", "true");
}

document.getElementById("closePlayer")
 .addEventListener("click", closePlayer);

document.getElementById("playerModal")
 .addEventListener("click", e => {
  if (e.target.id === "playerModal") closePlayer();
 });

document.addEventListener("keydown", e => {
 if (e.key === "Escape") closePlayer();
});

document.querySelectorAll("[data-view]").forEach(b => {
 b.addEventListener("click", () => {
  selectedView = b.dataset.view;

  document.querySelectorAll("[data-view]").forEach(x => {
   x.classList.toggle("active", x === b);
  });

  render();
 });
});

document.querySelectorAll("[data-country]").forEach(b => {
 b.addEventListener("click", () => {
  selectedCountry = b.dataset.country;
  selectedView = "all";

  document.querySelectorAll("[data-country]").forEach(x => {
   x.classList.toggle("active", x === b);
  });

  document.querySelectorAll("[data-view]").forEach(x => {
   x.classList.toggle("active", x.dataset.view === "all");
  });

  document.getElementById("crumb").textContent = selectedCountry;

  render();
 });
});

document.querySelectorAll("[data-filter]").forEach(b => {
 b.addEventListener("click", () => {
  selectedFilter = b.dataset.filter;

  document.querySelectorAll("[data-filter]").forEach(x => {
   x.classList.toggle("active", x === b);
  });

  render();
 });
});

search.addEventListener("input", render);

document.getElementById("browseBtn").addEventListener("click", () => {
 document.getElementById("channelsSection")
  .scrollIntoView({ behavior: "smooth" });
});

let toastTimer;

function toast(msg) {
 const el = document.getElementById("toast");

 el.textContent = msg;
 el.classList.add("show");

 clearTimeout(toastTimer);

 toastTimer = setTimeout(() => {
  el.classList.remove("show");
 }, 1800);
}

// تحميل القنوات المنشورة من Supabase
loadPublishedChannels();

if ("serviceWorker" in navigator &&
 location.protocol.startsWith("http")) {
 navigator.serviceWorker.register("./sw.js").catch(() => {});
}
