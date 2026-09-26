const SUPABASE_URL = "https://wmlgfnfexzsbkpzbelaz.supabase.co";
const SUPABASE_KEY = "sb_publishable_GypAC7VWOAkLtmnN_x65Rg_eGotNdka";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allProviders = [];
let currentCategory = "الكل";

const servicesGrid = document.getElementById("servicesGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsCount = document.getElementById("resultsCount");


/* =========================
   Helpers
========================= */

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getCategoryIcon(category) {
  const icons = {
    "مطاعم": "🍔",
    "متاجر": "🛍️",
    "خدمات": "🛠️",
    "سيارات": "🚗",
    "عقارات": "🏠",
    "تصميم": "🎨"
  };

  return icons[category] || "✨";
}


/* =========================
   Load Providers
========================= */

async function loadProviders() {
  servicesGrid.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>جاري تحميل الخدمات...</p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("providers")
    .select(`
      id,
      name,
      category,
      city,
      price_from,
      rating,
      reviews_count,
      avatar_url,
      available,
      services (
        id,
        name,
        price
      )
    `)
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);

    servicesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>تعذر تحميل الخدمات</h3>
        <p>تأكد من اتصال قاعدة البيانات.</p>
      </div>
    `;

    return;
  }

  allProviders = data || [];

  renderProviders(allProviders);
}


/* =========================
   Render Providers
========================= */

function renderProviders(providers) {

  const cards = [];

  providers.forEach(provider => {

    const services = provider.services || [];

    if (services.length === 0) {

      cards.push(createServiceCard(
        provider,
        {
          name: "خدمات متنوعة",
          price: provider.price_from
        }
      ));

      return;
    }

    services.forEach(service => {
      cards.push(createServiceCard(provider, service));
    });

  });


  if (cards.length === 0) {

    servicesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>ما لقينا خدمات</h3>
        <p>جرّب كلمة بحث أو تصنيف مختلف.</p>
      </div>
    `;

    resultsCount.textContent = "لا توجد نتائج";
    return;
  }


  servicesGrid.innerHTML = cards.join("");

  resultsCount.textContent =
    `${cards.length} ${cards.length === 1 ? "خدمة" : "خدمات"}`;
}


/* =========================
   Service Card
========================= */

function createServiceCard(provider, service) {

  const name =
    service?.name ||
    "خدمة متنوعة";

  const category =
    provider?.category ||
    "خدمات";

  const providerName =
    provider?.name ||
    "مقدم خدمة";

  const city =
    provider?.city ||
    "غير محدد";

  const price =
    service?.price ??
    provider?.price_from ??
    0;

  const rating =
    provider?.rating ??
    0;

  const reviews =
    provider?.reviews_count ??
    0;

  const image =
    provider?.avatar_url ||
    "";


  const imageHTML = image
    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(name)}">`
    : `<div class="service-placeholder">${getCategoryIcon(category)}</div>`;


  return `
    <article
      class="service-card"
      data-provider-id="${escapeHTML(provider.id)}"
      data-category="${escapeHTML(category)}"
      data-search="${escapeHTML(
        `${name} ${providerName} ${category} ${city}`
      )}"
    >

      <div class="service-image">

        ${imageHTML}

        <span class="available-badge">
          ● متاح الآن
        </span>

      </div>


      <div class="service-body">

        <div class="service-category">
          ${escapeHTML(category)}
        </div>

        <h3 class="service-title">
          ${escapeHTML(name)}
        </h3>

        <p class="provider-name">
          ${escapeHTML(providerName)}
          · ${escapeHTML(city)}
        </p>


        <div
          style="
            display:flex;
            align-items:center;
            gap:6px;
            margin-bottom:14px;
            font-size:12px;
            color:#777486;
          "
        >
          <span>⭐</span>
          <strong style="color:#171521;">
            ${Number(rating).toFixed(1)}
          </strong>
          <span>
            (${Number(reviews)} تقييم)
          </span>
        </div>


        <div class="service-footer">

          <div class="service-price">
            ${price ? `${Number(price).toLocaleString("ar-SA")} ر.س` : "السعر عند الطلب"}
            ${
              price
                ? `<small> يبدأ من</small>`
                : ""
            }
          </div>

          <button
            class="contact-btn"
            onclick="contactProvider('${escapeHTML(provider.id)}')"
          >
            تواصل
          </button>

        </div>

      </div>

    </article>
  `;
}


/* =========================
   Search
========================= */

function performSearch() {

  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  const filtered = allProviders.filter(provider => {

    const services = provider.services || [];

    const providerText = `
      ${provider.name || ""}
      ${provider.category || ""}
      ${provider.city || ""}
    `.toLowerCase();


    const categoryMatch =
      currentCategory === "الكل" ||
      provider.category === currentCategory;


    const searchMatch =
      !query ||
      providerText.includes(query) ||
      services.some(service =>
        `${service.name || ""}`.toLowerCase().includes(query)
      );


    return categoryMatch && searchMatch;
  });


  renderProviders(filtered);
}


searchBtn?.addEventListener("click", performSearch);


searchInput?.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    performSearch();
  }

});


searchInput?.addEventListener("input", () => {

  if (!searchInput.value.trim()) {
    performSearch();
  }

});


/* =========================
   Popular Searches
========================= */

document
  .querySelectorAll(".popular-searches button")
  .forEach(button => {

    button.addEventListener("click", () => {

      const value =
        button.dataset.search || "";

      searchInput.value = value;

      performSearch();

      document
        .getElementById("services")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    });

  });


/* =========================
   Categories
========================= */

document
  .querySelectorAll(".category")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".category")
        .forEach(item =>
          item.classList.remove("active")
        );

      button.classList.add("active");

      currentCategory =
        button.dataset.category || "الكل";

      performSearch();

      document
        .getElementById("services")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    });

  });


/* =========================
   Show All
========================= */

document
  .getElementById("showAllBtn")
  ?.addEventListener("click", () => {

    currentCategory = "الكل";

    searchInput.value = "";

    document
      .querySelectorAll(".category")
      .forEach(item =>
        item.classList.remove("active")
      );

    document
      .querySelector('.category[data-category="الكل"]')
      ?.classList.add("active");

    performSearch();

    document
      .getElementById("services")
      ?.scrollIntoView({
        behavior: "smooth"
      });

  });


/* =========================
   Contact Provider
========================= */

window.contactProvider = async function(providerId) {

  const provider =
    allProviders.find(
      item => item.id === providerId
    );

  if (!provider) {
    alert("تعذر العثور على مقدم الخدمة.");
    return;
  }


  const { data: sessionData } =
    await supabaseClient.auth.getSession();

  const session =
    sessionData?.session;


  if (!session) {

    alert(
      "سجل الدخول أولًا حتى تقدر تتواصل مع مقدم الخدمة."
    );

    return;
  }


  alert(
    `تم اختيار ${provider.name || "مقدم الخدمة"}.\n\nسنجهز لك صفحة الطلب والمحادثة قريبًا.`
  );
};


/* =========================
   Login
========================= */

document
  .getElementById("loginBtn")
  ?.addEventListener("click", async () => {

    const { data } =
      await supabaseClient.auth.getSession();

    if (data?.session) {

      alert("أنت مسجل الدخول بالفعل.");

      return;
    }


    alert(
      "صفحة تسجيل الدخول سيتم تفعيلها في الخطوة القادمة."
    );

  });


/* =========================
   Provider Join
========================= */

document
  .getElementById("joinBtn")
  ?.addEventListener("click", async () => {

    const { data } =
      await supabaseClient.auth.getSession();

    if (!data?.session) {

      alert(
        "سجل الدخول أولًا، وبعدها تقدر تضيف خدمتك."
      );

      return;
    }


    alert(
      "صفحة إضافة الخدمة سيتم تفعيلها في الخطوة القادمة."
    );

  });


/* =========================
   Mobile Menu
========================= */

const menuBtn =
  document.getElementById("menuBtn");

menuBtn?.addEventListener("click", () => {

  const nav =
    document.querySelector(".nav-links");

  if (!nav) return;

  const visible =
    nav.style.display === "flex";

  nav.style.display =
    visible ? "" : "flex";

  if (!visible) {

    nav.style.position = "absolute";
    nav.style.top = "68px";
    nav.style.right = "12px";
    nav.style.left = "12px";
    nav.style.padding = "18px";
    nav.style.background = "white";
    nav.style.border = "1px solid #ebe9f1";
    nav.style.borderRadius = "16px";
    nav.style.flexDirection = "column";
    nav.style.alignItems = "stretch";
    nav.style.boxShadow =
      "0 20px 50px rgba(35,25,80,.1)";

  }

});


/* =========================
   Start
========================= */

loadProviders();
