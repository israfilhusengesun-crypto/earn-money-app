const firebaseConfig = {
  apiKey: "AIzaSyAbdhyQURS3MeQzbWWAHFlvBaOdtBUcGeY",
  authDomain: "earn-money-29bc4.firebaseapp.com",
  projectId: "earn-money-29bc4",
  storageBucket: "earn-money-29bc4.firebasestorage.app",
  messagingSenderId: "485544910382",
  appId: "1:485544910382:web:3d9b1a2c51799884de49bf"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🔒 আপনার ব্যক্তিগত আইডি লক সিস্টেম
const MASTER_ADMIN_ID = "5769465864"; 

const tg = window.Telegram.WebApp;
tg.ready(); // টেলিগ্রাম অ্যাপকে রেডি সিগন্যাল পাঠানো
tg.expand();

// টেলিগ্রাম রিয়েল ডাটা এক্সট্রাকশন
const user = tg.initDataUnsafe?.user;
let userId = "";
let fullName = "";
let userHandle = "";

if (user && user.id) {
    // বটের ভেতর থেকে ঢুকলে আসল ডাটা লোড হবে
    userId = String(user.id);
    fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Telegram User";
    userHandle = user.username ? "@" + user.username : "@no_username";
    
    // ইউজারের নামের প্রথম অক্ষর দিয়ে সুন্দর অবতার তৈরি
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=0ea5e9`;
} else {
    // কোড আপডেট হয়েছে কিনা তা ধরার জন্য এই টেস্ট ডাটাটি দেখতে পাবেন
    userId = "8041708413"; 
    fullName = "টেলিগ্রাম লিংক ভিউ";
    userHandle = "@open_via_bot_link";
    document.getElementById('user-avatar').src = "https://api.dicebear.com/7.x/initials/svg?seed=Syncrow&backgroundColor=334155";
}

document.getElementById('user-name').innerText = fullName;
document.getElementById('user-handle').innerText = userHandle;
document.getElementById('user-tgid').innerText = "ID: " + userId;

// 🛡️ অ্যাডমিন সিকিউরিটি ও বাটন ভিজিবিলিটি লক
const isAdmin = (String(userId) === MASTER_ADMIN_ID);
if (isAdmin) {
    document.getElementById('admin-indicator').style.display = "block";
    document.getElementById('admin-nav-btn').style.display = "flex";
    document.getElementById('admin-lock-screen').style.display = "none";
    document.getElementById('admin-allowed-content').style.display = "block";
}

let currentUserDoc = db.collection("users").doc(userId);
let activeTaskId = "";

currentUserDoc.onSnapshot((doc) => {
    if (!doc.exists) {
        currentUserDoc.set({ name: fullName, username: userHandle, points: 0, usdt: 0, completed: [] });
    } else {
        let data = doc.data();
        document.getElementById('user-points').innerText = data.points;
        document.getElementById('user-usdt').innerText = "$" + (data.usdt || 0).toFixed(2);
    }
});

// লাইভ টাস্ক লোড করা
db.collection("tasks").onSnapshot(snapshot => {
    let container = document.getElementById('tasks-container');
    container.innerHTML = "";
    snapshot.forEach(doc => {
        let task = doc.data();
        container.innerHTML += `
            <div class="task-card-row" onclick="openTaskModal('${doc.id}', '${task.title}', ${task.reward}, '${task.link}')">
                <div class="task-main-info">
                    <h4>${task.title}</h4>
                    <p>Verification Active</p>
                </div>
                <span class="pts-pill">+${task.reward} PTS</span>
            </div>
        `;
    });
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    const eventTarget = window.event?.currentTarget;
    if (eventTarget && eventTarget.classList.contains('nav-item')) {
        eventTarget.classList.add('active');
    }
}

function openTaskModal(id, title, reward, link) {
    activeTaskId = id;
    document.getElementById('modal-task-title').innerText = title;
    document.getElementById('modal-task-reward').innerText = `+${reward} PTS`;
    document.getElementById('modal-task-link').onclick = () => window.open(link, '_blank');
    document.getElementById('task-modal').style.display = "block";
}

function closeModal() {
    document.getElementById('task-modal').style.display = "none";
    document.getElementById('proof-text').value = "";
    document.getElementById('file-status').innerText = "📷 প্রুফ স্ক্রিনশট সিলেক্ট করুন";
}

function handleFileSelected() {
    document.getElementById('file-status').innerText = "✓ স্ক্রিনশট লোড হয়েছে";
}

function submitTaskProof() {
    let details = document.getElementById('proof-text').value;
    if(!details) return alert("দয়া করে প্রুফ ডিটেইলস লিখুন!");

    db.collection("submissions").add({
        userId: userId,
        userName: fullName,
        taskId: activeTaskId,
        taskTitle: document.getElementById('modal-task-title').innerText,
        details: details,
        status: "Pending",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("আপনার প্রমাণপত্র অ্যাডমিনের কাছে পাঠানো হয়েছে!");
        closeModal();
    });
}

function convertPoints() {
    let pts = parseInt(document.getElementById('convert-points').value);
    if(pts >= 1000) {
        currentUserDoc.get().then(doc => {
            if(doc.data().points >= pts) {
                let gainUsdt = pts / 1000;
                currentUserDoc.update({
                    points: firebase.firestore.FieldValue.increment(-pts),
                    usdt: firebase.firestore.FieldValue.increment(gainUsdt)
                });
                alert("পয়েন্ট সফলভাবে ডলারে (USDT) কনভার্ট হয়েছে!");
            } else alert("আপনার ব্যালেন্সে পর্যাপ্ত পয়েন্ট নেই!");
        });
    } else alert("সর্বনিম্ন ১০০০ পয়েন্ট কনভার্ট করতে পারবেন।");
}

if (isAdmin) {
    db.collection("submissions").where("status", "==", "Pending").onSnapshot(snapshot => {
        let container = document.getElementById('admin-proofs-container');
        container.innerHTML = "";
        snapshot.forEach(doc => {
            let data = doc.data();
            container.innerHTML += `
                <div class="admin-review-box">
                    <div class="review-meta">
                        <h5>ইউজার: ${data.userName}</h5>
                        <p class="target-mission">টাস্ক: ${data.taskTitle}</p>
                        <p class="proof-string">ইউজার টেক্সট: "${data.details}"</p>
                    </div>
                    <div class="review-actions">
                        <button class="btn-approve" onclick="reviewProof('${doc.id}', 'Approved', '${data.userId}', '${data.taskId}')">Approve</button>
                        <button class="btn-reject" onclick="reviewProof('${doc.id}', 'Rejected', '${data.userId}', '${data.taskId}')">Reject</button>
                    </div>
                </div>
            `;
        });
    });
}

function publishTask() {
    let title = document.getElementById('adm-task-title').value;
    let reward = parseInt(document.getElementById('adm-task-reward').value);
    let link = document.getElementById('adm-task-link').value;

    if(!title || !reward || !link) return alert("সবগুলো বক্স ফিলাপ করুন!");

    db.collection("tasks").add({ title, reward, link })
    .then(() => {
        alert("নতুন টাস্ক লাইভ করা হয়েছে!");
        document.getElementById('adm-task-title').value = '';
        document.getElementById('adm-task-reward').value = '';
        document.getElementById('adm-task-link').value = '';
    });
}

function reviewProof(subId, status, targetUserId, targetTaskId) {
    db.collection("submissions").doc(subId).update({ status: status })
    .then(() => {
        if(status === "Approved") {
            db.collection("tasks").doc(targetTaskId).get().then(taskDoc => {
                let reward = taskDoc.data().reward;
                db.collection("users").doc(targetUserId).update({
                    points: firebase.firestore.FieldValue.increment(reward),
                    completed: firebase.firestore.FieldValue.arrayUnion(targetTaskId)
                });
            });
        }
        alert(`কাজটি ${status} করা হয়েছে!`);
    });
}