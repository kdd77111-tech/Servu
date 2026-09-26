const SUPABASE_URL =
  "https://wmlgfnfexzsbkpzbelaz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_GypAC7VWOAkLtmnN_x65Rg_eGotNdka";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let providers = [];
let activeCategory = "الكل";

document.addEventListener(
  "DOMContentLoaded",
  loadProviders
);

async function loadProviders() {

  const grid =
    document.getElementById("productsGrid");

  grid.innerHTML =
    "<p>جاري تحميل الخدمات...</p>";

  const { data, error } = await db
    .from("providers")
    .select(`
      id,
      name,
      category,
      city,
      price_from,
      avatar_url,
      available,
      services (
        id,
        name,
        price
      )
    `)
    .eq("available", true)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    grid.innerHTML =
      "<p>تعذر تحميل الخدمات حالياً.</p>";

    return;
  }

  providers = data || [];

  renderProviders();
}

function renderProviders() {

  const grid =
    document.getElementById("productsGrid");

  const count =
    document.getElementById("resultCount");

  const search =
    (
      document.getElementById("searchInput")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const filtered =
    providers.filter(provider => {

      const categoryMatch =
        activeCategory === "الكل" ||
        provider.category === activeCategory;

      const text = [
        provider.name,
        provider.category,
        provider.city,
        ...(provider.services || [])
          .map(service => service.name)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        categoryMatch &&
        (!search || text.includes(search))
      );
    });

  count.textContent = filtered.length;

  if (!filtered.length) {

    grid.innerHTML =
      "<p>لا توجد خدمات مطابقة حالياً.</p>";

    return;
  }

  grid.innerHTML =
    filtered
      .map(provider => {

        const services =
          provider.services || [];

        const serviceText =
          services.length
            ? services
                .map(service =>
                  `${escapeHtml(service.name)}
                   — ${Number(
                     service.price || 0
                   ).toLocaleString("ar-SA")} ر.س`
                )
                .join("<br>")
            : "لا توجد خدمات مضافة";

        const image =
          provider.avatar_url
            ? `
              <img
                src="${escapeAttr(provider.avatar_url)}"
                class="card-image"
                alt="${escapeAttr(provider.name)}"
              >
            `
            : `
              <div class="card-image"></div>
            `;

        return `
          <article class="card">

            ${image}

            <div class="card-content">

              <h3>
                ${escapeHtml(
                  provider.name ||
                  "مقدم خدمة"
                )}
              </h3>

              <p>
                ${escapeHtml(
                  provider.category ||
                  "خدمات"
                )}
                ${
                  provider.city
                    ? " • " +
                      escapeHtml(provider.city)
                    : ""
                }
              </p>

              <p>
                ${serviceText}
              </p>

              <button
                onclick="contactProvider('${provider.id}')"
              >
                تواصل مع مقدم الخدمة
              </button>

            </div>

          </article>
        `;
      })
      .join("");
}

function searchItems() {
  renderProviders();
}

function filterCategory(category) {

  activeCategory = category;

  renderProviders();
}

function contactProvider(id) {

  const provider =
    providers.find(
      provider => provider.id === id
    );

  if (!provider) return;

  alert(
    `تم اختيار ${provider.name}`
  );
}

function openSellerPanel() {

  alert(
    "تسجيل مقدم الخدمة سيكون في الخطوة التالية."
  );
}

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
}

function escapeAttr(value) {

  return escapeHtml(value);
}

window.searchItems = searchItems;
window.filterCategory = filterCategory;
window.contactProvider = contactProvider;
window.openSellerPanel = openSellerPanel;
