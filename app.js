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

// 🔒 আপনার ব্যক্তিগত অ্যাডমিন আইডি লক
const MASTER_ADMIN_ID = "5769465864"; 

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let userId = "";
let fullName = "";
let userHandle = "";

const user = tg.initDataUnsafe?.user;

if (user && user.id) {
    userId = String(user.id);
    fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Telegram User";
    userHandle = user.username ? "@" + user.username : "@" + fullName.toLowerCase().replace(/\s+/g, '') + "_user";
} else {
    userId = "8041708413"; 
    fullName = "টেলিগ্রাম লিংক View";
    userHandle = "@open_via_bot_link";
}

document.getElementById('user-name').innerText = fullName;
document.getElementById('user-handle').innerText = userHandle;
document.getElementById('user-tgid').innerText = "ID: " + userId;

// প্রিমিয়াম অবতার মেকার (নামের প্রথম অক্ষর দিয়ে কালারফুল লোগো জেনারেট করবে)
document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=0ea5e9`;

// 🛡️ অ্যাডমিন প্যানেল সিকিউরিটি কন্ট্রোল
const isAdmin = (String(userId) === MASTER_ADMIN_ID);
if (isAdmin) {
    document.getElementById('admin-indicator').style.display = "block";
    document.getElementById('admin-nav-btn').style.display = "flex";
    document.getElementById('admin-lock-screen').style.display = "none";
    document.getElementById('admin-allowed-content').style.display = "block";
}

// 📅 ইউজারের লাইভ ব্যালেন্স ও জয়েনিং ডেট চেক
let currentUserDoc = db.collection("users").doc(userId);
let activeTaskId = "";
let base64FileData = null; 

currentUserDoc.onSnapshot((doc) => {
    let today = new Date().toLocaleDateString('bn-BD'); 
    if (!doc.exists) {
        currentUserDoc.set({ 
            name: fullName, 
            username: userHandle, 
            points: 0, 
            usdt: 0, 
            completed: [],
            joinedDate: today 
        });
        document.getElementById('user-joined').innerText = "Joined: " + today;
    } else {
        let data = doc.data();
        document.getElementById('user-points').innerText = data.points;
        document.getElementById('user-usdt').innerText = "$" + (data.usdt || 0).toFixed(2);
        document.getElementById('user-joined').innerText = "Joined: " + (data.joinedDate || today);
    }
});

// টাস্ক ডাটাবেজ থেকে লোড করা
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
    base64FileData = null;
    document.getElementById('submit-proof-btn').disabled = false;
    document.getElementById('submit-proof-btn').innerText = "প্রমাণ জমা দিন";
}

// ফাইল রিড মেকানিজম (লোকাল ফাইল প্রসেস)
function handleFileSelected() {
    const fileInput = document.getElementById('proof-file');
    if(fileInput.files.length > 0) {
        const file = fileInput.files[0];
        document.getElementById('file-status').innerText = "✓ " + file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            base64FileData = e.target.result.split(',')[1]; 
        };
        reader.readAsDataURL(file);
    }
}

// 🚀 ফ্রি এবং সেফ ইমেজ হোস্টিং এপিআই সিস্টেম (ফায়ারবেস স্টোরেজ বাইপাস)
function submitTaskProof() {
    let details = document.getElementById('proof-text').value;
    if(!details) return alert("দয়া করে প্রুফ ডিটেইলস লিখুন!");
    if(!base64FileData) return alert("দয়া করে স্ক্রিনশট ফাইল সিলেক্ট করুন!");

    let btn = document.getElementById('submit-proof-btn');
    btn.disabled = true;
    btn.innerText = "ফাইল ভেরিফাই হচ্ছে...";

    let formData = new FormData();
    formData.append("image", base64FileData);

    // ফ্রি প্রফেশনাল ইমেজ ক্লাউড এপিআই ব্যবহার
    fetch("https://api.imgbb.com/1/upload?key=8e6840d86937e75e52c78daec535f206", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        if(response.success) {
            let liveImageUrl = response.data.url; 

            // ফায়ারবেস ফায়ারস্টোর ডাটাবেজে সাবমিশন ডাটা পুশ
            db.collection("submissions").add({
                userId: userId,
                userName: fullName,
                taskId: activeTaskId,
                taskTitle: document.getElementById('modal-task-title').innerText,
                details: details,
                proofImage: liveImageUrl, 
                status: "Pending",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("আপনার প্রমাণপত্র এবং স্ক্রিনশট সফলভাবে সাবমিট হয়েছে!");
                closeModal();
            });
        } else {
            throw new Error("API Error");
        }
    })
    .catch(error => {
        alert("সার্ভার ওভারলোড! ফাইল আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        btn.disabled = false;
        btn.innerText = "প্রমাণ জমা দিন";
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

// 🛡️ অ্যাডমিন প্যানেলে রিয়েল ইমেজ শো করা
if (isAdmin) {
    db.collection("submissions").where("status", "==", "Pending").onSnapshot(snapshot => {
        let container = document.getElementById('admin-proofs-container');
        container.innerHTML = "";
        snapshot.forEach(doc => {
            let data = doc.data();
            container.innerHTML += `
                <div class="admin-review-box" style="border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #1e293b;">
                    <div class="review-meta">
                        <h5>ইউজার: ${data.userName} (ID: ${data.userId})</h5>
                        <p class="target-mission" style="color: #38bdf8;">টাস্ক: ${data.taskTitle}</p>
                        <p class="proof-string">ইউজার টেক্সট: "${data.details}"</p>
                        <div style="margin: 10px 0;">
                            <a href="${data.proofImage}" target="_blank">
                                <img src="${data.proofImage}" alt="Proof" style="width: 100%; max-width: 200px; border-radius: 6px; border: 1px solid #475569;">
                            </a>
                            <br><small style="color: #94a3b8;">(ছবিতে ক্লিক করলে বড় করে দেখা যাবে)</small>
                        </div>
                    </div>
                    <div class="review-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn-approve" style="background: #22c55e; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;" onclick="reviewProof('${doc.id}', 'Approved', '${data.userId}', '${data.taskId}')">Approve</button>
                        <button class="btn-reject" style="background: #ef4444; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;" onclick="reviewProof('${doc.id}', 'Rejected', '${data.userId}', '${data.taskId}')">Reject</button>
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