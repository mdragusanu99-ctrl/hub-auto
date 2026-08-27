// ==========================================
// MODULUL PRINCIPAL DE LOGICĂ ȘI INTERFAȚĂ (script.js) - ARHITECTURĂ LOGICĂ 2026
// ==========================================

let currentStepIndex = 1;
let maxStepsTotal = 4;
let modLucru = 'local';
let tipContractCurent = 'auto'; // Valori: 'auto', 'imobiliare', 'prestari_servicii', 'demisie', 'comodat'
let globalSessionId = '';
let linkCumparatorGlobal = '';
let profilCurent = {
    email: 'mdragusanu99@platforma.ro',
    pachet: 'GRATUIT',
    ramase: 1000
};
let splashTimerInterval = null;

let domiciliuFiscalDiferit = false;
let esteFirmaSauMandatar = false;
let domiciliuFiscalCumparatorDiferit = false;
let esteFirmaSauMandatarCumparator = false;

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
        profilCurent = { email: 'mdragusanu99@platforma.ro', pachet: 'GRATUIT', ramase: 9 };
        db[profilCurent.email] = profilCurent;
        salveazaBazaConturi(db);
    } else {
        profilCurent = db[profilCurent.email];
        if (profilCurent.ramase <= 0) {
            profilCurent.ramase = 9;
            db[profilCurent.email] = profilCurent;
            salveazaBazaConturi(db);
        }
    }
    const elementContor = document.getElementById('crediteRamaseDisplay');
    if (elementContor) elementContor.innerText = profilCurent.ramase;
    const dashRamase = document.getElementById('infoDashRamase');
    if (dashRamase) dashRamase.innerText = profilCurent.ramase;
}

function deschideMeniuPrincipal() {
    const mainMenu = document.getElementById('mainMenuContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const progressBar = document.getElementById('progressBarContainer');
    const stepsBanner = document.getElementById('stepsCompletedBanner');

    for (let i = 1; i <= 5; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.classList.remove('active');
    }

    if (mainMenu) mainMenu.style.display = 'block';
    if (modeSelector) modeSelector.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    if (progressBar) progressBar.style.display = 'none';
    if (stepsBanner) stepsBanner.style.display = 'none';
    currentStepIndex = 1;
}

function deschideDashboard() {
    const mainMenu = document.getElementById('mainMenuContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const progressBar = document.getElementById('progressBarContainer');
    const stepsBanner = document.getElementById('stepsCompletedBanner');

    for (let i = 1; i <= 5; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.classList.remove('active');
    }

    if (mainMenu) mainMenu.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (progressBar) progressBar.style.display = 'none';
    if (stepsBanner) stepsBanner.style.display = 'none';

    if (dashView) {
        dashView.style.display = 'block';
        verificaSiActiveazaCredite();
        const emailText = document.getElementById('infoDashEmail');
        if (emailText) emailText.innerText = profilCurent.email;
        const pachetText = document.getElementById('infoDashPachet');
        if (pachetText) pachetText.innerText = profilCurent.pachet;
        const refLink = document.getElementById('myReferralLinkText');
        if (refLink) refLink.innerText = `${window.location.origin}${window.location.pathname}?ref=MARIO99`;
    }
}

function acceseazaDashboardTab(tabName) {
    deschideDashboard();
    const tabBtns = document.querySelectorAll('.dash-tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    const sections = document.querySelectorAll('.dash-section');
    sections.forEach(sec => {
        if (sec.id !== 'dashboardView') sec.classList.remove('active');
    });

    if (tabName === 'arhiva') document.getElementById('dashTabArhiva').classList.add('active');
    else if (tabName === 'nou') document.getElementById('dashTabNou').classList.add('active');
    else if (tabName === 'abonament') document.getElementById('dashTabAbonament').classList.add('active');
    else if (tabName === 'afiliere') document.getElementById('dashTabAfiliere').classList.add('active');
    else if (tabName === 'setari') document.getElementById('dashTabSetari').classList.add('active');
}

function schimbaTabDash(tabName, btnEl) {
    const tabBtns = document.querySelectorAll('.dash-tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const sections = document.querySelectorAll('.dash-section');
    sections.forEach(sec => {
        if (sec.id !== 'dashboardView') sec.classList.remove('active');
    });

    if (tabName === 'arhiva') document.getElementById('dashTabArhiva').classList.add('active');
    else if (tabName === 'nou') document.getElementById('dashTabNou').classList.add('active');
    else if (tabName === 'abonament') document.getElementById('dashTabAbonament').classList.add('active');
    else if (tabName === 'afiliere') document.getElementById('dashTabAfiliere').classList.add('active');
    else if (tabName === 'setari') document.getElementById('dashTabSetari').classList.add('active');
}

function salveazaInArhivaprivata(actNou) {
    let arhiva = localStorage.getItem('platforma_arhiva_acte');
    arhiva = arhiva ? JSON.parse(arhiva) : [];
    arhiva.unshift(actNou);
    localStorage.setItem('platforma_arhiva_acte', JSON.stringify(arhiva));
    randeazaArhivaInDashboard();
}

function randeazaArhivaInDashboard() {
    const tbody = document.getElementById('dashboardContracteLista');
    if (!tbody) return;
    let arhiva = localStorage.getItem('platforma_arhiva_acte');
    arhiva = arhiva ? JSON.parse(arhiva) : [];
    if (arhiva.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Niciun contract generat în acest cont momentan.</td></tr>`;
        return;
    }
    let html = '';
    arhiva.forEach(item => {
        html += `<tr>
            <td><strong>${item.idAct}</strong></td>
            <td>${item.numeClient}</td>
            <td><button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; width: auto;" onclick="arataNotificare('Descărcare arhivă indisponibilă în modul offline.')">📥 Redescarcă</button></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function colecteazaDate() {
    let d = {};
    const ids = [
        'sellerName', 'sellerCounty', 'sellerPostalCode', 'sellerCity', 'seller_sector', 'sellerStreet', 'sellerStreetNo', 'sellerBlock', 'sellerBuilding', 'sellerFloor', 'sellerApartment', 'seller_ci_serie', 'seller_ci_number', 'seller_ci_cnp', 'seller_phone', 'seller_email',
        'buyerName', 'buyer_judet', 'buyerPostalCode', 'buyer_city', 'buyer_sector', 'buyerStreet', 'buyerStreetNo', 'buyerBlock', 'buyerBuilding', 'buyerFloor', 'buyerApartment', 'buyerCISeries', 'buyerCINumber', 'buyerCNP', 'buyerPhone', 'buyerEmail',
        'make', 'type', 'chassisSeries', 'motorSeries', 'cilCapacity', 'maxWeight', 'regNumber', 'ITPExpirationDate', 'vehicleIDCardNumber', 'productionYear', 'euroStandard', 'acquiredDate', 'acquiredActType', 'acquiredActDetails', 'figurePrice', 'lettersPrice',
        'proprietarNume', 'proprietarCnp', 'proprietarAct', 'chiriasNume', 'chiriasCnp', 'chiriasAct', 'imobilAdresa', 'imobilInventar', 'imobilDurata', 'imobilDataStart', 'imobilChirie', 'imobilGarantie',
        'prestatorNume', 'prestatorCui', 'prestatorReg', 'prestatorAdresa', 'prestatorReprezentant', 'prestatorBanca',
        'beneficiarNume', 'beneficiarCui', 'beneficiarReg', 'beneficiarAdresa', 'beneficiarReprezentant', 'beneficiarContact',
        'serviciiDescriere', 'serviciiPret', 'serviciiTermen',
        'demisFirma', 'demisNume', 'demisFunctie', 'demisDepartament', 'demisAdresa', 'demisAct', 'demisCnp', 'demisCimNr', 'demisCimData', 'demisZilePreaviz', 'demisDataStart', 'demisDataSfarsit',
        'comodantNume', 'comodantCnp', 'comodantAct', 'comodantAdresa',
        'comodatarNume', 'comodatarCnp', 'comodatarAct', 'comodatarAdresa',
        'comodatTipBun', 'comodatDescriereBun', 'comodatScop', 'comodatDurata'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        d[id] = el ? String(el.value || '').trim() : '';
    });
    return d;
}

// ==========================================
// CONFIGURARE DINAMICĂ PAȘI PE CATEGORII
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
        if (modTitle) modTitle.innerText = "Mod de Lucru - Contract Închiriere Locuință";
        if (modeSelector) modeSelector.style.display = 'block';
    } else if (cat === 'prestari_servicii' || cat === 'comodat') {
        if (modeSelector) modeSelector.style.display = 'none';
        selecteazaModSiPorneste('local');
    } else if (cat === 'demisie') {
        if (modeSelector) modeSelector.style.display = 'none';
        selecteazaModSiPorneste('local');
    }
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    const modeSelector = document.getElementById('modeSelectorContainer');
    if (modeSelector) modeSelector.style.display = 'none';

    const progressBar = document.getElementById('progressBarContainer');
    if (progressBar) progressBar.style.display = 'flex';

    if (tipContractCurent === 'imobiliare') {
        maxStepsTotal = 4; // Fix 4 pași atât local cât și remote
    } else if (tipContractCurent === 'auto') {
        maxStepsTotal = (mod === 'remote') ? 5 : 4;
    } else if (tipContractCurent === 'prestari_servicii' || tipContractCurent === 'comodat') {
        maxStepsTotal = (mod === 'remote') ? 4 : 3;
    } else if (tipContractCurent === 'demisie') {
        maxStepsTotal = 3;
    }

    for (let i = 1; i <= 5; i++) {
        const pBulina = document.getElementById('p' + i);
        if (pBulina) {
            pBulina.style.display = (i <= maxStepsTotal) ? 'flex' : 'none';
        }
    }

    currentStepIndex = 1;
    activeazaPasulUI(1);
}

function activeazaPasulUI(stepNum) {
    currentStepIndex = stepNum;
    for (let i = 1; i <= 5; i++) {
        const sContent = document.getElementById('step' + i);
        const sIndicator = document.getElementById('p' + i);
        if (sContent) {
            if (i === stepNum) sContent.classList.add('active');
            else sContent.classList.remove('active');
        }
        if (sIndicator) {
            if (i === stepNum) {
                sIndicator.classList.add('active');
                sIndicator.classList.remove('completed');
            } else if (i < stepNum) {
                sIndicator.classList.remove('active');
                sIndicator.classList.add('completed');
            } else {
                sIndicator.classList.remove('active', 'completed');
            }
        }
    }

    // Ascundem toate formularele de la Pasul 1
    const fAuto1 = document.getElementById('formAutoStep1');
    const fPrest1 = document.getElementById('formPrestariStep1');
    const fComod1 = document.getElementById('formComodatStep1');
    const fImob1 = document.getElementById('formImobiliareStep1');
    const fDem1 = document.getElementById('formDemisieStep1');

    if (fAuto1) fAuto1.style.display = 'none';
    if (fPrest1) fPrest1.style.display = 'none';
    if (fComod1) fComod1.style.display = 'none';
    if (fImob1) fImob1.style.display = 'none';
    if (fDem1) fDem1.style.display = 'none';

    if (stepNum === 1) {
        if (tipContractCurent === 'auto' && fAuto1) fAuto1.style.display = 'grid';
        else if (tipContractCurent === 'prestari_servicii' && fPrest1) fPrest1.style.display = 'grid';
        else if (tipContractCurent === 'comodat' && fComod1) fComod1.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob1) fImob1.style.display = 'grid';
        else if (tipContractCurent === 'demisie' && fDem1) fDem1.style.display = 'grid';

        if (tipContractCurent === 'auto') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Vânzătorului";
        else if (tipContractCurent === 'prestari_servicii') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Prestatorului";
        else if (tipContractCurent === 'comodat') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Comodantului";
        else if (tipContractCurent === 'imobiliare') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Proprietarului & Imobilului";
        else if (tipContractCurent === 'demisie') document.getElementById('titleStep1').innerText = "Cerere de Demisie Oficială";
    }

    // Ascundem toate formularele de la Pasul 2
    const fAuto2 = document.getElementById('formAutoStep2');
    const fPrest2 = document.getElementById('formPrestariStep2');
    const fComod2 = document.getElementById('formComodatStep2');
    const fImob2 = document.getElementById('formImobiliareStep2');
    const demisSign = document.getElementById('demisSignBoxContainer');

    if (fAuto2) fAuto2.style.display = 'none';
    if (fPrest2) fPrest2.style.display = 'none';
    if (fComod2) fComod2.style.display = 'none';
    if (fImob2) fImob2.style.display = 'none';
    if (demisSign) demisSign.style.display = 'none';

    if (stepNum === 2) {
        if (tipContractCurent === 'auto' && fAuto2) fAuto2.style.display = 'grid';
        else if (tipContractCurent === 'prestari_servicii' && fPrest2) fPrest2.style.display = 'grid';
        else if (tipContractCurent === 'comodat' && fComod2) fComod2.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob2) fImob2.style.display = 'grid';
        else if (tipContractCurent === 'demisie') {
            if (demisSign) demisSign.style.display = 'block';
            initCanvasSemnatura('sigDemisieCanvas');
        }

        if (tipContractCurent === 'auto') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Cumpărătorului";
        else if (tipContractCurent === 'prestari_servicii') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Beneficiarului";
        else if (tipContractCurent === 'comodat') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Comodatarului";
        else if (tipContractCurent === 'imobiliare') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Chiriașului (Locatar)";
        else if (tipContractCurent === 'demisie') document.getElementById('titleStep2').innerText = "Pasul 2: Semnătură Salariat";
    }

    // Ascundem formularele de la Pasul 3
    const fAuto3 = document.getElementById('formAutoStep3');
    const fPrest3 = document.getElementById('formPrestariStep3');
    const fComod3 = document.getElementById('formComodatStep3');
    if (fAuto3) fAuto3.style.display = 'none';
    if (fPrest3) fPrest3.style.display = 'none';
    if (fComod3) fComod3.style.display = 'none';

    if (stepNum === 3) {
        if (tipContractCurent === 'auto' && fAuto3) fAuto3.style.display = 'grid';
        else if (tipContractCurent === 'prestari_servicii' && fPrest3) fPrest3.style.display = 'grid';
        else if (tipContractCurent === 'comodat' && fComod3) fComod3.style.display = 'grid';
    }

    // Gestionare Semnături și Pasul Final
    let estePasSemnatura = false;
    let estePasPlataDescarcare = false;

    if (maxStepsTotal === 4 && tipContractCurent === 'imobiliare') {
        estePasSemnatura = (stepNum === 3);
        estePasPlataDescarcare = (stepNum === 4);
    } else if (maxStepsTotal === 4 && tipContractCurent === 'auto') {
        estePasPlataDescarcare = (stepNum === 4);
    } else {
        estePasSemnatura = (stepNum === maxStepsTotal - 1);
        estePasPlataDescarcare = (stepNum === maxStepsTotal);
    }

    const imobContainer = document.getElementById('imobiliareSemnaturiContainer');
    const localAct = document.getElementById('localActions');
    const finalDownloadContainer = document.getElementById('finalDownloadContainer');

    if (estePasSemnatura) {
        if (imobContainer) imobContainer.style.display = 'block';
        if (localAct) localAct.style.display = (modLucru === 'remote') ? 'block' : 'none';
        if (finalDownloadContainer) finalDownloadContainer.style.display = 'none';

        if (tipContractCurent === 'imobiliare') {
            if (document.getElementById('labelPart1Sign')) document.getElementById('labelPart1Sign').innerText = "Semnătură Proprietar (Locator)";
            if (document.getElementById('chiriasSignLabel')) document.getElementById('chiriasSignLabel').innerText = "Semnătură Chiriaș (Locatar)";
            const t4 = document.getElementById('titleStep4');
            if (t4) t4.innerText = "Pasul 3: Semnături Digitale Părți";
        }
        initCanvasSemnatura('sigProprietarCanvas');
        initCanvasSemnatura('sigChiriasCanvas');
    } else {
        if (imobContainer) imobContainer.style.display = 'none';
    }

    if (estePasPlataDescarcare) {
        if (finalDownloadContainer) finalDownloadContainer.style.display = 'block';
        const titleFinal = document.getElementById('titleStep' + stepNum);
        if (titleFinal) titleFinal.innerText = `Pasul ${stepNum}: Plată & Descărcare Document Oficial`;
    } else {
        if (finalDownloadContainer) finalDownloadContainer.style.display = 'none';
    }

    // Gestionare specială pentru fluxul de la distanță la Contractul Auto
    if (tipContractCurent === 'auto' && modLucru === 'remote' && stepNum === 2) {
        if (localAct) localAct.style.display = 'block';
    }
}


function nextStep(current) {
    if (current < maxStepsTotal) {
        activeazaPasulUI(current + 1);
    }
}

function prevStep(current) {
    if (current > 1) {
        activeazaPasulUI(current - 1);
    } else {
        deschideMeniuPrincipal();
    }
}

function finalizarePas() {
    activeazaPasulUI(maxStepsTotal);
}

// Canvas Semnături
function initCanvasSemnatura(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let desenand = false;

    canvas.addEventListener('mousedown', (e) => {
        desenand = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!desenand) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    });
    window.addEventListener('mouseup', () => { desenand = false; });

    canvas.addEventListener('touchstart', (e) => {
        desenand = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        e.preventDefault();
    });
    canvas.addEventListener('touchmove', (e) => {
        if (!desenand) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
        e.preventDefault();
    });
    window.addEventListener('touchend', () => { desenand = false; });
}

function curataCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Secțiuni opționale
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

// Flux remote (QR)
function pornesteFluxRemote() {
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

function copiazaLinkul() {
    navigator.clipboard.writeText(linkCumparatorGlobal);
    arataNotificare("📋 Link copiat în clipboard!");
}

function trimitePeWhatsApp() {
    const text = encodeURIComponent(`Completează contractul accesând linkul securizat: ${linkCumparatorGlobal}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Descărcarea finală PDF / Punct de Plată
function ruleazaDescarcareaFinala() {
    if (!profilCurent || (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT')) {
        arataNotificare("⚠️ Ați epuizat numărul de contracte gratuite din cont!", true);
        deschideDashboard();
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
    } else if (tipContractCurent === 'comodat') {
        if (typeof genereazaContractComodatPDF === 'function') genereazaContractComodatPDF();
    }

    if (profilCurent && profilCurent.pachet === 'GRATUIT' && profilCurent.ramase > 0) {
        profilCurent.ramase--;
        let db = obtineBazaConturi();
        db[profilCurent.email] = profilCurent;
        salveazaBazaConturi(db);
        verificaSiActiveazaCredite();
    }

    let dateFormular = colecteazaDate();
    salveazaInArhivaprivata({
        idAct: 'DOC-' + Math.floor(1000 + Math.random() * 9000),
        numeClient: dateFormular.buyerName || dateFormular.chiriasNume || dateFormular.beneficiarNume || dateFormular.comodatarNume || dateFormular.demisNume || 'Client Necunoscut',
        tip: tipContractCurent.toUpperCase(),
        data: new Date().toLocaleDateString('ro-RO')
    });
}

// Autentificare și UI
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

function deschideModalAuth(mod) {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function inchideModalAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function gestioneazaClickContulMeu() {
    deschideDashboard();
}

window.addEventListener('DOMContentLoaded', () => {
    console.log("Platforma ActPeLoc a pornit cu succes!");
    initSplashTimer();
    verificaSiActiveazaCredite();
    randeazaArhivaInDashboard();
});