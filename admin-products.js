const db = firebase.database();
const productsRef = db.ref("products");

// UI
const elTbody = document.getElementById("productsTbody");
const elTotal = document.getElementById("kpiTotal");
const elShown = document.getElementById("kpiShown");
const elUpdated = document.getElementById("lastUpdated");

const elSearch = document.getElementById("searchInput");
const btnClear = document.getElementById("btnClear");
const btnReload = document.getElementById("btnReload");

const elProductId = document.getElementById("productId");
const elName = document.getElementById("name");
const elPrice = document.getElementById("price");
const elCategory = document.getElementById("category");
const elStock = document.getElementById("stock");
const elStatus = document.getElementById("status");
const elDescription = document.getElementById("description");

const elImageFile = document.getElementById("imageFile");
const elImagePreview = document.getElementById("imagePreview");
const elImageInfo = document.getElementById("imageInfo");

const btnReset = document.getElementById("btnReset");
const btnSave = document.getElementById("btnSave");

let ALL_PRODUCTS = [];
let CURRENT_IMAGE_DATA = ""; // khi edit: giữ ảnh cũ nếu không chọn ảnh mới

function setUpdatedNow() {
    elUpdated.textContent = new Date().toLocaleString("vi-VN");
}
function setKPIs(shown) {
    elTotal.textContent = ALL_PRODUCTS.length;
    elShown.textContent = shown;
    setUpdatedNow();
}
function vnd(n) {
    const num = Number(n || 0);
    return num.toLocaleString("vi-VN") + " ₫";
}

function resetForm() {
    elProductId.value = "";
    elName.value = "";
    elPrice.value = "";
    elCategory.value = "";
    elStock.value = "";
    elStatus.value = "active";
    elDescription.value = "";

    elImageFile.value = "";
    elImagePreview.src = "";
    elImageInfo.textContent = "Chưa chọn ảnh";
    CURRENT_IMAGE_DATA = "";

    btnSave.textContent = "Lưu sản phẩm";
}

function getFormData() {
    const name = elName.value.trim();
    const price = Number(elPrice.value);

    if (!name) throw new Error("Tên sản phẩm không được để trống");
    if (!price || price < 0) throw new Error("Giá không hợp lệ");

    return {
        name,
        price,
        category: elCategory.value.trim(),
        stock: Number(elStock.value || 0),
        status: elStatus.value,
        description: elDescription.value.trim(),
    };
}

/**
 * Đọc file ảnh -> resize + nén -> dataURL
 * - Giới hạn: maxWidth/Height
 * - Nén: webp nếu hỗ trợ, fallback jpeg
 */
async function fileToCompressedDataURL(file, options = {}) {
    const {
        maxWidth = 720,
        maxHeight = 720,
        quality = 0.75,         // 0..1
        preferWebp = true,
        maxOutputKB = 350       // cố gắng nén dưới ~350KB
    } = options;

    if (!file) throw new Error("Bạn chưa chọn ảnh sản phẩm");

    // giới hạn file đầu vào để tránh treo
    const maxInputMB = 5;
    if (file.size > maxInputMB * 1024 * 1024) {
        throw new Error(`Ảnh quá nặng (> ${maxInputMB}MB). Hãy chọn ảnh nhỏ hơn.`);
    }

    const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(file);
    });

    // tính tỉ lệ resize
    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // vẽ ảnh
    ctx.drawImage(img, 0, 0, w, h);

    // chọn mime
    const canWebp = preferWebp && canvas.toDataURL("image/webp").startsWith("data:image/webp");
    const mime = canWebp ? "image/webp" : "image/jpeg";

    // thử nén nhiều lần để xuống dưới maxOutputKB
    let q = quality;
    let dataURL = canvas.toDataURL(mime, q);

    const sizeKB = (str) => Math.ceil((str.length * 3) / 4 / 1024); // ước lượng base64 -> KB
    while (sizeKB(dataURL) > maxOutputKB && q > 0.35) {
        q -= 0.08;
        dataURL = canvas.toDataURL(mime, q);
    }

    URL.revokeObjectURL(img.src);

    return { dataURL, mime, w, h, outKB: sizeKB(dataURL) };
}

// preview + chuẩn bị data
elImageFile.addEventListener("change", async () => {
    const file = elImageFile.files?.[0];
    if (!file) return;

    elImageInfo.textContent = "Đang xử lý ảnh...";
    try {
        const out = await fileToCompressedDataURL(file, {
            maxWidth: 720,
            maxHeight: 720,
            quality: 0.78,
            preferWebp: true,
            maxOutputKB: 350
        });
        CURRENT_IMAGE_DATA = out.dataURL;
        elImagePreview.src = CURRENT_IMAGE_DATA;
        elImageInfo.textContent = `Đã nén: ${out.w}x${out.h} • ~${out.outKB}KB • ${out.mime}`;
    } catch (e) {
        CURRENT_IMAGE_DATA = "";
        elImagePreview.src = "";
        elImageInfo.textContent = "Chưa chọn ảnh";
        alert(e.message || "Lỗi xử lý ảnh");
    }
});

function renderProducts(list) {
    elTbody.innerHTML = "";

    list.forEach((p, idx) => {
        const statusBadge =
            p.status === "active"
                ? `<span class="badge user">✅ Đang bán</span>`
                : `<span class="badge admin">⛔ Tạm ẩn</span>`;

        const thumb = p.imageData
            ? `<img src="${p.imageData}" alt=""
          style="width:44px;height:44px;object-fit:cover;border-radius:10px;border:1px solid var(--stroke);background:rgba(255,255,255,.03);" />`
            : `<div style="width:44px;height:44px;border-radius:10px;border:1px solid var(--stroke);background:rgba(255,255,255,.03);"></div>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td class="muted">${idx + 1}</td>
      <td>
        <div style="display:flex; gap:10px; align-items:center;">
          ${thumb}
          <div>
            <div style="font-weight:700;">${p.name || "--"}</div>
            <div class="muted" style="font-size:12px;">${p.id}</div>
          </div>
        </div>
      </td>
      <td class="muted">${p.category || "--"}</td>
      <td style="font-weight:700;">${vnd(p.price)}</td>
      <td class="muted">${p.stock ?? 0}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="table-actions">
          <button class="btn small" data-action="edit" data-id="${p.id}">Sửa</button>
          <button class="btn small" data-action="delete" data-id="${p.id}">Xoá</button>
        </div>
      </td>
    `;
        elTbody.appendChild(tr);
    });

    setKPIs(list.length);
}

function applySearch() {
    const q = (elSearch.value || "").trim().toLowerCase();
    if (!q) return renderProducts(ALL_PRODUCTS);

    const filtered = ALL_PRODUCTS.filter(p => {
        const name = (p.name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
    });

    renderProducts(filtered);
}

async function loadProductsOnce() {
    elTbody.innerHTML = `<tr><td class="muted">...</td><td class="muted" colspan="6">Đang tải dữ liệu...</td></tr>`;

    const snap = await productsRef.once("value");
    const val = snap.val() || {};

    ALL_PRODUCTS = Object.keys(val).map(id => ({ id, ...val[id] }));
    ALL_PRODUCTS.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    renderProducts(ALL_PRODUCTS);
}

async function saveProduct() {
    try {
        const data = getFormData();
        const now = Date.now();
        const id = elProductId.value;
        const hasImage = !!CURRENT_IMAGE_DATA;

        if (!id) {
            // CREATE: bắt buộc có ảnh
            if (!hasImage) throw new Error("Vui lòng chọn ảnh sản phẩm (từ máy) trước khi lưu.");

            const newRef = productsRef.push();
            await newRef.set({
                ...data,
                imageData: CURRENT_IMAGE_DATA,
                createdAt: now,
                updatedAt: now
            });

        } else {
            // UPDATE: nếu không chọn ảnh mới => giữ ảnh cũ (CURRENT_IMAGE_DATA đã set khi edit)
            if (!hasImage) throw new Error("Thiếu ảnh. (Nếu bạn đang sửa, ảnh cũ phải còn hiển thị; hãy bấm Sửa lại.)");

            await productsRef.child(id).update({
                ...data,
                imageData: CURRENT_IMAGE_DATA,
                updatedAt: now
            });
        }

        resetForm();
        await loadProductsOnce();
        alert("Lưu sản phẩm thành công!");
    } catch (e) {
        alert(e.message || "Có lỗi xảy ra");
    }
}

function fillFormForEdit(product) {
    elProductId.value = product.id;
    elName.value = product.name || "";
    elPrice.value = product.price ?? "";
    elCategory.value = product.category || "";
    elStock.value = product.stock ?? "";
    elStatus.value = product.status || "active";
    elDescription.value = product.description || "";

    // giữ ảnh cũ
    CURRENT_IMAGE_DATA = product.imageData || "";
    elImagePreview.src = CURRENT_IMAGE_DATA || "";
    elImageInfo.textContent = CURRENT_IMAGE_DATA ? "Đang dùng ảnh hiện tại (chọn ảnh mới nếu muốn thay)" : "Chưa có ảnh";
    elImageFile.value = "";

    btnSave.textContent = "Cập nhật sản phẩm";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {
    const ok = confirm("Bạn chắc chắn muốn xoá sản phẩm này?");
    if (!ok) return;

    await productsRef.child(id).remove();
    await loadProductsOnce();
    alert("Đã xoá sản phẩm.");
}

// Events
elSearch.addEventListener("input", applySearch);
btnClear.addEventListener("click", () => { elSearch.value = ""; applySearch(); });
btnReload.addEventListener("click", loadProductsOnce);
btnReset.addEventListener("click", resetForm);
btnSave.addEventListener("click", saveProduct);

elTbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const product = ALL_PRODUCTS.find(p => p.id === id);
    if (action === "edit" && product) fillFormForEdit(product);
    if (action === "delete") deleteProduct(id);
});

// Start
resetForm();
loadProductsOnce();
