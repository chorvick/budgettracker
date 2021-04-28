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
        // alert("Navigator is online")
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
        // alert("Successfully loaded ")          /// note this shows the connection being made
        if (getAll.result.length > 0) {
            // alert(JSON.stringify(getAll.result))    /////// this shows our offine inputs of credits and debits  are captured , but this payload is not making it into the database, --- very close to a solution
            fetch("/api/transaction/bulk", {   /////////////this line seems to be a big problem 
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

function deletePending() {

    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");

    store.clear();
}



/// app comes back online 
window.addEventListener("online", checkDatabase);


