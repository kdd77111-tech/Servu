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
   Providers
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
    console.error(error);

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

function renderProviders(providers) {
  const cards = [];

  providers.forEach(provider => {
    const services = provider.services || [];

    if (services.length === 0) {
      cards.push(
        createServiceCard(provider, {
          name: "خدمات متنوعة",
          price: provider.price_from
        })
      );
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

function createServiceCard(provider, service) {
  const name = service?.name || "خدمة متنوعة";
  const category = provider?.category || "خدمات";
  const providerName = provider?.name || "مقدم خدمة";
  const city = provider?.city || "غير محدد";

  const price =
    service?.price ??
    provider?.price_from ??
    0;

  const rating = provider?.rating ?? 0;
  const reviews = provider?.reviews_count ?? 0;
  const image = provider?.avatar_url || "";

  const imageHTML = image
    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(name)}">`
    : `<div class="service-placeholder">${getCategoryIcon(category)}</div>`;

  return `
    <article
      class="service-card"
      data-provider-id="${escapeHTML(provider.id)}"
      data-category="${escapeHTML(category)}"
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

        <div style="
          display:flex;
          align-items:center;
          gap:6px;
          margin-bottom:14px;
          font-size:12px;
          color:#777486;
        ">
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
            ${
              price
                ? `${Number(price).toLocaleString("ar-SA")} ر.س`
                : "السعر عند الطلب"
            }

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
    searchInput.value.trim().toLowerCase();

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
        `${service.name || ""}`
          .toLowerCase()
          .includes(query)
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
   Authentication Modal
========================= */

function ensureAuthModal() {

  if (document.getElementById("authModal")) return;

  document.body.insertAdjacentHTML("beforeend", `

    <div
      id="authModal"
      style="
        display:none;
        position:fixed;
        inset:0;
        background:rgba(20,15,40,.60);
        z-index:9999;
        padding:20px;
        align-items:center;
        justify-content:center;
      "
    >

      <div
        style="
          background:#fff;
          width:min(420px,100%);
          border-radius:22px;
          padding:24px;
          position:relative;
          box-shadow:0 25px 80px rgba(0,0,0,.2);
        "
      >

        <button
          id="closeAuth"
          style="
            position:absolute;
            top:12px;
            left:12px;
            border:0;
            background:#f3f1f7;
            width:34px;
            height:34px;
            border-radius:50%;
            font-size:20px;
            cursor:pointer;
          "
        >
          ×
        </button>

        <h2 style="margin:0 0 6px;">
          حسابك في سيرفي
        </h2>

        <p style="margin:0 0 18px;color:#777486;">
          سجل الدخول أو أنشئ حسابًا جديدًا
        </p>

        <div style="display:flex;gap:8px;margin-bottom:18px;">

          <button
            id="loginTab"
            type="button"
            style="
              flex:1;
              padding:11px;
              border:0;
              border-radius:12px;
              cursor:pointer;
            "
          >
            تسجيل الدخول
          </button>

          <button
            id="signupTab"
            type="button"
            style="
              flex:1;
              padding:11px;
              border:0;
              border-radius:12px;
              cursor:pointer;
            "
          >
            حساب جديد
          </button>

        </div>

        <form id="authForm">

          <input
            id="authName"
            placeholder="الاسم الكامل"
            style="
              display:none;
              width:100%;
              padding:13px;
              border:1px solid #ddd;
              border-radius:12px;
              box-sizing:border-box;
              margin-bottom:12px;
            "
          >

          <input
            id="authEmail"
            type="email"
            required
            placeholder="البريد الإلكتروني"
            style="
              width:100%;
              padding:13px;
              border:1px solid #ddd;
              border-radius:12px;
              box-sizing:border-box;
              margin-bottom:12px;
            "
          >

          <input
            id="authPassword"
            type="password"
            required
            minlength="6"
            placeholder="كلمة المرور"
            style="
              width:100%;
              padding:13px;
              border:1px solid #ddd;
              border-radius:12px;
              box-sizing:border-box;
              margin-bottom:12px;
            "
          >

          <select
            id="authType"
            style="
              display:none;
              width:100%;
              padding:13px;
              border:1px solid #ddd;
              border-radius:12px;
              margin-bottom:12px;
            "
          >
            <option value="customer">
              أبحث عن خدمة
            </option>

            <option value="provider">
              أقدم خدمة
            </option>
          </select>

          <input
            id="authCategory"
            placeholder="تصنيف خدمتك، مثل: تصميم"
            style="
              display:none;
              width:100%;
              padding:13px;
              border:1px solid #ddd;
              border-radius:12px;
              box-sizing:border-box;
              margin-bottom:12px;
            "
          >

          <button
            id="authSubmit"
            type="submit"
            style="
              width:100%;
              padding:14px;
              border:0;
              border-radius:13px;
              background:#6d45e8;
              color:#fff;
              font-weight:700;
              cursor:pointer;
            "
          >
            تسجيل الدخول
          </button>

          <p
            id="authMessage"
            style="
              margin:12px 0 0;
              text-align:center;
            "
          ></p>

        </form>

      </div>

    </div>
  `);

  let mode = "login";

  const modal =
    document.getElementById("authModal");

  const name =
    document.getElementById("authName");

  const type =
    document.getElementById("authType");

  const category =
    document.getElementById("authCategory");

  const submit =
    document.getElementById("authSubmit");

  const message =
    document.getElementById("authMessage");

  function setMode(newMode) {

    mode = newMode;

    const signup =
      mode === "signup";

    name.style.display =
      signup ? "block" : "none";

    type.style.display =
      signup ? "block" : "none";

    category.style.display =
      signup && type.value === "provider"
        ? "block"
        : "none";

    submit.textContent =
      signup
        ? "إنشاء الحساب"
        : "تسجيل الدخول";

    message.textContent = "";
  }

  window.openAuthModal =
    function(newMode = "login") {
      setMode(newMode);
      modal.style.display = "flex";
    };

  document
    .getElementById("closeAuth")
    .onclick = () => {
      modal.style.display = "none";
    };

  document
    .getElementById("loginTab")
    .onclick = () => {
      setMode("login");
    };

  document
    .getElementById("signupTab")
    .onclick = () => {
      setMode("signup");
    };

  type.addEventListener("change", () => {

    category.style.display =
      type.value === "provider" &&
      mode === "signup"
        ? "block"
        : "none";

  });

  document
    .getElementById("authForm")
    .addEventListener("submit", async event => {

      event.preventDefault();

      submit.disabled = true;
      message.textContent = "";

      try {

        const email =
          document
            .getElementById("authEmail")
            .value
            .trim();

        const password =
          document
            .getElementById("authPassword")
            .value;

        let result;

        if (mode === "login") {

          result =
            await supabaseClient.auth
              .signInWithPassword({
                email,
                password
              });

        } else {

          result =
            await supabaseClient.auth
              .signUp({
                email,
                password,
                options: {
                  data: {
                    full_name:
                      name.value.trim(),

                    account_type:
                      type.value,

                    category:
                      category.value.trim() ||
                      "عام"
                  },

                  emailRedirectTo:
                    window.location.href
                }
              });
        }

        if (result.error) {
          throw result.error;
        }

        if (
          mode === "signup" &&
          !result.data.session
        ) {

          message.style.color =
            "#2e7d32";

          message.textContent =
            "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب.";

        } else {

          modal.style.display = "none";

          updateAuthButton(
            result.data.session
          );
        }

      } catch (error) {

        console.error(
          "Auth error:",
          error
        );

        message.style.color =
          "#c0392b";

        message.textContent =
          error.message ||
          "حدث خطأ، حاول مرة أخرى.";

      } finally {

        submit.disabled = false;

      }

    });
}

/* =========================
   Auth Button
========================= */

function updateAuthButton(session) {

  const button =
    document.getElementById("loginBtn");

  if (!button) return;

  button.textContent =
    session
      ? "حسابي"
      : "تسجيل الدخول";

  button.onclick =
    async () => {

      if (session) {

        await supabaseClient.auth
          .signOut();

        updateAuthButton(null);

        return;
      }

      ensureAuthModal();

      openAuthModal("login");
    };
}

ensureAuthModal();

supabaseClient.auth
  .getSession()
  .then(({ data }) => {

    updateAuthButton(
      data?.session || null
    );

  });

supabaseClient.auth
  .onAuthStateChange(
    (_event, session) => {

      updateAuthButton(session);

    }
  );

/* =========================
   Contact Provider
========================= */

window.contactProvider =
  async function(providerId) {

    const provider =
      allProviders.find(
        item => item.id === providerId
      );

    if (!provider) {
      alert(
        "تعذر العثور على مقدم الخدمة."
      );
      return;
    }

    const { data } =
      await supabaseClient.auth
        .getSession();

    if (!data?.session) {

      ensureAuthModal();

      openAuthModal("login");

      return;
    }

    alert(
      `تم اختيار ${provider.name || "مقدم الخدمة"}.
صفحة الطلب والمحادثة سنبنيها في الخطوة القادمة.`
    );
  };

/* =========================
   Provider Join
========================= */

document
  .getElementById("joinBtn")
  ?.addEventListener(
    "click",
    async () => {

      const { data } =
        await supabaseClient.auth
          .getSession();

      if (!data?.session) {

        ensureAuthModal();

        openAuthModal("signup");

        return;
      }

      alert(
        "أنت مسجل الدخول. صفحة إضافة الخدمة سنبنيها في الخطوة القادمة."
      );

    }
  );

/* =========================
   Show All
========================= */

document
  .getElementById("showAllBtn")
  ?.addEventListener(
    "click",
    () => {

      currentCategory = "الكل";

      searchInput.value = "";

      document
        .querySelectorAll(".category")
        .forEach(item =>
          item.classList.remove("active")
        );

      document
        .querySelector(
          '.category[data-category="الكل"]'
        )
        ?.classList.add("active");

      performSearch();

      document
        .getElementById("services")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

/* =========================
   Mobile Menu
========================= */

const menuBtn =
  document.getElementById("menuBtn");

menuBtn?.addEventListener(
  "click",
  () => {

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
  }
);

/* =========================
   Start
========================= */

loadProviders();
