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

// --- Phrases (Same as before) ---
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
const views = ['auth-section', 'config-section', 'dashboard-section', 'diary-section', 'social-section', 'chat-section'];
const quoteEl = document.getElementById('motivational-quote');

function showView(viewId, isComparison = false) {
    views.forEach(v => document.getElementById(v).classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    if (viewId === 'dashboard-section') {
        updateQuote();
        if (!isComparison) loadWeightData();
    }
    if (viewId === 'diary-section') loadDiaryData();
    if (viewId === 'social-section') loadFriendsData();

    if (chatUnsubscribe && viewId !== 'chat-section') {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }
}

function updateQuote() {
    const randomIdx = Math.floor(Math.random() * phrases.length);
    quoteEl.innerText = `"${phrases[randomIdx]}"`;
}

// --- Auth ---
document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    if (!auth) return alert("Configura Firebase primero.");
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const isSignup = document.getElementById('auth-title').innerText.includes("Crea");

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

// --- Auth Toggle ---
const toggleAuth = document.getElementById('toggle-auth');
const switchToSignup = document.getElementById('switch-to-signup');

function setAuthMode(isSignup) {
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    if (isSignup) {
        title.innerText = "Crea tu cuenta";
        btn.innerText = "Registrarse";
        toggleAuth.innerHTML = '¿Ya tienes cuenta? <span id="switch-to-login" style="color: var(--primary); cursor: pointer; font-weight: 600;">Inicia Sesión</span>';
        document.getElementById('switch-to-login').onclick = () => setAuthMode(false);
    } else {
        title.innerText = "Bienvenido a DietTeam";
        btn.innerText = "Iniciar Sesión";
        toggleAuth.innerHTML = '¿No tienes cuenta? <span id="switch-to-signup" style="color: var(--primary); cursor: pointer; font-weight: 600;">Regístrate</span>';
        document.getElementById('switch-to-signup').onclick = () => setAuthMode(true);
    }
}

document.getElementById('switch-to-signup').onclick = () => setAuthMode(true);

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
    displayImc.innerText = imc;

    // Optional: color based on IMC range
    if (imc < 18.5) displayImc.style.color = "#3b82f6"; // Blue (Underweight)
    else if (imc < 25) displayImc.style.color = "#10b981"; // Green (Healthy)
    else if (imc < 30) displayImc.style.color = "#f59e0b"; // Orange (Overweight)
    else displayImc.style.color = "#ef4444"; // Red (Obese)
}

async function checkUserProfile() {
    console.log("Comprobando perfil para:", currentUser.uid);
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            console.log("Perfil encontrado, cargando dashboard");
            userData = doc.data();
            document.getElementById('display-weight').innerText = userData.currentWeight;
            document.getElementById('display-goal').innerText = userData.goalWeight;
            document.getElementById('display-username').innerText = userData.username;
            updateIMC(userData.currentWeight, userData.height);
            showView('dashboard-section');
        } else {
            console.log("Perfil no encontrado, enviando a configuración");
            showView('config-section');
        }
    } catch (err) {
        console.error("Error al comprobar perfil:", err);
        // Si hay un error (ej: permisos), enviamos a config por si acaso o mostramos error
        if (err.code === 'permission-denied') {
            alert("Error de permisos en Firestore. Revisa las reglas en la consola de Firebase.");
        } else {
            showView('config-section');
        }
    }
}

// --- Config ---
document.getElementById('config-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = prompt("Elige un nombre de usuario único:");
    if (!username) return;

    // Check username uniqueness
    const userSnap = await db.collection('users').where('username', '==', username).get();
    if (!userSnap.empty) return alert("Usuario ya existe");

    const data = {
        username: username,
        currentWeight: parseFloat(document.getElementById('current-weight').value),
        height: parseInt(document.getElementById('height').value),
        goalWeight: parseFloat(document.getElementById('goal-weight').value),
        uid: currentUser.uid
    };

    await db.collection('users').doc(currentUser.uid).set(data);
    await db.collection('weight_history').doc(currentUser.uid).collection('entries').add({
        weight: data.currentWeight,
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
    checkUserProfile();
};

// --- Weight & Chart ---
document.getElementById('weight-form').onsubmit = async (e) => {
    e.preventDefault();
    const weight = parseFloat(document.getElementById('new-weight').value);
    await db.collection('weight_history').doc(currentUser.uid).collection('entries').add({
        weight: weight,
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('users').doc(currentUser.uid).update({ currentWeight: weight });
    userData.currentWeight = weight; // Update local state
    document.getElementById('display-weight').innerText = weight;
    updateIMC(weight, userData.height);
    document.getElementById('weight-form').reset();
    loadWeightData();
};

async function loadWeightData() {
    const snapshot = await db.collection('weight_history').doc(currentUser.uid).collection('entries')
        .orderBy('date', 'desc').limit(10).get();

    const datasets = [{
        label: 'Tú',
        data: snapshot.docs.reverse().map(d => d.data().weight),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
    }];

    const labels = snapshot.docs.map(d => d.data().date ? d.data().date.toDate().toLocaleDateString() : 'Hoy');

    // Add friends data if social comparison is active? (Simplified for now)
    renderChart(labels, datasets);
}

function renderChart(labels, datasets) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    if (weightChart) weightChart.destroy();
    weightChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } },
            plugins: { legend: { display: true, labels: { color: '#fff' } } }
        }
    });
}

// --- Food Diary (Simplified from previous version) ---
document.getElementById('food-form').onsubmit = async (e) => {
    e.preventDefault();
    await db.collection('food_diary').doc(currentUser.uid).collection('entries').add({
        name: document.getElementById('food-name').value,
        calories: parseInt(document.getElementById('food-calories').value),
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('food-form').reset();
    loadDiaryData();
};

async function loadDiaryData() {
    const snapshot = await db.collection('food_diary').doc(currentUser.uid).collection('entries')
        .orderBy('date', 'desc').get();
    const list = document.getElementById('food-list');
    list.innerHTML = '';
    let total = 0;
    snapshot.forEach(doc => {
        const item = doc.data();
        total += item.calories;
        list.innerHTML += `<div class="food-item"><span>${item.name}</span><span>${item.calories} kcal</span></div>`;
    });
    document.getElementById('total-cals').innerText = total;
}

// --- Social & Chat ---
document.getElementById('friend-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('friend-username').value;
    const snap = await db.collection('users').where('username', '==', username).get();

    if (snap.empty) return alert("Usuario no encontrado");
    const friendData = snap.docs[0].data();

    await db.collection('friendships').add({
        users: [currentUser.uid, friendData.uid],
        usernames: [userData.username, friendData.username],
        status: 'accepted'
    });
    alert("Amigo añadido!");
    loadFriendsData();
};

async function loadFriendsData() {
    const snap = await db.collection('friendships').where('users', 'array-contains', currentUser.uid).get();
    const list = document.getElementById('friends-list');
    list.innerHTML = '';

    snap.forEach(doc => {
        const f = doc.data();
        const friendId = f.users.find(id => id !== currentUser.uid);
        const friendName = f.usernames.find(name => name !== userData.username);

        list.innerHTML += `
            <div class="friend-item">
                <div class="friend-info">
                    <h4>${friendName}</h4>
                </div>
                <div class="friend-actions">
                    <button onclick="compareWeight('${friendId}', '${friendName}')">Grafica</button>
                    <button onclick="startChat('${doc.id}', '${friendName}')">Chat</button>
                </div>
            </div>`;
    });
}

window.compareWeight = async (friendId, friendName) => {
    // Show view first with comparison flag to avoid overwrite
    showView('dashboard-section', true);

    const snapSelf = await db.collection('weight_history').doc(currentUser.uid).collection('entries')
        .orderBy('date', 'desc').limit(15).get();
    const snapFriend = await db.collection('weight_history').doc(friendId).collection('entries')
        .orderBy('date', 'desc').limit(15).get();

    // Organize data by date string
    const allData = {};
    const selfEntries = snapSelf.docs.map(d => d.data());
    const friendEntries = snapFriend.docs.map(d => d.data());

    selfEntries.forEach(e => {
        const date = e.date ? e.date.toDate().toLocaleDateString() : 'Hoy';
        if (!allData[date]) allData[date] = {};
        allData[date].self = e.weight;
    });

    friendEntries.forEach(e => {
        const date = e.date ? e.date.toDate().toLocaleDateString() : 'Hoy';
        if (!allData[date]) allData[date] = {};
        allData[date].friend = e.weight;
    });

    // Sort labels by actual date order (simplified: use keys from latest to oldest then reverse)
    const labels = Object.keys(allData).sort((a, b) => new Date(a) - new Date(b));
    const selfData = labels.map(l => allData[l].self || null);
    const friendData = labels.map(l => allData[l].friend || null);

    const datasets = [
        {
            label: 'Tú',
            data: selfData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            spanGaps: true
        },
        {
            label: friendName,
            data: friendData,
            borderColor: '#6b7280',
            tension: 0.4,
            spanGaps: true
        }
    ];

    renderChart(labels, datasets);
};

window.startChat = (friendshipId, friendName) => {
    activeChatFriendId = friendshipId;
    document.getElementById('chat-with').innerText = `Chat con ${friendName}`;
    showView('chat-section');

    const container = document.getElementById('messages-container');
    chatUnsubscribe = db.collection('friendships').doc(friendshipId).collection('messages')
        .orderBy('timestamp', 'asc').onSnapshot(snap => {
            container.innerHTML = '';
            snap.forEach(doc => {
                const msg = doc.data();
                const isSent = msg.sender === currentUser.uid;
                container.innerHTML += `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        ${msg.text}
                        <span class="msg-time">${msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString() : ''}</span>
                    </div>`;
            });
            container.scrollTop = container.scrollHeight;
        });
};

document.getElementById('chat-form').onsubmit = async (e) => {
    e.preventDefault();
    const text = document.getElementById('chat-input').value;
    await db.collection('friendships').doc(activeChatFriendId).collection('messages').add({
        sender: currentUser.uid,
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('chat-form').reset();
};

// --- Listeners ---
document.getElementById('logout-btn').onclick = () => auth.signOut();
document.getElementById('nav-dashboard').onclick = () => showView('dashboard-section');
document.getElementById('nav-diary').onclick = () => showView('diary-section');
document.getElementById('nav-social').onclick = () => showView('social-section');
// Repeat for other nav buttons...
[2, 3].forEach(n => {
    document.getElementById(`nav-dashboard-${n}`).onclick = () => showView('dashboard-section');
    document.getElementById(`nav-diary-${n}`).onclick = () => showView('diary-section');
    document.getElementById(`nav-social-${n}`).onclick = () => showView('social-section');
});
document.getElementById('back-to-social').onclick = () => showView('social-section');
