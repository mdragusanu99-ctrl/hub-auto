
let currentStepIndex = 1;
let modLucru = 'local';
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
    // Șterge datele temporare din formulare dacă este cazul
}

// Colectează datele din toate formularele vizibile în interfață
function colecteazaDate() {
    let d = {};
    const elemente = document.querySelectorAll('input, select, textarea');
    elemente.forEach(el => {
        if (el.id) {
            d[el.id] = el.value ? String(el.value).trim() : '';
        }
    });
    return d;
}

// ==========================================
// NAVIGARE CATEGORII ȘI MODURI DE LUCRU
// ==========================================
function selecteazaCategorie(cat) {
    tipContractCurent = cat;
    const mainMenu = document.getElementById('mainMenuContainer');
    const dashView = document.getElementById('dashboardView');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const modTitle = document.getElementById('modSelectorTitle');

    if (mainMenu) mainMenu.style.display = 'none';
    if (dashView) dashView.style.display = 'none';

    if (cat === 'auto') {
        if (modTitle) modTitle.innerText = "Mod de Lucru - Contract Auto ITL 054";
        if (modeSelector) modeSelector.style.display = 'block';
    } else if (cat === 'imobiliare') {
        if (modTitle) modTitle.innerText = "Mod de Lucru - Contract Imobiliar cu Inventar";
        if (modeSelector) modeSelector.style.display = 'block';
    } else if (cat === 'prestari_servicii') {
        if (modeSelector) modeSelector.style.display = 'none';
        pornesteWizardMultiPas();
    } else if (cat === 'demisie') {
        if (modeSelector) modeSelector.style.display = 'none';
        pornesteFormularPasUnic();
    }
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    const modeSelector = document.getElementById('modeSelectorContainer');
    if (modeSelector) modeSelector.style.display = 'none';
    
    if (tipContractCurent === 'imobiliare') {
        pornesteFormularPasUnic();
    } else {
        pornesteWizardMultiPas();
    }
}

function pornesteWizardMultiPas() {
    const wizard = document.getElementById('wizardContainer');
    const progressBar = document.getElementById('progressBarContainer');
    if (wizard) wizard.style.display = 'block';
    if (progressBar) progressBar.style.display = 'flex';

    currentStepIndex = 1;
    actualizeazaVizibilitatePanouri();
}

function pornesteFormularPasUnic() {
    const single = document.getElementById('singleStepContainer');
    if (single) single.style.display = 'block';

    const subImob = document.getElementById('subFormImobiliare');
    const subDem = document.getElementById('subFormDemisie');

    if (subImob) subImob.style.display = (tipContractCurent === 'imobiliare') ? 'grid' : 'none';
    if (subDem) subDem.style.display = (tipContractCurent === 'demisie') ? 'grid' : 'none';
}

function treciLaFinalizareDirect() {
    const single = document.getElementById('singleStepContainer');
    if (single) single.style.display = 'none';
    const wizard = document.getElementById('wizardContainer');
    if (wizard) wizard.style.display = 'block';
    currentStepIndex = 4;
    actualizeazaVizibilitatePanouri();
}

function actualizeazaVizibilitatePanouri() {
    for (let i = 1; i <= 4; i++) {
        const pane = document.getElementById('paneStep' + i);
        if (pane) {
            if (i === currentStepIndex) pane.classList.add('active');
            else pane.classList.remove('active');
        }
    }
}

function avanseazaPas() {
    if (currentStepIndex < 4) {
        currentStepIndex++;
        actualizeazaVizibilitatePanouri();
    }
}

function daInapoiPas() {
    if (currentStepIndex > 1) {
        currentStepIndex--;
        actualizeazaVizibilitatePanouri();
    } else {
        deschideMeniuPrincipal();
    }
}

// Gestionarea fluxului remote (cu cod QR)
async function pornesteFluxRemote() {
    if (tipContractCurent === 'imobiliare') {
        const d = colecteazaDate();
        localStorage.setItem('act_peloc_remote_imob', JSON.stringify(d));
        globalSessionId = 'IMOB-' + Math.floor(100000 + Math.random() * 900000);
        linkCumparatorGlobal = `${window.location.origin}${window.location.pathname}?remote_imob=${globalSessionId}`;
        
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

        arataNotificare("✅ Link generat cu succes pentru completare de la distanță!");
        return;
    }

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

// Funcția principală de descărcare care leagă interfața de generatorul PDF
function ruleazaDescarcareaFinala() {
    if (!profilCurent || (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT')) {
        arataNotificare("⚠️ Ați epuizat numărul de contracte gratuite incluse în cont! Vă rugăm să faceți un upgrade.", true);
        acceseazaDashboardTab('abonament');
        return;
    }

    if (tipContractCurent === 'auto') {
        if (typeof genereazaContractOficialPDF === 'function') genereazaContractOficialPDF();
    } else if (tipContractCurent === 'imobiliare') {
        if (typeof genereazaContractImobiliarPDF === 'function') genereazaContractImobiliarPDF();
    } else if (tipContractCurent === 'prestari_servicii') {
        if (typeof genereazaContractPrestariServiciiPDF === 'function') genereazaContractPrestariServiciiPDF();
    } else if (tipContractCurent === 'demisie') {
        if (typeof genereazaCerereDemisiePDF === 'function') genereazaCerereDemisiePDF();
    }

    if (profilCurent && profilCurent.pachet === 'GRATUIT' && profilCurent.ramase > 0) {
        profilCurent.ramase--;
        let db = obtineBazaConturi();
        db[profilCurent.email] = profilCurent;
        salveazaBazaConturi(db);
    }
}

// ==========================================
// INTERFAȚĂ, SPLASH SCREEN ȘI TEME
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