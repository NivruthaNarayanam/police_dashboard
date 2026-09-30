console.log("🔥 SCRIPT.JS IS LOADED");
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
// ================= NOTIFICATION SOUND =================

let initializedAlerts = false;

let audioContext = null;


// Create a short emergency notification sound
function playAlertSound() {

    try {

        if (!audioContext) {
            audioContext =
                new (window.AudioContext ||
                     window.webkitAudioContext)();
        }


        // Resume audio context if browser suspended it
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }


        const now = audioContext.currentTime;


        // ---------- FIRST TONE ----------

        const oscillator1 =
            audioContext.createOscillator();

        const gain1 =
            audioContext.createGain();


        oscillator1.type = "sine";

        oscillator1.frequency.setValueAtTime(
            880,
            now
        );


        gain1.gain.setValueAtTime(
            0.0001,
            now
        );

        gain1.gain.exponentialRampToValueAtTime(
            0.5,
            now + 0.02
        );

        gain1.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.25
        );


        oscillator1.connect(gain1);

        gain1.connect(audioContext.destination);


        oscillator1.start(now);

        oscillator1.stop(now + 0.25);



        // ---------- SECOND TONE ----------

        const oscillator2 =
            audioContext.createOscillator();

        const gain2 =
            audioContext.createGain();


        oscillator2.type = "sine";

        oscillator2.frequency.setValueAtTime(
            1174,
            now + 0.3
        );


        gain2.gain.setValueAtTime(
            0.0001,
            now + 0.3
        );

        gain2.gain.exponentialRampToValueAtTime(
            0.5,
            now + 0.32
        );

        gain2.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.55
        );


        oscillator2.connect(gain2);

        gain2.connect(audioContext.destination);


        oscillator2.start(now + 0.3);

        oscillator2.stop(now + 0.55);


        console.log("🔊 Alert sound played");

    } catch (error) {

        console.error(
            "🔇 Could not play alert sound:",
            error
        );

    }
}
// ================= FIREBASE CONFIG =================

// Paste YOUR firebaseConfig values from Firebase Console here.

const firebaseConfig = {
    apiKey:"AIzaSyAIXIvHlrk_IAhazAi5Iuj1F30K0CB9114",
    authDomain:  "accident-detector-576d7.firebaseapp.com",
    projectId:"accident-detector-576d7",
    storageBucket: "accident-detector-576d7.firebasestorage.app",
    messagingSenderId: "964966609672",
    appId: "1:964966609672:web:44d2e8122e54b7f55632bd"
};


// ================= INITIALIZE FIREBASE =================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const POLICE_EMAIL = "police.dashboard@gmail.com";
const POLICE_PASSWORD = "project123";

async function loginDashboard() {
    try {
        await signInWithEmailAndPassword(
            auth,
            POLICE_EMAIL,
            POLICE_PASSWORD
        );

        console.log("Police dashboard login successful!");

        loadAccidentAlerts();

    } catch (error) {
        console.error("Dashboard login failed:", error);
    }
}
console.log("Firebase connected successfully!");


// ================= LOAD ACCIDENT ALERTS =================

function loadAccidentAlerts() {

    const alertsRef = collection(db, "accident_alerts");

    const alertsQuery = query(
        alertsRef,
        orderBy("timestamp", "desc")
    );

    onSnapshot(
        alertsQuery,

        (snapshot) => {

            console.log(
                "Accident alerts received:",
                snapshot.size
            );
            // ================= NEW ALERT SOUND =================

if (initializedAlerts) {
    const newAlerts = snapshot.docChanges().filter(
        change => change.type === "added"
    );

    if (newAlerts.length > 0) {
        console.log("🚨 NEW ACCIDENT ALERT RECEIVED");

        playAlertSound();
    }
}

initializedAlerts = true;


            // ================= UPDATE LOCATION TRACKING =================

            if (!snapshot.empty) {

                const latestAlert =
                    snapshot.docs[0].data();

                const trackingLocation =
                    document.getElementById("trackingLocation");

                const trackingMapButton =
                    document.getElementById("trackingMapButton");


                if (
                    latestAlert.latitude !== undefined &&
                    latestAlert.longitude !== undefined
                ) {
trackingLocation.textContent =
    latestAlert.location ||
    `${Number(latestAlert.latitude).toFixed(6)}, ` +
    `${Number(latestAlert.longitude).toFixed(6)}`;


                    trackingMapButton.style.display =
                        "inline-block";


                    trackingMapButton.onclick =
                        function () {

                            const mapUrl =
                                `https://www.google.com/maps?q=` +
                                `${latestAlert.latitude},${latestAlert.longitude}`;

                            window.open(
                                mapUrl,
                                "_blank"
                            );
                        };


                } else {

                    trackingLocation.textContent =
                        "Location unavailable";

                    trackingMapButton.style.display =
                        "none";
                }


            } else {

                document.getElementById(
                    "trackingLocation"
                ).textContent =
                    "No accident location available";


                document.getElementById(
                    "trackingMapButton"
                ).style.display =
                    "none";
            }


            // ================= ALERT TABLE =================

            const alertsTable =
                document.getElementById("alertsTable");


            alertsTable.innerHTML = "";


            if (snapshot.empty) {

                alertsTable.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-alerts">
                            No accident alerts available
                        </td>
                    </tr>
                `;

                updateStatistics(0);

                return;
            }


            let activeCount = 0;

            let locationCount = 0;

            let totalContacts = 0;


            snapshot.forEach((doc) => {

                const alert = doc.data();


                // Count active alerts
                if (alert.status === "Active") {
                    activeCount++;
                }


                // Count alerts with location
                if (
                    alert.latitude !== undefined &&
                    alert.longitude !== undefined
                ) {
                    locationCount++;
                }


                // Count emergency contacts
                if (Array.isArray(alert.contacts)) {
                    totalContacts +=
                        alert.contacts.length;
                }


                // Create table row
                const row =
                    document.createElement("tr");


                const status =
                    alert.status || "Unknown";

const location =
    alert.location ||
    (
        alert.latitude !== undefined &&
        alert.longitude !== undefined

            ? `${Number(alert.latitude).toFixed(4)}, ` +
              `${Number(alert.longitude).toFixed(4)}`

            : "Unavailable"
    );

                const alertTime =
                    formatTimestamp(
                        alert.timestamp
                    );


                row.innerHTML = `

                    <td>
                        <span class="status-badge">
                            ${status}
                        </span>
                    </td>

                    <td>
                        User
                    </td>

                    <td>
                        ${location}
                    </td>

                    <td>
                        ${alertTime}
                    </td>

                    <td>
                        <button
                            class="refresh-button"
                            onclick="viewAlert('${doc.id}')">
                            👁 View
                        </button>
                    </td>

                `;


                alertsTable.appendChild(row);

            });


            // ================= DASHBOARD STATS =================

            document.getElementById(
                "activeAlerts"
            ).textContent =
                activeCount;


            document.getElementById(
                "locations"
            ).textContent =
                locationCount;


            document.getElementById(
                "contacts"
            ).textContent =
                totalContacts;


            document.getElementById(
                "totalAlerts"
            ).textContent =
                snapshot.size;


            // ================= ALERT TREND =================

            const alertCountsByDate = {};


            snapshot.forEach((doc) => {

                const alert = doc.data();


                if (alert.timestamp) {

                    const date =
                        alert.timestamp.toDate();


                    const dateKey =
                        date.toLocaleDateString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }
                        );


                    if (
                        !alertCountsByDate[dateKey]
                    ) {
                        alertCountsByDate[dateKey] =
                            0;
                    }


                    alertCountsByDate[dateKey]++;
                }

            });


            const trendLabels =
                Object.keys(
                    alertCountsByDate
                );


            const trendData =
                Object.values(
                    alertCountsByDate
                );


            const chartCanvas =
                document.getElementById(
                    "alertTrendChart"
                );


            if (chartCanvas) {

    // Destroy previous chart if it exists
    if (window.alertTrendChart instanceof Chart) {
        window.alertTrendChart.destroy();
    }

    window.alertTrendChart = new Chart(chartCanvas, {
        type: "line",

        data: {
            labels: trendLabels,

            datasets: [{
                label: "Accident Alerts",
                data: trendData,
                borderWidth: 2,
                tension: 0.3,
                fill: false
            }]
        },

        options: {
            responsive: true,

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

            // ================= STORE ALERT DATA =================

            window.accidentAlerts =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );


            console.log(
                "Dashboard statistics updated:",
                {
                    activeCount,
                    locationCount,
                    totalContacts,
                    totalAlerts:
                        snapshot.size
                }
            );

        },


        // ================= FIRESTORE ERROR =================

        (error) => {

            console.error(
                "Error loading accident alerts:",
                error
            );

        }
    );
}



function formatTimestamp(timestamp) { 
    if (!timestamp) { return "Unavailable"; } 
    const date = timestamp.toDate();
     return date.toLocaleString( "en-IN", { day: "2-digit", month: "short", year: "numeric",
         hour: "2-digit", minute: "2-digit"

      } 
    );
 }
async function loadEmergencyContacts() {
    const tableBody =
        document.getElementById("contactsTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="4">
                Loading contacts...
            </td>
        </tr>
    `;

    try {
        const usersSnapshot =
            await getDocs(collection(db, "users"));

        let rows = "";

        for (const userDoc of usersSnapshot.docs) {

            const userId = userDoc.id;

            const contactsRef = collection(
                db,
                "users",
                userId,
                "contacts"
            );

            const contactsSnapshot =
                await getDocs(contactsRef);

            contactsSnapshot.forEach((contactDoc) => {

                const contact =
                    contactDoc.data();

                const createdAt =
                    contact.createdAt?.toDate
                        ? contact.createdAt.toDate()
                        : null;

                const addedOn =
                    createdAt
                        ? createdAt.toLocaleString()
                        : "Unknown";

                rows += `
                    <tr>
                        <td>${userId}</td>

                        <td>
                            ${contact.name || "Unknown"}
                        </td>

                        <td>
                            ${contact.phone || "Unknown"}
                        </td>

                        <td>
                            ${addedOn}
                        </td>
                    </tr>
                `;
            });
        }

        if (rows === "") {
            rows = `
                <tr>
                    <td colspan="4">
                        No emergency contacts found.
                    </td>
                </tr>
            `;
        }

        tableBody.innerHTML = rows;

    } catch (error) {

        console.error(
            "Error loading emergency contacts:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load contacts.
                </td>
            </tr>
        `;
    }
}
// ================= UPDATE STATISTICS =================

function updateStatistics(count) {

    document.getElementById("activeAlerts").textContent = 0;

    document.getElementById("locations").textContent = 0;

    document.getElementById("contacts").textContent = 0;

    document.getElementById("totalAlerts").textContent = count;
}


// ================= VIEW ALERT =================

window.viewAlert = function (alertId) {

    const alert =
        window.accidentAlerts.find(
            item => item.id === alertId
        );


    if (!alert) {
        return;
    }


    console.log("Selected alert:", alert);


    const details =
        document.getElementById("alertDetails");


    details.style.display = "block";


    details.scrollIntoView({
        behavior: "smooth"
    });


    document.getElementById("detailContacts").textContent =
        Array.isArray(alert.contacts)
            ? alert.contacts.join(", ")
            : "None";


    document.getElementById("detailAlertTime").textContent =
        formatTimestamp(alert.timestamp);


    document.getElementById("detailStatus").textContent =
        alert.status || "Unknown";


    if (
        alert.latitude !== undefined &&
        alert.longitude !== undefined
    ) {

        document.getElementById("detailLocation").textContent =
    alert.location ||
    `${Number(alert.latitude).toFixed(6)}, ${Number(alert.longitude).toFixed(6)}`;

        const mapButton =
            document.getElementById("mapButton");


        mapButton.onclick = function () {

            const mapUrl =
                `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;

            window.open(
                mapUrl,
                "_blank"
            );

        };

    } else {

        document.getElementById("detailLocation").textContent =
            "Location unavailable";

    }

loadUserDetails(alert.userId);
    // User information will be loaded
    // from users/{userId} in the next step.
};

    // ================= LOAD USER INFORMATION =================

async function loadUserDetails(userId) {

    try {

        if (!userId) {
            console.error("No userId found in alert.");
            return;
        }

        const userRef = doc(db, "users", userId);

        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {

            console.error("User document not found:", userId);

            document.getElementById("detailName").textContent =
                "User not found";

            return;
        }

        const user = userSnapshot.data();

        console.log("User details received:", user);

        document.getElementById("detailName").textContent =
            user.name || "—";

        document.getElementById("detailAgeDob").textContent =
            user.dob || "—";

        document.getElementById("detailGender").textContent =
            user.gender || "—";

        document.getElementById("detailPhone").textContent =
            user.phone || "—";

        document.getElementById("detailAddress").textContent =
            user.address || "—";

        document.getElementById("detailBloodGroup").textContent =
            user.bloodGroup || "—";

        document.getElementById("detailMedical").textContent =
            user.medicalConditions || "None";

        document.getElementById("detailAllergies").textContent =
            user.allergies || "None";

    } catch (error) {

        console.error(
            "Error loading user details:",
            error
        );

    }
}




// ================= CLOSE DETAILS =================

window.closeAlertDetails = function () {

    document.getElementById(
        "alertDetails"
    ).style.display = "none";

};


// ================= REFRESH =================

window.refreshAlerts = function () {
    loadAccidentAlerts();
};


// ================= START =================

loginDashboard();


// ================= SIDEBAR NAVIGATION =================

document.addEventListener("DOMContentLoaded", function () {

    const dashboardStatsSection =
        document.getElementById("dashboardStatsSection");

    const liveAlertsSection =
        document.getElementById("liveAlertsSection");

    const locationTrackingSection =
        document.getElementById("locationTrackingSection");

    const contactsSection =
        document.getElementById("contactsSection");

    const analyticsSection =
        document.getElementById("analyticsSection");

    const alertDetails =
        document.getElementById("alertDetails");

    const dashboardNav =
        document.getElementById("dashboardNav");

    const liveAlertsNav =
        document.getElementById("liveAlertsNav");

    const locationTrackingNav =
        document.getElementById("locationTrackingNav");

    const contactsNav =
        document.getElementById("contactsNav");

    const analyticsNav =
        document.getElementById("analyticsNav");

    const navItems =
        document.querySelectorAll(".nav-item");


    // ================= HIDE ALL SECTIONS =================

    function hideAllSections() {

        dashboardStatsSection.style.display = "none";

        liveAlertsSection.style.display = "none";

        locationTrackingSection.style.display = "none";

        contactsSection.style.display = "none";

        analyticsSection.style.display = "none";

        alertDetails.style.display = "none";
    }


    // ================= SET ACTIVE NAVIGATION =================

    function setActiveNav(clickedNav) {

        navItems.forEach(function (item) {

            item.classList.remove("active");

        });

        clickedNav.classList.add("active");
    }


    // ================= DASHBOARD =================

    dashboardNav.addEventListener("click", function (event) {

        event.preventDefault();

        hideAllSections();

        dashboardStatsSection.style.display = "";

        liveAlertsSection.style.display = "";

        setActiveNav(this);
    });


    // ================= LIVE ALERTS =================

    liveAlertsNav.addEventListener("click", function (event) {

        event.preventDefault();

        hideAllSections();

        liveAlertsSection.style.display = "";

        setActiveNav(this);
    });


    // ================= LOCATION TRACKING =================

    locationTrackingNav.addEventListener("click", function (event) {

        event.preventDefault();

        hideAllSections();

        locationTrackingSection.style.display = "";

        setActiveNav(this);
    });


    // ================= CONTACTS =================

    contactsNav.addEventListener("click", function (event) {

        event.preventDefault();

        hideAllSections();

        contactsSection.style.display = "";

        loadEmergencyContacts();

        setActiveNav(this);
    });


    // ================= ANALYTICS =================

    analyticsNav.addEventListener("click", function (event) {

        event.preventDefault();

        hideAllSections();

        analyticsSection.style.display = "";

        setActiveNav(this);
    });


    // ================= DEFAULT PAGE =================

    hideAllSections();

    dashboardStatsSection.style.display = "";

    liveAlertsSection.style.display = "";

    dashboardNav.classList.add("active");

});


// ================= MAKE FUNCTIONS AVAILABLE TO HTML =================

window.loadAccidentAlerts = loadAccidentAlerts;

window.refreshAlerts = function () {

    loadAccidentAlerts();

};