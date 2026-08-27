// ==========================================
// MODULUL PRINCIPAL DE LOGICĂ ȘI INTERFAȚĂ (script.js) - COMPLET
// ==========================================

let currentStepIndex = 1;
let modLucru = 'local';
let tipContractCurent = 'auto'; // Valori posibile: 'auto', 'imobiliare', 'prestari_servicii', 'demisie'
let globalSessionId = '';
let linkCumparatorGlobal = '';
let profilCurent = {
    email: 'mario@platforma.ro',
    pachet: 'GRATUIT',
    ramase: 10
};
let splashTimerInterval = null;

let domiciliuFiscalDiferit = false;
let esteFirmaSauMandatar = false;
let domiciliuFiscalCumparatorDiferit = false;
let esteFirmaSauMandatarCumparator = false;

// Lista completă a tuturor elementelor de formular din platformă
const elementeFormular = [
    'sellerName', 'sellerCounty', 'sellerPostalCode', 'sellerCity', 'seller_sector', 'sellerStreet', 'sellerStreetNo', 'sellerBlock', 'sellerBuilding', 'sellerFloor', 'sellerApartment', 'seller_ci_serie', 'seller_ci_number', 'seller_ci_cnp', 'seller_phone', 'seller_email',
    'sellerFiscalCounty', 'sellerFiscalPostalCode', 'sellerFiscalCity', 'sellerFiscalSector', 'sellerFiscalStreet', 'sellerFiscalStreetNo',
    'sellerRepresentant', 'sellerQuality', 'reprCISeries', 'reprCINumber', 'reprCNP', 'reprPhone', 'reprEmail',
    'buyerName', 'buyer_judet', 'buyerPostalCode', 'buyer_city', 'buyer_sector', 'buyerStreet', 'buyerStreetNo', 'buyerBlock', 'buyerBuilding', 'buyerFloor', 'buyerApartment', 'buyerCISeries', 'buyerCINumber', 'buyerCNP', 'buyerPhone', 'buyerEmail',
    'buyerFiscalCounty', 'buyerFiscalPostalCode', 'buyerFiscalCity', 'buyerFiscalSector', 'buyerFiscalStreet', 'buyerFiscalStreetNo',
    'buyerRepresentant', 'buyerQuality', 'buyerRepresCISeries', 'buyerRepresCINumber', 'buyerRepresCNP', 'buyerRepresPhone', 'buyerRepresEmail',
    'make', 'type', 'chassisSeries', 'motorSeries', 'cilCapacity', 'maxWeight', 'regNumber', 'ITPExpirationDate', 'vehicleIDCardNumber', 'productionYear', 'euroStandard', 'acquiredDate', 'acquiredActType', 'acquiredActDetails', 'figurePrice', 'lettersPrice',
    'proprietarNume', 'proprietarCnp', 'proprietarAct', 'chiriasNume', 'chiriasCnp', 'chiriasAct', 'imobilAdresa', 'imobilInventar', 'imobilDurata', 'imobilDataStart', 'imobilChirie', 'imobilGarantie',
    'prestatorNume', 'prestatorCui', 'prestatorReg', 'prestatorAdresa', 'prestatorReprezentant', 'prestatorBanca',
    'beneficiarNume', 'beneficiarCui', 'beneficiarReg', 'beneficiarAdresa', 'beneficiarReprezentant', 'beneficiarContact',
    'serviciiDescriere', 'serviciiPret', 'serviciiTermen',
    'demisFirma', 'demisNume', 'demisFunctie', 'demisDepartament', 'demisAdresa', 'demisAct', 'demisCnp', 'demisCimNr', 'demisCimData', 'demisZilePreaviz', 'demisDataStart', 'demisDataSfarsit'
];

function arataNotificare(mesaj, esteEroare = false) {
    const toast = document.getElementById('toastNotification');
    if (!toast) {
        alert(mesaj);
        return;
    }
    toast.innerText = mesaj;
    toast.className = esteEroare ? 'error' : '';
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function obtineBazaConturi() {
    let db = localStorage.getItem('platforma_db_conturi');
    return db ? JSON.parse(db) : {};
}

function salveazaBazaConturi(db) {
    localStorage.setItem('platforma_db_conturi', JSON.stringify(db));
}

function verificaSiActiveazaCredite() {
    let db = obtineBazaConturi();
    if (!db[profilCurent.email]) {
        profilCurent = { email: 'mario@platforma.ro', pachet: 'GRATUIT', ramase: 10 };
        db[profilCurent.email] = profilCurent;
        salveazaBazaConturi(db);
    } else {
        profilCurent = db[profilCurent.email];
        if (profilCurent.ramase <= 0) {
            profilCurent.ramase = 10;
            db[profilCurent.email] = profilCurent;
            salveazaBazaConturi(db);
        }
    }
    const elementContor = document.getElementById('crediteRamaseDisplay');
    if (elementContor) elementContor.innerText = profilCurent.ramase;
}

function deschideDashboard() {
    const mainMenu = document.getElementById('mainMenuContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const wizard = document.getElementById('wizardContainer');
    const single = document.getElementById('singleStepContainer');
    const progress = document.getElementById('progressBarContainer');
    const banner = document.getElementById('stepsCompletedBanner');
    const roleBanner = document.getElementById('roleBanner');

    if (mainMenu) mainMenu.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (wizard) wizard.style.display = 'none';
    if (single) single.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (banner) banner.style.display = 'none';
    if (roleBanner) roleBanner.style.display = 'none';

    if (dashView) {
        dashView.style.display = 'block';
        verificaSiActiveazaCredite();
    }
}

function salveazaInArhivaprivata(actNou) {
    let arhiva = localStorage.getItem('platforma_arhiva_acte');
    arhiva = arhiva ? JSON.parse(arhiva) : [];
    arhiva.unshift(actNou);
    localStorage.setItem('platforma_arhiva_acte', JSON.stringify(arhiva));
}

function stergeSalvareaLocala() {
    elementeFormular.forEach(id => {
        localStorage.removeItem('act_peloc_' + id);
    });
}

function colecteazaDate() {
    let d = {};
    elementeFormular.forEach(id => {
        const el = document.getElementById(id);
        d[id] = el ? String(el.value || '').trim() : '';
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

    if (tipContractCurent === 'auto') {
        const f1 = document.getElementById('subFormAuto1');
        const f2 = document.getElementById('subFormAuto2');
        const f3 = document.getElementById('subFormAuto3');

        if (f1) f1.style.display = (currentStepIndex === 1) ? 'grid' : 'none';
        if (f2) f2.style.display = (currentStepIndex === 2) ? 'grid' : 'none';
        if (f3) f3.style.display = (currentStepIndex === 3) ? 'grid' : 'none';

        if (document.getElementById('titlePane1')) document.getElementById('titlePane1').innerText = "Pasul 1: Datele Vânzătorului";
        if (document.getElementById('titlePane2')) document.getElementById('titlePane2').innerText = "Pasul 2: Datele Cumpărătorului";
        if (document.getElementById('titlePane3')) document.getElementById('titlePane3').innerText = "Pasul 3: Vehiculul și Prețul";
    } else if (tipContractCurent === 'prestari_servicii') {
        const f1 = document.getElementById('subFormPrestari1');
        const f2 = document.getElementById('subFormPrestari2');
        const f3 = document.getElementById('subFormPrestari3');

        if (f1) f1.style.display = (currentStepIndex === 1) ? 'grid' : 'none';
        if (f2) f2.style.display = (currentStepIndex === 2) ? 'grid' : 'none';
        if (f3) f3.style.display = (currentStepIndex === 3) ? 'grid' : 'none';

        if (document.getElementById('titlePane1')) document.getElementById('titlePane1').innerText = "Pasul 1: Datele Prestatorului";
        if (document.getElementById('titlePane2')) document.getElementById('titlePane2').innerText = "Pasul 2: Datele Beneficiarului";
        if (document.getElementById('titlePane3')) document.getElementById('titlePane3').innerText = "Pasul 3: Obiectul, Prețul și Termenele";
    }

    if (currentStepIndex === 4) {
        const imobSemnaturi = document.getElementById('imobiliareSemnaturiContainer');
        const localActions = document.getElementById('localActions');
        const finalDownload = document.getElementById('finalDownloadContainer');
        
        if (tipContractCurent === 'imobiliare') {
            if (imobSemnaturi) imobSemnaturi.style.display = 'block';
            if (localActions) localActions.style.display = (modLucru === 'remote') ? 'block' : 'none';
            if (finalDownload) finalDownload.style.display = (modLucru === 'local') ? 'block' : 'none';
            if (document.getElementById('labelPart1Sign')) document.getElementById('labelPart1Sign').innerText = "Semnătură Proprietar (Locator)";
            if (document.getElementById('chiriasSignLabel')) document.getElementById('chiriasSignLabel').innerText = "Semnătură Chiriaș (Locatar)";
        } else if (tipContractCurent === 'prestari_servicii') {
            if (imobSemnaturi) imobSemnaturi.style.display = 'block';
            if (localActions) localActions.style.display = 'none';
            if (finalDownload) finalDownload.style.display = 'block';
            if (document.getElementById('labelPart1Sign')) document.getElementById('labelPart1Sign').innerText = "Semnătură Prestator";
            if (document.getElementById('chiriasSignLabel')) document.getElementById('chiriasSignLabel').innerText = "Semnătură Beneficiar";
        } else if (tipContractCurent === 'demisie') {
            if (imobSemnaturi) imobSemnaturi.style.display = 'none';
            if (localActions) localActions.style.display = 'none';
            if (finalDownload) finalDownload.style.display = 'block';
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

// Comutare secțiuni opționale
function comutaDomiciliuFiscal() {
    domiciliuFiscalDiferit = !domiciliuFiscalDiferit;
    const sectiune = document.getElementById('sectiuneFiscala');
    if (sectiune) sectiune.style.display = domiciliuFiscalDiferit ? 'grid' : 'none';
}
function comutaFirma() {
    esteFirmaSauMandatar = !esteFirmaSauMandatar;
    const sectiune = document.getElementById('sectiuneFirma');
    if (sectiune) sectiune.style.display = esteFirmaSauMandatar ? 'grid' : 'none';
}
function comutaDomiciliuFiscalCumparator() {
    domiciliuFiscalCumparatorDiferit = !domiciliuFiscalCumparatorDiferit;
    const sectiune = document.getElementById('sectiuneFiscalaCumparator');
    if (sectiune) sectiune.style.display = domiciliuFiscalCumparatorDiferit ? 'grid' : 'none';
}
function comutaFirmaCumparator() {
    esteFirmaSauMandatarCumparator = !esteFirmaSauMandatarCumparator;
    const sectiune = document.getElementById('sectiuneFirmaCumparator');
    if (sectiune) sectiune.style.display = esteFirmaSauMandatarCumparator ? 'grid' : 'none';
}

// Flux remote cu cod QR
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

// Descărcarea finală PDF
function ruleazaDescarcareaFinala() {
    if (!profilCurent || (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT')) {
        arataNotificare("⚠️ Ați epuizat numărul de contracte gratuite incluse în cont! Vă rugăm să faceți un upgrade.", true);
        acceseazaDashboardTab();
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
        verificaSiActiveazaCredite();
    }
}

// Interfață, splash screen și teme
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
    currentStepIndex = 1;
}

// Inițializare la pornire
window.addEventListener('DOMContentLoaded', () => {
    console.log("Platforma ActPeLoc a pornit cu succes!");
    initSplashTimer();
    verificaSiActiveazaCredite();
});