/// instead of including in html making separate file for js necessary for offline functionality





let db;

const request = indexedDB.open("budget", 1);
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });

};
request.onsuccess = function (event) {
    db = event.target.result;
    ///  if app online read from it if not save to it
    if (navigator.onLine) {
        checkDatabase();

    } else {
        saveRecord(record);

    }
};
request.onerror = function (event) {
    console.log("sorry error " + event.target.errorCode);

};
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);

}
//// check db access pending object store then get records set to getAll 
function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    accept: "application/json, text/plain, */*",
                    "Content=Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    const transaction = db.transaction(["pending"], "readwrite");
                    const store = transaction.objectStore("pending");
                    //// after access clear it out
                    store.clear();


                })
                .catch(err => console.log(err));
        }
    }

}
window.addEventListener("online", checkDatabase);


