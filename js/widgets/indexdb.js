// Open or create DB
const request = indexedDB.open("Reflection Diary", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;

    const store = db.createObjectStore("conversations", { keyPath: "id", autoIncrement: true });

    store.createIndex("title", "title", { unique: false });
};

request.onsuccess = function (event) {
    const db = event.target.result;

    // Sample conversation object
    const conversation = {
        title: "AI Chat - July 26",
        chatHistory: [
            { role: "user", content: "What is IndexedDB?" },
            { role: "assistant", content: "It's a browser-based NoSQL DB..." }
        ],
        summary: "Explained what IndexedDB is with example.",
        analysis: "User asked about IndexedDB; assistant provided a tutorial and use case."
    };

    const tx = db.transaction("conversations", "readwrite");
    const store = tx.objectStore("conversations");

    // Add the conversation
    const addReq = store.add(conversation);

    addReq.onsuccess = function () {
        console.log("Conversation saved with ID:", addReq.result);

        const getReq = store.get(addReq.result);
        getReq.onsuccess = function () {
            console.log("Retrieved conversation:", getReq.result);
        };
    };

    tx.oncomplete = function () {
        db.close();
    };
};

request.onerror = function (event) {
    console.error("IndexedDB error:", event.target.error);
};
