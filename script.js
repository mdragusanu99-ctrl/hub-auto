// ==========================================
// MODULUL PRINCIPAL DE LOGICĂ ȘI INTERFAȚĂ (script.js)
// ==========================================

let tipContractCurent = 'auto'; // Valori posibile: 'auto', 'imobiliare', 'prestari_servicii', 'demisie'
let globalSessionId = '';
let linkCumparatorGlobal = '';
let profilCurent = {
    email: 'mario@platforma.ro',
    pachet: 'GRATUIT',
    ramase: 3
};
let splashTimerInterval = null;

function arataNotificare(mesaj, esteEroare = false) {
    console.log(mesaj);
    alert(mesaj);
}

function obtineBazaConturi() {
    let db = localStorage.getItem('platforma_db_conturi');
    return db ? JSON.parse(db) : {};
}

function salveazaBazaConturi(db) {
    localStorage.setItem('platforma_db_conturi', JSON.stringify(db));
}

function acceseazaDashboardTab(tabName) {
    console.log("Navigare către tab-ul:", tabName);
}

function salveazaInArhivaprivata(actNou) {
    let arhiva = localStorage.getItem('platforma_arhiva_acte');
    arhiva = arhiva ? JSON.parse(arhiva) : [];
    arhiva.unshift(actNou);
    localStorage.setItem('platforma_arhiva_acte', JSON.stringify(arhiva));
}

function stergeSalvareaLocala() {
    // Opțional: șterge datele temporare din localStorage după generare
}

// ==========================================
// COLECTARE DATELOR UNICE PE FIECARE CONTRACT
// ==========================================
function colecteazaDate() {
    let d = {};
    
    // Colectează toate inputurile, selecturile și text-urile existente în pagină după ID-ul lor
    const elemente = document.querySelectorAll('input, select, textarea');
    elemente.forEach(el => {
        if (el.id) {
            d[el.id] = el.value ? String(el.value).trim() : '';
        }
    });

    return d;
}

// Schimbarea tipului de contract din interfață
function schimbaTipContract(tip) {
    tipContractCurent = tip;
    console.log("Tip contract selectat:", tipContractCurent);
}

// Gestionarea fluxului remote (cu cod QR)
async function pornesteFluxRemote() {
    const d = colecteazaDate();
    globalSessionId = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
    linkCumparatorGlobal = `${window.location.origin}${window.location.pathname}?sessionId=${globalSessionId}`;
    
    const localActions = document.getElementById('localActions');
    const waitingAnim = document.getElementById('waitingAnimationContainer');
    if (localActions) localActions.style.display = 'none';
    if (waitingAnim) waitingAnim.style.display = 'block';

    const qrcodeEl = document.getElementById('qrcode');
    if (qrcodeEl && typeof QRCode !== 'undefined') {
        qrcodeEl.innerHTML = "";
        new QRCode(qrcodeEl, { text: linkCumparatorGlobal, width: 120, height: 120 });
    }
    const shareContainer = document.getElementById('shareLinkContainer');
    if (shareContainer) shareContainer.innerText = linkCumparatorGlobal;

    arataNotificare("✅ Link de completare la distanță generat cu succes!");
}

// Funcția principală de descărcare care direcționează corect către contractul activ
function ruleazaDescarcareaFinala() {
    if (!profilCurent || (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT')) {
        arataNotificare("⚠️ Ați epuizat numărul de contracte gratuite incluse în cont! Vă rugăm să faceți un upgrade.", true);
        acceseazaDashboardTab('abonament');
        return;
    }

    // Apelează funcția unică din pdf-generator.js în funcție de contractul selectat
    if (tipContractCurent === 'auto') {
        if (typeof genereazaContractOficialPDF === 'function') genereazaContractOficialPDF();
    } else if (tipContractCurent === 'imobiliare') {
        if (typeof genereazaContractImobiliarPDF === 'function') genereazaContractImobiliarPDF();
    } else if (tipContractCurent === 'prestari_servicii') {
        if (typeof genereazaContractPrestariServiciiPDF === 'function') genereazaContractPrestariServiciiPDF();
    } else if (tipContractCurent === 'demisie') {
        if (typeof genereazaCerereDemisiePDF === 'function') genereazaCerereDemisiePDF();
    }

    // Scădere contor credite utilizator pentru contul gratuit
    if (profilCurent && profilCurent.pachet === 'GRATUIT' && profilCurent.ramase > 0) {
        profilCurent.ramase--;
        let db = obtineBazaConturi();
        db[profilCurent.email] = profilCurent;
        salveazaBazaConturi(db);
    }
}

// ==========================================
// FUNCȚII DE INTERFAȚĂ, SPLASH SCREEN ȘI TEME
// ==========================================
function initSplashTimer() {
    let secunde = 4;
    const timer = document.getElementById('splashTimerText');
    splashTimerInterval = setInterval(() => {
        secunde--;
        if (timer) timer.innerText = `Se deschide automat în ${secunde} secunde...`;
        if (secunde <= 0) {
            clearInterval(splashTimerInterval);
            inchideSplash();
        }
    }, 1000);
}

function inchideSplash() {
    if (splashTimerInterval) clearInterval(splashTimerInterval);
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => { splash.style.display = 'none'; }, 700);
    }
}

function comutaTema() {
    const body = document.body;
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        btn.innerText = "☀️";
        localStorage.setItem('act_peloc_theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        btn.innerText = "🌙";
        localStorage.setItem('act_peloc_theme', 'light');
    }
}

function deschideMeniuPrincipal() {
    const mainMenu = document.getElementById('mainMenuContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const wizard = document.getElementById('wizardContainer');
    const single = document.getElementById('singleStepContainer');
    const progress = document.getElementById('progressBarContainer');
    const banner = document.getElementById('stepsCompletedBanner');
    const roleBanner = document.getElementById('roleBanner');

    if (mainMenu) mainMenu.style.display = 'block';
    if (modeSelector) modeSelector.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    if (wizard) wizard.style.display = 'none';
    if (single) single.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (banner) banner.style.display = 'none';
    if (roleBanner) roleBanner.style.display = 'none';
}

// Inițializare generală la încărcarea paginii
window.addEventListener('DOMContentLoaded', () => {
    console.log("Platforma ActPeLoc a pornit cu succes!");
    initSplashTimer();
});