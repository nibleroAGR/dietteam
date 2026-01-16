// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD0HVBIo7ofBPpGW5g-lFTO8g3pft_qwBE",
    authDomain: "dietteam-d51ea.firebaseapp.com",
    projectId: "dietteam-d51ea",
    storageBucket: "dietteam-d51ea.firebasestorage.app",
    messagingSenderId: "113448905720",
    appId: "1:113448905720:web:8adc774a777284d0e7040d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Phrases (50 Motivational Phrases) ---
const phrases = [
    // Health (Salud)
    "Tu cuerpo es tu templo, cuídalo con buena comida.",
    "Cada paso cuenta para un corazón más fuerte.",
    "Comer sano no es un castigo, es un regalo para tu futuro.",
    "Invertir en salud hoy es ahorrar en medicina mañana.",
    "Tu salud es la verdadera riqueza.",
    "Dormir bien y comer limpio: la base de la longevidad.",
    "Menos procesados, más energía real.",
    "La hidratación es la clave del rendimiento.",
    "Escucha a tu cuerpo, él sabe lo que necesita.",
    "La salud no se trata de lo que pierdes, sino de lo que ganas.",
    "Mejora tu digestión eligiendo alimentos naturales.",
    "Un sistema inmune fuerte empieza en tu plato.",
    "No es una dieta, es un estilo de vida saludable.",
    "Tu corazón te agradecerá cada elección nutritiva.",
    "La prevención es la mejor cura.",
    "Siente la vitalidad de las frutas y verduras.",
    "Comer bien es una forma de respetarte a ti mismo.",

    // Physical (Físico)
    "La constancia vence a la perfección.",
    "Tus músculos se construyen en la cocina.",
    "Mira al espejo con orgullo por tu esfuerzo diario.",
    "Cada gota de sudor es un paso hacia tu meta.",
    "No busques resultados rápidos, busca cambios duraderos.",
    "Tu ropa te quedará mejor, pero tu confianza brillará más.",
    "Transforma tu cuerpo, transforma tu confianza.",
    "La disciplina es hacer lo que debes incluso cuando no quieres.",
    "Tu físico es el reflejo de tus hábitos diarios.",
    "Pequeños cambios, grandes transformaciones visuales.",
    "Siente la ligereza de un cuerpo bien alimentado.",
    "No te compares con otros, compárate con quien fuiste ayer.",
    "Define tus metas, esculpe tu camino.",
    "Entrenar es un acto de amor propio.",
    "Tu postura y tu brillo físico mejoran con cada elección sana.",
    "La energía que proyectas empieza en lo que consumes.",
    "Ganar salud es el mejor cambio físico.",
    "Tu fuerza crece cada vez que dices 'no' a lo que no te hace bien.",

    // Mood (Estado de Ánimo)
    "Mente sana en cuerpo sano.",
    "La comida real mejora tu claridad mental.",
    "Menos azúcar, menos ansiedad.",
    "Siente la dopamina natural de cumplir tus metas.",
    "Tu estado de ánimo florece con la nutrición adecuada.",
    "La disciplina te da paz mental.",
    "Eres capaz de mucho más de lo que imaginas.",
    "Hoy es un gran día para cuidar de ti.",
    "La calma interior empieza con un cuerpo en equilibrio.",
    "Sonríe, tu progreso es real y valioso.",
    "La motivación te pone en marcha, el hábito te mantiene.",
    "Libera el estrés a través del movimiento.",
    "Tu confianza crece con cada decisión saludable.",
    "El optimismo es el mejor condimento para tu comida.",
    "Cuidarte te hace sentir increíblemente bien.",
    "Celebra tus victorias, por pequeñas que sean.",
    "La felicidad se cocina a fuego lento con buenos hábitos.",
    "Eres el arquitecto de tu propio bienestar.",
    "Un día a la vez, una comida a la vez, una sonrisa a la vez."
];

// --- State ---
let currentUser = null;
let userData = null;
let weightChart = null;
let activeChatFriendId = null;
let chatUnsubscribe = null;

// --- DOM ---
const views = ['auth-section', 'config-section', 'dashboard-section', 'diary-section', 'social-section', 'chat-section', 'comparison-section', 'profile-section'];
const quoteEl = document.getElementById('motivational-quote');

function showView(viewId, isComparison = false) {
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add('hidden');
    });
    document.querySelectorAll('[id^=nav-]').forEach(el => el.classList.remove('active'));

    const activeView = document.getElementById(viewId);
    if (activeView) activeView.classList.remove('hidden');

    if (viewId === 'dashboard-section') {
        updateQuote();
        if (!isComparison) loadWeightData();
        document.querySelectorAll('[id^=nav-dashboard]').forEach(b => b.classList.add('active'));
    }
    if (viewId === 'diary-section') {
        loadDiaryData();
        updateQuickAddDisplay();
        updateDailyAverage();
        document.querySelectorAll('[id^=nav-diary]').forEach(b => b.classList.add('active'));
    }
    if (viewId === 'social-section') {
        loadFriendsData();
        document.querySelectorAll('[id^=nav-social]').forEach(b => b.classList.add('active'));
    }
    if (viewId === 'profile-section') {
        loadProfileData();
        document.querySelectorAll('[id^=nav-profile]').forEach(b => b.classList.add('active'));
    }

    if (chatUnsubscribe && viewId !== 'chat-section') {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }
}

function updateQuote() {
    if (!quoteEl) return;
    const randomIdx = Math.floor(Math.random() * phrases.length);
    quoteEl.innerText = `"${phrases[randomIdx]}"`;
}

// --- Auth ---
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!auth) return alert("Configura Firebase primero.");
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const authTitle = document.getElementById('auth-title');
        const isSignup = authTitle && authTitle.innerText.includes("Crea");

        const btn = document.getElementById('auth-btn');
        const originalText = btn.innerText;
        btn.innerText = "Cargando...";
        btn.disabled = true;

        try {
            if (isSignup) {
                console.log("Intentando REGISTRO para:", email);
                await auth.createUserWithEmailAndPassword(email, password);
                console.log("Usuario registrado con éxito");
            } else {
                console.log("Intentando LOGIN para:", email);
                await auth.signInWithEmailAndPassword(email, password);
                console.log("Inicio de sesión exitoso");
            }
        } catch (err) {
            console.error("Error de Firebase:", err.code, err.message);
            let mensaje = "Error: ";
            if (err.code === 'auth/invalid-credential') {
                mensaje += "Credenciales inválidas. Si te estás registrando, asegúrate de que el usuario no exista. Si estás entrando, revisa tu correo y clave.";
            } else if (err.code === 'auth/email-already-in-use') {
                mensaje += "Este correo ya está registrado. Intenta iniciar sesión.";
            } else if (err.code === 'auth/weak-password') {
                mensaje += "La contraseña es muy corta (mínimo 6 caracteres).";
            } else {
                mensaje += err.message;
            }
            alert(mensaje);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}

// --- Auth Toggle ---
const toggleAuth = document.getElementById('toggle-auth');

function setAuthMode(isSignup) {
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    if (isSignup) {
        if (title) title.innerText = "Crea tu cuenta";
        if (btn) btn.innerText = "Registrarse";
        if (toggleAuth) {
            toggleAuth.innerHTML = '¿Ya tienes cuenta? <span id="switch-to-login" style="color: var(--primary); cursor: pointer; font-weight: 600;">Inicia Sesión</span>';
            const loginSwitch = document.getElementById('switch-to-login');
            if (loginSwitch) loginSwitch.onclick = () => setAuthMode(false);
        }
    } else {
        if (title) title.innerText = "Bienvenido a DietTeam";
        if (btn) btn.innerText = "Iniciar Sesión";
        if (toggleAuth) {
            toggleAuth.innerHTML = '¿No tienes cuenta? <span id="switch-to-signup" style="color: var(--primary); cursor: pointer; font-weight: 600;">Regístrate</span>';
            const signupSwitch = document.getElementById('switch-to-signup');
            if (signupSwitch) signupSwitch.onclick = () => setAuthMode(true);
        }
    }
}

const signupSwitchInit = document.getElementById('switch-to-signup');
if (signupSwitchInit) signupSwitchInit.onclick = () => setAuthMode(true);

if (auth) {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            checkUserProfile();
        } else {
            currentUser = null;
            showView('auth-section');
        }
    });
}

function updateIMC(weight, height) {
    if (!weight || !height) return;
    const heightInMeters = height / 100;
    const imc = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    const displayImc = document.getElementById('display-imc');
    if (displayImc) {
        displayImc.innerText = imc;
        if (imc < 18.5) displayImc.style.color = "#3b82f6";
        else if (imc < 25) displayImc.style.color = "#10b981";
        else if (imc < 30) displayImc.style.color = "#f59e0b";
        else displayImc.style.color = "#ef4444";
    }
}

async function checkUserProfile() {
    if (!currentUser) return;
    console.log("Comprobando perfil para:", currentUser.uid);
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            console.log("Perfil encontrado, cargando dashboard");
            userData = doc.data();
            const wEl = document.getElementById('display-weight');
            const gEl = document.getElementById('display-goal');
            const uEl = document.getElementById('display-username');
            if (wEl) wEl.innerText = userData.currentWeight;
            if (gEl) gEl.innerText = userData.goalWeight;
            if (uEl) uEl.innerText = userData.username;
            updateIMC(userData.currentWeight, userData.height);
            calculateTotalWeightLoss();
            loadDashboardUpdates();
            showView('dashboard-section');
        } else {
            console.log("Perfil no encontrado, enviando a configuración");
            showView('config-section');
        }
    } catch (err) {
        console.error("Error al comprobar perfil:", err);
        if (err.code === 'permission-denied') {
            alert("Error de permisos en Firestore. Revisa las reglas en la consola de Firebase.");
        } else {
            showView('config-section');
        }
    }
}

let updatesInterval = null;

async function loadDashboardUpdates() {
    const contentEl = document.getElementById('updates-content');
    if (!contentEl) return;
    if (updatesInterval) clearInterval(updatesInterval);

    try {
        const updates = [];
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const friendSnap = await db.collection('friendships').where('users', 'array-contains', currentUser.uid).get();
        const friendIds = [];

        friendSnap.forEach(doc => {
            const f = doc.data();
            if (f.status === 'accepted') {
                const myIdx = f.users.indexOf(currentUser.uid);
                const fIdx = myIdx === 0 ? 1 : 0;
                const fId = f.users[fIdx];
                const fName = f.usernames[fIdx];
                friendIds.push({ id: fId, name: fName, docId: doc.id });
            }
        });

        for (const friend of friendIds) {
            const msgSnap = await db.collection('friendships').doc(friend.docId).collection('messages').orderBy('timestamp', 'desc').limit(1).get();
            if (!msgSnap.empty) {
                const msg = msgSnap.docs[0].data();
                if (msg.sender === friend.id && msg.timestamp && msg.timestamp.toDate() > cutoff) {
                    const timeAgo = Math.floor((Date.now() - msg.timestamp.toDate()) / (1000 * 60 * 60));
                    const timeStr = timeAgo === 0 ? "hace un momento" : `hace ${timeAgo}h`;
                    updates.push({
                        type: 'chat',
                        text: `💬 <b>${friend.name}</b> te escribió ${timeStr}`,
                        ts: msg.timestamp.toDate()
                    });
                }
            }

            const wSnap = await db.collection('weight_history').doc(friend.id).collection('entries').orderBy('date', 'desc').limit(1).get();
            if (!wSnap.empty) {
                const w = wSnap.docs[0].data();
                if (w.date && w.date.toDate() > cutoff) {
                    updates.push({
                        type: 'weight',
                        text: `⚖️ <b>${friend.name}</b> actualizó su peso`,
                        ts: w.date.toDate()
                    });
                }
            }
        }

        updates.sort((a, b) => b.ts - a.ts);
        if (updates.length === 0) {
            contentEl.innerHTML = '<span style="color: var(--text-muted);">Todo tranquilo en tu círculo... 🍃</span>';
            return;
        }

        let idx = 0;
        const showUpdate = () => {
            contentEl.style.opacity = '0';
            setTimeout(() => {
                contentEl.innerHTML = updates[idx].text;
                contentEl.style.opacity = '1';
                idx = (idx + 1) % updates.length;
            }, 500);
        };
        showUpdate();
        if (updates.length > 1) updatesInterval = setInterval(showUpdate, 4000);
    } catch (err) {
        console.error("Error loading updates:", err);
        contentEl.innerText = "Error cargando novedades";
    }
}

// --- Config ---
const configForm = document.getElementById('config-form');
if (configForm) {
    configForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        if (!username) return;
        const userSnap = await db.collection('users').where('username', '==', username).get();
        if (!userSnap.empty) return alert("Este nombre de usuario ya está en uso.");

        const data = {
            username: username,
            currentWeight: parseFloat(document.getElementById('current-weight').value),
            height: parseInt(document.getElementById('height').value),
            goalWeight: parseFloat(document.getElementById('goal-weight').value),
            uid: currentUser.uid,
            badges: [],
            frequentFoods: []
        };

        await db.collection('users').doc(currentUser.uid).set(data);
        await db.collection('weight_history').doc(currentUser.uid).collection('entries').add({
            weight: data.currentWeight,
            date: firebase.firestore.FieldValue.serverTimestamp()
        });
        checkUserProfile();
    };
}

async function calculateTotalWeightLoss() {
    try {
        const snapshot = await db.collection('weight_history').doc(currentUser.uid).collection('entries').orderBy('date', 'asc').limit(1).get();
        if (snapshot.empty) return;
        const initialWeight = snapshot.docs[0].data().weight;
        const currentWeight = userData.currentWeight;
        const diff = currentWeight - initialWeight;
        const el = document.getElementById('display-weight-loss');
        if (!el) return;
        if (Math.abs(diff) < 0.1) { el.innerText = ""; return; }
        const sign = diff > 0 ? '+' : '';
        const color = diff < 0 ? '#10b981' : '#ef4444';
        el.style.color = color;
        el.innerText = `${sign}${diff.toFixed(1)}`;
    } catch (err) { console.error("Error calculating weight loss:", err); }
}

// --- Weight & Chart ---
const weightForm = document.getElementById('weight-form');
if (weightForm) {
    weightForm.onsubmit = async (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('new-weight').value);
        await db.collection('weight_history').doc(currentUser.uid).collection('entries').add({
            weight: weight,
            date: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('users').doc(currentUser.uid).update({ currentWeight: weight });
        userData.currentWeight = weight;
        const wEl = document.getElementById('display-weight');
        if (wEl) wEl.innerText = weight;
        updateIMC(weight, userData.height);
        calculateTotalWeightLoss();
        weightForm.reset();
        loadWeightData();
    };
}

async function loadWeightData() {
    const snapshot = await db.collection('weight_history').doc(currentUser.uid).collection('entries').orderBy('date', 'desc').limit(10).get();
    const datasets = [{
        label: 'Tú',
        data: snapshot.docs.reverse().map(d => d.data().weight),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true, tension: 0.4
    }];
    const labels = snapshot.docs.map(d => d.data().date ? d.data().date.toDate().toLocaleDateString() : 'Hoy');
    renderChart(labels, datasets);
}

function renderChart(labels, datasets) {
    const chartEl = document.getElementById('weightChart');
    if (!chartEl) return;
    const ctx = chartEl.getContext('2d');
    if (weightChart) weightChart.destroy();
    weightChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } },
            plugins: { legend: { display: true, labels: { color: '#333' } } }
        }
    });
}

// --- Nutrition ---
async function updateDailyAverage() {
    const snapshot = await db.collection('food_diary').doc(currentUser.uid).collection('entries').get();
    const dailyTotals = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.date) {
            const day = data.date.toDate().toLocaleDateString();
            dailyTotals[day] = (dailyTotals[day] || 0) + data.calories;
        }
    });
    const totals = Object.values(dailyTotals);
    const avg = totals.length > 0 ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(0) : '--';
    const el = document.getElementById('display-daily-avg');
    if (el) el.innerText = avg;
}

function updateQuickAddDisplay() {
    const container = document.getElementById('quick-add-container');
    if (!container) return;
    const foods = userData.frequentFoods || [];
    if (foods.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = '<p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">Sugerencias:</p>' +
        foods.map(f => `<button class="quick-add-chip" onclick="quickAddFood('${f.name}', ${f.calories})">${f.name} (${f.calories})</button>`).join('');
}

window.quickAddFood = async (name, calories) => {
    await db.collection('food_diary').doc(currentUser.uid).collection('entries').add({
        name: name, calories: calories, date: firebase.firestore.FieldValue.serverTimestamp()
    });
    loadDiaryData();
    updateDailyAverage();
};

const foodForm = document.getElementById('food-form');
if (foodForm) {
    foodForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('food-name').value.trim();
        const calories = parseInt(document.getElementById('food-calories').value);
        await db.collection('food_diary').doc(currentUser.uid).collection('entries').add({
            name: name, calories: calories, date: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (!userData.frequentFoods) userData.frequentFoods = [];
        const exists = userData.frequentFoods.find(f => f.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
            userData.frequentFoods.unshift({ name, calories });
            if (userData.frequentFoods.length > 6) userData.frequentFoods.pop();
            await db.collection('users').doc(currentUser.uid).update({ frequentFoods: userData.frequentFoods });
            updateQuickAddDisplay();
        }
        foodForm.reset();
        loadDiaryData();
        updateDailyAverage();
    };
}

async function loadDiaryData() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const dateEl = document.getElementById('today-date-str');
    if (dateEl) dateEl.innerText = todayStr;
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const snapshot = await db.collection('food_diary').doc(currentUser.uid).collection('entries').orderBy('date', 'desc').get();
    const listToday = document.getElementById('food-list');
    const listHistory = document.getElementById('history-list');
    if (listToday) listToday.innerHTML = '';
    if (listHistory) listHistory.innerHTML = '';
    let totalToday = 0, historyGroups = {};
    snapshot.forEach(doc => {
        const item = doc.data();
        if (!item.date) return;
        const itemDate = item.date.toDate();
        if (itemDate >= startOfToday) {
            totalToday += item.calories;
            if (listToday) listToday.innerHTML += `<div class="food-item"><span>${item.name}</span><span>${item.calories} kcal</span></div>`;
        } else {
            const dateKey = itemDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            historyGroups[dateKey] = (historyGroups[dateKey] || 0) + item.calories;
        }
    });
    const totalEl = document.getElementById('total-cals');
    if (totalEl) totalEl.innerText = totalToday;
    if (listHistory) {
        for (const [date, cals] of Object.entries(historyGroups)) {
            listHistory.innerHTML += `<div class="food-item" style="opacity: 0.8; font-size: 0.9rem;"><span style="font-weight: 600;">${date}</span><span>${cals} kcal</span></div>`;
        }
        if (Object.keys(historyGroups).length === 0) listHistory.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">Sin historial reciente.</p>';
    }
}

// --- Social ---
const friendForm = document.getElementById('friend-form');
if (friendForm) {
    friendForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('friend-username').value.trim();
        if (username === userData.username) return alert("¡No puedes añadirte a ti mismo!");
        const snap = await db.collection('users').where('username', '==', username).get();
        if (snap.empty) return alert("Usuario no encontrado");
        const fData = snap.docs[0].data();
        const existing = await db.collection('friendships').where('users', 'array-contains', currentUser.uid).get();
        if (existing.docs.find(doc => doc.data().users.includes(fData.uid))) return alert("Ya existe una relación o solicitud.");
        await db.collection('friendships').add({
            users: [currentUser.uid, fData.uid],
            usernames: [userData.username, fData.username],
            senderId: currentUser.uid, status: 'pending', timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Solicitud enviada!");
        friendForm.reset();
        loadFriendsData();
    };
}

async function loadFriendsData() {
    const snap = await db.collection('friendships').where('users', 'array-contains', currentUser.uid).get();
    const list = document.getElementById('friends-list');
    const profileList = document.getElementById('profile-friends-list');
    const reqList = document.getElementById('requests-list');

    if (list) list.innerHTML = '';
    if (profileList) profileList.innerHTML = '';
    if (reqList) reqList.innerHTML = '';

    snap.forEach(doc => {
        const f = doc.data();
        const myIdx = f.users.indexOf(currentUser.uid);
        const fIdx = myIdx === 0 ? 1 : 0;

        if (f.status === 'pending' && f.users[1] === currentUser.uid) {
            const senderName = f.usernames[fIdx === 1 ? 0 : 1];
            if (reqList) reqList.innerHTML += `<div class="friend-item request"><span>Solicitud de <b>${senderName}</b></span><div class="friend-actions"><button class="btn-sm" onclick="respondRequest('${doc.id}', 'accepted')">Aceptar</button><button class="btn-sm btn-outline" onclick="respondRequest('${doc.id}', 'rejected')">X</button></div></div>`;
        } else if (f.status === 'accepted') {
            const friendId = f.users[fIdx];
            const friendName = f.usernames[fIdx];

            // Community List (No delete icon)
            if (list) list.innerHTML += `
                <div class="friend-item">
                    <div class="friend-info" onclick="compareWeight('${friendId}', '${friendName}')" style="cursor:pointer">
                        <h4>${friendName}</h4>
                        <p style="font-size: 0.7rem; color: var(--primary-dark);">Ver progreso</p>
                    </div>
                    <div class="friend-actions">
                        <button class="icon-btn" onclick="compareWeight('${friendId}', '${friendName}')" title="Ver Evolución">📈</button>
                        <button class="icon-btn" onclick="startChat('${doc.id}', '${friendName}')" title="Mensajes">💬</button>
                    </div>
                </div>`;

            // Profile List (With delete icon)
            if (profileList) profileList.innerHTML += `
                <div class="friend-item">
                    <div class="friend-info">
                        <h4>${friendName}</h4>
                    </div>
                    <div class="friend-actions">
                        <button class="icon-btn btn-danger" onclick="removeFriend('${doc.id}')" title="Eliminar Amigo">🗑️</button>
                    </div>
                </div>`;
        }
    });
    loadRanking();
}

async function loadRanking() {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    rankingList.innerHTML = '';
    try {
        let usersData = [];
        const getUserLoss = async (uid) => {
            const s = await db.collection('weight_history').doc(uid).collection('entries').orderBy('date', 'asc').get();
            if (s.empty || s.size < 2) return 0;
            return s.docs[0].data().weight - s.docs[s.size - 1].data().weight;
        };
        usersData.push({ name: 'Tú', loss: await getUserLoss(currentUser.uid), isMe: true });
        const fSnap = await db.collection('friendships').where('users', 'array-contains', currentUser.uid).get();
        for (const doc of fSnap.docs) {
            const f = doc.data();
            if (f.status === 'accepted') {
                const myIdx = f.users.indexOf(currentUser.uid);
                const fIdx = myIdx === 0 ? 1 : 0;
                const fid = f.users[fIdx];
                const fname = f.usernames[fIdx];
                usersData.push({ name: fname, loss: await getUserLoss(fid), isMe: false });
            }
        }
        usersData.sort((a, b) => b.loss - a.loss);
        usersData.forEach((u, i) => {
            const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i + 1}`));
            const color = u.loss > 0 ? 'var(--primary)' : '#666';
            rankingList.innerHTML += `<div class="friend-item" style="padding: 10px; ${u.isMe ? 'background: #f0fdf4; border: 1px solid var(--primary);' : ''}"><div style="display:flex; align-items:center; gap:10px;"><span style="font-weight:800; font-size:1.1rem;">${medal}</span><span style="font-weight:600;">${u.name}</span></div><span style="font-weight:bold; color: ${color};">${u.loss > 0 ? '-' : ''}${Math.abs(u.loss).toFixed(1)} kg</span></div>`;
        });
    } catch (e) { console.error("Error ranking", e); }
}

window.respondRequest = async (docId, status) => {
    if (status === 'rejected') await db.collection('friendships').doc(docId).delete();
    else await db.collection('friendships').doc(docId).update({ status: 'accepted' });
    loadFriendsData();
};

window.removeFriend = async (docId) => {
    if (confirm("¿Seguro que quieres eliminar a este amigo?")) {
        await db.collection('friendships').doc(docId).delete();
        loadFriendsData();
    }
};

window.compareWeight = async (friendId, friendName) => {
    showView('comparison-section', true);
    const titleEl = document.getElementById('comparison-title');
    if (titleEl) titleEl.innerText = `Tu progreso vs ${friendName}`;

    const friendNameEl = document.getElementById('comp-friend-name');
    if (friendNameEl) friendNameEl.innerText = friendName;

    // Load Data
    const mySnap = await db.collection('weight_history').doc(currentUser.uid).collection('entries').orderBy('date', 'desc').limit(15).get();
    const fSnap = await db.collection('weight_history').doc(friendId).collection('entries').orderBy('date', 'desc').limit(15).get();

    const myEntries = mySnap.docs.map(d => ({ weight: d.data().weight, date: d.data().date ? d.data().date.toDate() : new Date() }));
    const fEntries = fSnap.docs.map(d => ({ weight: d.data().weight, date: d.data().date ? d.data().date.toDate() : new Date() }));

    // Helper to get friend profile (for goal)
    const fDoc = await db.collection('users').doc(friendId).get();
    const fData = fDoc.data();

    // 1. Chart: Sync Dates
    // Combine all dates and sort
    const allDatesSet = new Set();
    myEntries.forEach(e => allDatesSet.add(e.date.toLocaleDateString()));
    fEntries.forEach(e => allDatesSet.add(e.date.toLocaleDateString()));
    const sortedLabels = Array.from(allDatesSet).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

    const mapToLabels = (entries) => {
        return sortedLabels.map(label => {
            const match = entries.find(e => e.date.toLocaleDateString() === label);
            return match ? match.weight : null; // null keeps line broken or use spanGaps
        });
    };

    const ctx = document.getElementById('comparisonChart').getContext('2d');
    if (window.compChart) window.compChart.destroy();
    window.compChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedLabels,
            datasets: [
                { label: 'Tú', data: mapToLabels(myEntries), borderColor: '#10b981', tension: 0.4, spanGaps: true },
                { label: friendName, data: mapToLabels(fEntries), borderColor: '#3b82f6', tension: 0.4, spanGaps: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Stats Table
    const statsContainer = document.getElementById('comp-stats-container');
    if (statsContainer) {
        const getLoss = (entries) => entries.length > 1 ? (entries[entries.length - 1].weight - entries[0].weight).toFixed(1) : '0.0';

        // Clear previous rows except header
        const header = statsContainer.querySelector('.header');
        statsContainer.innerHTML = '';
        statsContainer.appendChild(header);

        const rows = [
            { label: 'Peso Inicial', me: myEntries[myEntries.length - 1]?.weight || '--', friend: fEntries[fEntries.length - 1]?.weight || '--' },
            { label: 'Peso Actual', me: userData.currentWeight || '--', friend: fData.currentWeight || '--' },
            { label: 'Pérdida Total', me: `${getLoss(myEntries.reverse())} kg`, friend: `${getLoss(fEntries.reverse())} kg` },
            { label: 'Meta', me: userData.goalWeight || '--', friend: fData.goalWeight || '--' }
        ];

        rows.forEach(r => {
            statsContainer.innerHTML += `
                <div class="comp-row">
                    <div class="col-name">${r.label}</div>
                    <div class="col-val">${r.me}</div>
                    <div class="col-val">${r.friend}</div>
                </div>`;
        });
    }
};

// --- Chat ---
window.startChat = async (friendshipId, friendName) => {
    activeChatFriendId = friendshipId;
    const nameEl = document.getElementById('chat-with');
    if (nameEl) nameEl.innerText = `Chat con ${friendName}`;
    showView('chat-section');
    const msgDiv = document.getElementById('messages-container');
    if (msgDiv) msgDiv.innerHTML = '<p class="text-center" style="opacity:0.5">Cargando...</p>';
    if (chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = db.collection('friendships').doc(friendshipId).collection('messages').orderBy('timestamp', 'asc').onSnapshot(snap => {
        if (msgDiv) {
            msgDiv.innerHTML = '';
            snap.forEach(doc => {
                const m = doc.data();
                const isMe = m.sender === currentUser.uid;
                msgDiv.innerHTML += `<div class="message ${isMe ? 'msg-me' : 'msg-them'}">${m.text}</div>`;
            });
            msgDiv.scrollTop = msgDiv.scrollHeight;
        }
    });
};

const chatForm = document.getElementById('chat-form');
if (chatForm) {
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !activeChatFriendId) return;
        await db.collection('friendships').doc(activeChatFriendId).collection('messages').add({
            text: text, sender: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    };
}

// --- Profile ---
async function loadProfileData() {
    if (!userData) return;
    const uEl = document.getElementById('setting-username');
    const wEl = document.getElementById('setting-current-weight');
    const hEl = document.getElementById('setting-height');
    const gEl = document.getElementById('setting-goal');
    const eEl = document.getElementById('profile-email');
    if (uEl) uEl.value = userData.username || '';
    if (wEl) wEl.value = userData.currentWeight || '';
    if (hEl) hEl.value = userData.height || '';
    if (gEl) gEl.value = userData.goalWeight || '';
    if (eEl) eEl.innerText = currentUser.email;

    loadFriendsData(); // Refresh management list
}

const profileForm = document.getElementById('profile-settings-form');
if (profileForm) {
    profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const nU = document.getElementById('setting-username').value.trim();
        const nW = parseFloat(document.getElementById('setting-current-weight').value);
        const nH = parseInt(document.getElementById('setting-height').value);
        const nG = parseFloat(document.getElementById('setting-goal').value);
        if (!nU) return;
        try {
            const ups = {};
            if (nU !== userData.username) {
                const check = await db.collection('users').where('username', '==', nU).get();
                if (!check.empty) return alert("Nombre de usuario ya existe");
                ups.username = nU;
            }
            if (nW !== userData.currentWeight) {
                ups.currentWeight = nW;
                await db.collection('weight_history').doc(currentUser.uid).collection('entries').add({ weight: nW, date: firebase.firestore.FieldValue.serverTimestamp() });
            }
            if (nH !== userData.height) ups.height = nH;
            if (nG !== userData.goalWeight) ups.goalWeight = nG;
            if (Object.keys(ups).length > 0) {
                await db.collection('users').doc(currentUser.uid).update(ups);
                const ref = await db.collection('users').doc(currentUser.uid).get();
                userData = ref.data();
                checkUserProfile();
                alert("Perfil actualizado correctamente");
            }
        } catch (err) { console.error(err); alert("Error actualizando perfil"); }
    };
}

window.logout = () => { if (auth) auth.signOut(); window.location.reload(); };

// --- Navigation ---
function setupNavigation() {
    const navs = ['dashboard', 'diary', 'social', 'profile'];
    navs.forEach(s => {
        document.querySelectorAll(`[id^=nav-${s}]`).forEach(b => {
            b.onclick = () => showView(`${s}-section`);
        });
    });
    const bS = document.getElementById('back-to-social');
    if (bS) bS.onclick = () => showView('social-section');
    const bC = document.getElementById('back-to-social-comp');
    if (bC) bC.onclick = () => showView('social-section');
}
setupNavigation();
