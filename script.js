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
    // Aici adaugi logica ta pentru schimbarea tab-urilor din dashboard
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
    const inputs = document.querySelectorAll('input, select, textarea');
    let dateColectate = {};
    inputs.forEach(input => {
        if (input.id) {
            dateColectate[input.id] = input.value;
        }
    });
    return dateColectate;
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

    // Flux general remote pentru Auto / Prestări Servicii
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

    // Apelează funcția corespunzătoare din pdf-generator.js în funcție de contractul selectat
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

// Schimbarea tipului de contract din interfață
function schimbaTipContract(tip) {
    tipContractCurent = tip;
    console.log("Tip contract selectat:", tipContractCurent);
}

// Inițializare generală la încărcarea paginii
window.addEventListener('DOMContentLoaded', () => {
    console.log("Platforma ActPeLoc a pornit cu succes!");
});