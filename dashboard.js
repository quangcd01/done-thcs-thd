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

if (!firebase.apps.length)     // Kiểm tra nếu chưa có ứng dụng Firebase nào được khởi tạo
    firebase.initializeApp(firebaseConfig);

const auth = firebase.auth()
const database = firebase.database()

const elAvatar = document.getElementById("userAvatar");
const elName = document.getElementById("userName");
const elEmail = document.getElementById("userEmail");

function avatarFromText(text) {
    if (!text) return "U"
    return text.trim().slice(0, 2).toUpperCase();
}

// Chỉ cho vào dashboard khi đã đăng nhập
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        // CHƯA đăng nhập => đá về trang login của bạn
        // đổi "index.html" nếu trang login bạn tên khác
        window.location.href = "index.html";
        return;
    }

    // Hiển thị email
    elEmail.textContent = user.email || "";

    // Lấy thêm data từ Realtime DB (users/uid) bạn đã lưu ở signUp()
    try {
        const snap = await database.ref("users/" + user.uid).once("value");
        const data = snap.val() || {};

        // Bạn chưa lưu name, nên lấy phần trước @ làm tên
        const displayName = (data.name && data.name.trim())
            ? data.name.trim()
            : (user.email ? user.email.split("@")[0] : "User");

        elName.textContent = displayName;
        elAvatar.textContent = avatarFromText(displayName);
    } catch (e) {
        const displayName = user.email ? user.email.split("@")[0] : "User";
        elName.textContent = displayName;
        elAvatar.textContent = avatarFromText(displayName);
    }
});

// Logout chỉ khi bấm nút
btnLogout.addEventListener("click", () => {
    auth.signOut().then(() => {
        window.location.href = "index.html"; // đổi nếu cần
    });
});
