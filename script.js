/****************************
 * GLOBAL STATE
 ****************************/
let queue = [];
let sharedValue = 0;
let encryptionEnabled = false;
let typingTimeout = null;

/****************************
 * TIME + LOGGING
 ****************************/
function getTimestamp() {
    return new Date().toLocaleTimeString();
}

function logEvent(message, type = "INFO") {
    const logWindow = document.getElementById("logWindow");
    if (!logWindow) return;

    logWindow.innerHTML += `<div>[${getTimestamp()}] <strong>${type}</strong>: ${message}</div>`;
    logWindow.scrollTop = logWindow.scrollHeight;
}

/****************************
 * ENCRYPTION
 ****************************/
function simpleEncrypt(text) {
    return text.split("").map(ch => String.fromCharCode(ch.charCodeAt(0) + 1)).join("");
}

/****************************
 * QUEUE + SHARED MEMORY UPDATES
 ****************************/
function updateQueueUI() {
    const disp = document.getElementById("queueDisplay");
    disp.textContent = queue.length ? queue.join(" | ") : "(empty)";
}

function updateSharedUI() {
    document.getElementById("sharedDisplay").textContent = sharedValue;
}

function updateAllFromMessage(msg) {
    let data = msg;
    if (encryptionEnabled) {
        data = simpleEncrypt(msg);
        logEvent(`Message encrypted for IPC routing: ${data}`, "SECURITY");
    }

    queue.push(data);
    sharedValue = data.length;

    updateQueueUI();
    updateSharedUI();
    logEvent("Message propagated to Queue & Shared Memory", "IPC");
}

/****************************
 * TYPING INDICATOR
 ****************************/
function showTyping(person) {
    const indicator = document.getElementById("typingIndicator");
    indicator.textContent = `Person ${person} is typing...`;

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => indicator.textContent = "", 1500);
}

/****************************
 * CHAT (TWO-WAY PIPE)
 ****************************/
function appendChatMessage(side, sender, message) {
    const chat = document.getElementById("chatWindow");
    const row = document.createElement("div");
    row.className = "chat-row";

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${side}`;
    bubble.textContent = `${sender}: ${message}`;

    const time = document.createElement("div");
    time.className = "chat-meta";
    time.textContent = getTimestamp();

    row.appendChild(bubble);
    row.appendChild(time);
    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;
}

function sendA() {
    const input = document.getElementById("msgA");
    if (!input.value.trim()) return;

    const msg = input.value.trim();
    appendChatMessage("chat-left", "A", msg);
    updateAllFromMessage(msg);
    logEvent(`A sent: ${msg}`, "PIPE");

    input.value = "";
}

function sendB() {
    const input = document.getElementById("msgB");
    if (!input.value.trim()) return;

    const msg = input.value.trim();
    appendChatMessage("chat-right", "B", msg);
    updateAllFromMessage(msg);
    logEvent(`B sent: ${msg}`, "PIPE");

    input.value = "";
}

/****************************
 * MANUAL QUEUE OPS
 ****************************/
function enqueueMessage() {
    const input = document.getElementById("queueInput");
    if (!input.value.trim()) return;

    queue.push(input.value.trim());
    updateQueueUI();
    logEvent(`Manually Enqueued: ${input.value.trim()}`, "QUEUE");
    input.value = "";
}

function dequeueMessage() {
    if (queue.length === 0) {
        logEvent("Queue empty (dequeue attempted)", "QUEUE");
        return;
    }
    const msg = queue.shift();
    updateQueueUI();
    document.getElementById("queueOutput").textContent = msg;
    logEvent(`Dequeued: ${msg}`, "QUEUE");
}

/****************************
 * SHARED MEMORY OPS
 ****************************/
function writeSharedMemory() {
    const input = document.getElementById("sharedInput");
    if (!input.value.trim()) return;
    
    sharedValue = parseInt(input.value);
    updateSharedUI();
    logEvent(`Shared memory updated: ${sharedValue}`, "SHM");
    input.value = "";
}

function incrementProcess() {
    sharedValue++;
    updateSharedUI();
    logEvent("Shared memory incremented", "SHM");
}

function decrementProcess() {
    sharedValue--;
    updateSharedUI();
    logEvent("Shared memory decremented", "SHM");
}

/****************************
 * RESET SYSTEM
 ****************************/
function resetSystem() {
    document.getElementById("chatWindow").innerHTML = "";
    queue = [];
    sharedValue = 0;
    updateQueueUI();
    updateSharedUI();
    document.getElementById("logWindow").innerHTML = "";
    logEvent("System reset completed", "SYSTEM");
}

/****************************
 * INITIALIZE
 ****************************/
document.addEventListener("DOMContentLoaded", () => {
    updateQueueUI();
    updateSharedUI();
    logEvent("IPC Simulation Loaded", "SYSTEM");

    document.getElementById("encryptToggle")
        ?.addEventListener("change", (e) => {
            encryptionEnabled = e.target.checked;
            logEvent(
                encryptionEnabled ? "Encryption ON" : "Encryption OFF",
                "SECURITY"
            );
        });

    document.getElementById("msgA")?.addEventListener("input", () => showTyping("A"));
    document.getElementById("msgB")?.addEventListener("input", () => showTyping("B"));
});
/******** HOME PAGE IPC COMPARISON TABS ********/
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-btn");
    const display = document.getElementById("tab-content");

    if (!tabs.length || !display) return;

    const content = {
        pipes: `
            <h4>Pipes</h4>
            <p>Unidirectional channel. Simple parent-child communication.</p>
        `,
        queues: `
            <h4>Message Queues</h4>
            <p>FIFO structured message passing between processes.</p>
        `,
        shared: `
            <h4>Shared Memory</h4>
            <p>Fastest IPC. Direct access to a common memory segment.</p>
        `
    };

    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            display.innerHTML = content[btn.dataset.target];
        });
    });
});
