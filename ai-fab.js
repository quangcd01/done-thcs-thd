// Floating "play" button to open AI Q&A page.
// Usage: include this file + css/ai-fab.css on any page you want.

(function () {
    function ensureFab() {
        if (document.getElementById("aiFab")) return;

        var a = document.createElement("a");
        a.id = "aiFab";
        a.className = "ai-fab";
        a.href = "./AI_chatBot/tet-ai.html"; // đổi tên nếu trang AI của bạn khác
        a.setAttribute("aria-label", "Mở trang hỏi đáp AI về Tết");
        a.title = "AI hỏi đáp Tết";

        var icon = document.createElement("span");
        icon.className = "ai-fab__icon";
        a.appendChild(icon);

        document.body.appendChild(a);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureFab);
    } else {
        ensureFab();
    }
})();
