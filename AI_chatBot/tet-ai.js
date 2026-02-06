const chatEl = document.getElementById("chat");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");

const apiKeyEl = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKey");
const clearKeyBtn = document.getElementById("clearKey");

// Lưu tạm trong sessionStorage (không lưu lâu dài, nhưng vẫn có thể bị lộ qua Network khi gọi API)
const KEY_STORAGE = "AIzaSyD8gLX3DeeOb5uYcSEFiKu-oEpEEkUigBM";

// Lịch sử chat đơn giản (multi-turn)
const history = []; // {role:'user'|'model', text:'...'}

function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = `msg ${role === "user" ? "user" : "bot"}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    row.appendChild(bubble);
    chatEl.appendChild(row);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function getApiKey() {
    return (sessionStorage.getItem(KEY_STORAGE) || "").trim();
}

function setApiKey(k) {
    sessionStorage.setItem(KEY_STORAGE, k.trim());
}

function clearApiKey() {
    sessionStorage.removeItem(KEY_STORAGE);
}

saveKeyBtn.addEventListener("click", () => {
    const k = apiKeyEl.value.trim();
    if (!k) {
        alert("Bạn chưa dán API key.");
        return;
    }
    setApiKey(k);
    apiKeyEl.value = "";
    alert("Đã lưu tạm API key cho phiên làm việc này.");
});

clearKeyBtn.addEventListener("click", () => {
    clearApiKey();
    alert("Đã xoá API key khỏi phiên.");
});

async function callGemini(question) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("MISSING_KEY");

    // “Khóa” chủ đề Tết bằng policy đặt trước
    const tetPolicy =
        "Bạn là trợ lý hỏi đáp về TẾT VIỆT NAM. " +
        "Trả lời ngắn gọn, dễ hiểu, đúng trọng tâm. " +
        "Chỉ trả lời các nội dung liên quan Tết (phong tục, món ăn, lời chúc, lịch hoạt động, kiêng kỵ, ý nghĩa). " +
        "Nếu câu hỏi ngoài chủ đề Tết, hãy nói bạn chỉ hỗ trợ chủ đề Tết và gợi ý người dùng hỏi lại đúng chủ đề. " +
        "Khi nói về kiêng kỵ/phong tục, nhắc rằng có thể khác nhau theo vùng miền." +
        "Nếu người dùng hỏi về website này, hãy nói làm về bán đồ ăn Tết và cung cấp thông tin Tết Việt Nam."
        ;

    // Build contents theo format Gemini (role user/model)
    const contents = [];

    // Nhét policy vào đầu để “neo” chủ đề
    contents.push({
        role: "user",
        parts: [{ text: tetPolicy }]
    });

    // Lấy 10 lượt gần nhất
    for (const m of history.slice(-10)) {
        if (!m || (m.role !== "user" && m.role !== "model")) continue;
        const t = (m.text || "").trim();
        if (!t) continue;
        contents.push({ role: m.role, parts: [{ text: t }] });
    }

    // Turn hiện tại
    contents.push({ role: "user", parts: [{ text: question }] });

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const body = {
        contents,
        generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 512
        }
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error("GEMINI_ERROR: " + errText);
    }

    const data = await res.json();

    // Trích text trả lời
    const answer =
        data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim()
        || "Mình chưa trả lời được, bạn hỏi lại giúp mình nhé.";

    return answer;
}

formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = inputEl.value.trim();
    if (!question) return;

    inputEl.value = "";

    addMessage("user", question);
    history.push({ role: "user", text: question });

    addMessage("model", "Đang trả lời…");
    sendBtn.disabled = true;
    inputEl.disabled = true;

    try {
        const answer = await callGemini(question);

        // Xoá bubble “Đang trả lời…”
        chatEl.lastChild.remove();

        addMessage("model", answer);
        history.push({ role: "model", text: answer });
    } catch (err) {
        chatEl.lastChild.remove();

        if ((err.message || "").includes("MISSING_KEY")) {
            addMessage("model", "Bạn dán Gemini API key ở phía trên trước nhé.");
        } else {
            addMessage("model", "Mình gặp lỗi khi gọi AI. Bạn thử lại nhé.");
            console.error(err);
        }
    } finally {
        sendBtn.disabled = false;
        inputEl.disabled = false;
        inputEl.focus();
    }
});

// chào
addMessage("model", "Chào bạn! Dán API key ở trên, rồi hỏi mình về Tết nhé 🎋");
