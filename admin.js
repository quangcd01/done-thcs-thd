const firebaseConfig = {
    apiKey: "AIzaSyCbc7qwpgfuNArldNvtyfx3HlfEJYE28Ec",
    authDomain: "thcs-thd.firebaseapp.com",
    databaseURL: "https://thcs-thd-default-rtdb.firebaseio.com",
    projectId: "thcs-thd",
    storageBucket: "thcs-thd.firebasestorage.app",
    messagingSenderId: "45700741272",
    appId: "1:45700741272:web:908d54b8ff78c1354bb8ed",
    measurementId: "G-H0JP5VFM5R"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

// ===== UI elements (đúng theo Admin Panel) =====
const tbody = document.getElementById("usersTbody");
const emptyState = document.getElementById("emptyState");

const kpiTotal = document.getElementById("kpiTotal");
const kpiShown = document.getElementById("kpiShown");
const lastUpdated = document.getElementById("lastUpdated");

const searchInput = document.getElementById("searchInput");
const btnClear = document.getElementById("btnClear");
const btnReload = document.getElementById("btnReload");

let ALL_USERS = [];

function setUpdatedNow() {
    if (lastUpdated) lastUpdated.textContent = new Date().toLocaleString("vi-VN");
}

function setKPI(shown) {
    if (kpiTotal) kpiTotal.textContent = ALL_USERS.length;
    if (kpiShown) kpiShown.textContent = shown;
    setUpdatedNow();
}

function normalizeLastLogin(v) {
    // hỗ trợ number ms, string date, hoặc null
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN");
}

function renderUsers(list) {
    if (!tbody) {
        console.error("Không tìm thấy tbody. Kiểm tra id='usersTbody' trong admin.html");
        return;
    }

    tbody.innerHTML = "";

    if (!list.length) {
        if (emptyState) emptyState.style.display = "block";
        setKPI(0);
        return;
    }
    if (emptyState) emptyState.style.display = "none";

    list.forEach((u, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td class="muted">${idx + 1}</td>
      <td>${u.email ? u.email : '<span class="muted">--</span>'}</td>
      <td class="muted">${u.uid || "--"}</td>
      <td class="muted">${normalizeLastLogin(u.last_login)}</td>
    `;
        tbody.appendChild(tr);
    });

    setKPI(list.length);
}

function applySearch() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) return renderUsers(ALL_USERS);

    const filtered = ALL_USERS.filter(u => {
        const email = (u.email || "").toLowerCase();
        const uid = (u.uid || "").toLowerCase();
        return email.includes(q) || uid.includes(q);
    });

    renderUsers(filtered);
}

searchInput?.addEventListener("input", applySearch);

btnClear?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    applySearch();
});

// ===== Load users from RTDB =====
async function loadAllUsersOnce() {
    try {
        if (tbody) {
            tbody.innerHTML = `
        <tr>
          <td class="muted">...</td>
          <td class="muted" colspan="3">Đang tải dữ liệu...</td>
        </tr>
      `;
        }
        if (emptyState) emptyState.style.display = "none";

        const snap = await database.ref("users").once("value");
        const val = snap.val() || {};

        // Nếu node users trống -> render empty
        const keys = Object.keys(val);
        ALL_USERS = keys.map(uid => ({
            uid,
            email: val[uid]?.email || "",
            last_login: val[uid]?.last_login || null
        }));

        // sort newest last_login first
        ALL_USERS.sort((a, b) => (b.last_login || 0) - (a.last_login || 0));

        renderUsers(ALL_USERS);
    } catch (err) {
        alert("Lỗi đọc dữ liệu users: " + err.message);
        console.error(err);
        ALL_USERS = [];
        renderUsers(ALL_USERS);
    }
}

btnReload?.addEventListener("click", loadAllUsersOnce);

// Start
loadAllUsersOnce();
