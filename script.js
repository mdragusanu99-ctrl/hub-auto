let currentStep = 1;
let buyerCurrentStep = 1;
let modLucru = 'local';
let tipContractCurent = 'auto';
let globalSessionId = null;
let userRole = 'vanzator';
let isRemoteTenantView = false;
let linkCumparatorGlobal = "";

let domiciliuFiscalDiferit = false;
let esteFirmaSauMandatar = false;
let domiciliuFiscalCumparatorDiferit = false;
let esteFirmaSauMandatarCumparator = false;

let profilCurent = null;
let modAuthCurent = 'logare';
let pachetSelectatInregistrare = 'GRATUIT';
let codReferralPrimit = null;
let splashTimerInterval = null;

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

function incarcaTemaSalvata() {
    if (localStorage.getItem('act_peloc_theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.innerText = "☀️";
    }
}

function selecteazaPachetModal(pkg) {
    pachetSelectatInregistrare = pkg;
    ['GRATUIT', 'STANDARD', 'BUSINESS'].forEach(p => {
        const el = document.getElementById('pkg_' + p);
        if (el) {
            if (p === pkg) el.classList.add('selected');
            else el.classList.remove('selected');
        }
    });
}

function deschideModalAuth(mod = 'logare') {
    modAuthCurent = mod;
    aplicăModAuth();
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function inchideModalAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function schimbaModulAuth(mod) {
    modAuthCurent = mod;
    aplicăModAuth();
}

function aplicăModAuth() {
    const title = document.getElementById('authModalTitle');
    const subtitle = document.getElementById('authModalSubtitle');
    const btn = document.getElementById('authSubmitBtn');
    const switchCont = document.getElementById('authSwitchContainer');
    const regFields = document.querySelectorAll('.reg-field');

    if (modAuthCurent === 'logare') {
        if (title) title.innerText = "Autentificare Cont";
        if (subtitle) subtitle.innerText = "Introdu e-mailul și parola unică pentru a te loga.";
        if (btn) btn.innerText = "🔑 Intră în Cont";
        regFields.forEach(el => el.style.display = 'none');
        if (switchCont) switchCont.innerHTML = `Nu ai un cont? <span style="color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="schimbaModulAuth('inregistrare')">Creează-ți unul chiar acum</span>`;
    } else {
        if (title) title.innerText = "Creare Cont Nou";
        if (subtitle) subtitle.innerText = "Alege pachetul și setează datele tale de acces.";
        if (btn) btn.innerText = "🚀 Creează Cont & Activează";
        regFields.forEach(el => el.style.display = 'block');
        if (switchCont) switchCont.innerHTML = `Ai deja un cont? <span style="color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="schimbaModulAuth('logare')">Autentifică-te aici</span>`;
    }
}

function gestioneazaClickContulMeu() {
    if (!profilCurent) {
        deschideModalAuth('logare');
    } else {
        const menu = document.getElementById('profileDropdownMenu');
        if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }
}

window.addEventListener('click', (e) => {
    const pill = document.getElementById('userStatusBadge');
    const menu = document.getElementById('profileDropdownMenu');
    if (pill && menu && !pill.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

function obtineBazaConturi() {
    return JSON.parse(localStorage.getItem('act_peloc_baza_utilizatori') || '{}');
}
function salveazaBazaConturi(db) {
    localStorage.setItem('act_peloc_baza_utilizatori', JSON.stringify(db));
}

async function gestioneazaAutentificareSauInregistrare() {
    const emailEl = document.getElementById('authEmail');
    const parolaEl = document.getElementById('authPassword');
    if (!emailEl || !parolaEl) return;

    const email = emailEl.value.trim().toLowerCase();
    const parola = parolaEl.value;

    if (!email || !email.includes('@')) { arataNotificare("Introduceți o adresă de e-mail validă!", true); return; }
    if (!parola || parola.length < 6) { arataNotificare("Parola trebuie să aibă minim 6 caractere!", true); return; }

    let db = obtineBazaConturi();

    if (modAuthCurent === 'inregistrare') {
        const confirmP = document.getElementById('authPasswordConfirm').value;
        if (parola !== confirmP) { arataNotificare("Parolele nu coincid!", true); return; }
        if (db[email]) { arataNotificare("Acest e-mail este deja înregistrat!", true); return; }

        const tip = document.getElementById('authTipProfil').value;
        const pachet = pachetSelectatInregistrare;
        let ramase = (pachet === 'STANDARD') ? 400 : (pachet === 'BUSINESS' ? 1200 : 3);

        db[email] = {
            email, parola, tip, pachet, ramase,
            puncteAfiliere: 0,
            reducereInvitat35: codReferralPrimit ? true : false,
            arhivaContracte: []
        };

        if (codReferralPrimit && db[codReferralPrimit]) {
            db[codReferralPrimit].puncteAfiliere += 1;
        }

        salveazaBazaConturi(db);
        profilCurent = db[email];
        localStorage.setItem('act_peloc_utilizator_activ', email);

        actualizeazaUIAvanced();
        arataNotificare("✅ Cont creat cu succes!");
        inchideModalAuth();
        acceseazaDashboardTab('arhiva');
    } else {
        if (!db[email] || db[email].parola !== parola) {
            arataNotificare("E-mail sau parolă incorecte!", true);
            return;
        }
        profilCurent = db[email];
        localStorage.setItem('act_peloc_utilizator_activ', email);
        actualizeazaUIAvanced();
        arataNotificare("Autentificare reușită!");
        inchideModalAuth();
        acceseazaDashboardTab('arhiva');
    }
}

function actualizeazaUIAvanced() {
    if (!profilCurent) return;
    const statusText = document.getElementById('userStatusText');
    const avatarText = document.getElementById('userAvatarText');
    const dropdownEmail = document.getElementById('dropdownEmailText');
    const dashBtn = document.getElementById('dashNavBtn');

    if (statusText) statusText.innerText = profilCurent.email.split('@')[0];
    if (avatarText) avatarText.innerText = profilCurent.email.charAt(0).toUpperCase();
    if (dropdownEmail) dropdownEmail.innerText = profilCurent.email;
    if (dashBtn) dashBtn.style.display = 'inline-flex';
}

function deconectareUtilizator() {
    localStorage.removeItem('act_peloc_utilizator_activ');
    profilCurent = null;
    const statusText = document.getElementById('userStatusText');
    const avatarText = document.getElementById('userAvatarText');
    const dashBtn = document.getElementById('dashNavBtn');
    const dropdownMenu = document.getElementById('profileDropdownMenu');

    if (statusText) statusText.innerText = "Contul Meu";
    if (avatarText) avatarText.innerText = "👤";
    if (dashBtn) dashBtn.style.display = 'none';
    if (dropdownMenu) dropdownMenu.style.display = 'none';
    arataNotificare("V-ați deconectat cu succes!");
    deschideMeniuPrincipal();
}

function acceseazaDashboardTab(tabName) {
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    if (dropdownMenu) dropdownMenu.style.display = 'none';
    
    if (!profilCurent) {
        arataNotificare("⚠️ Autentificați-vă pentru a accesa Dashboard-ul!", true);
        deschideModalAuth('logare');
        return;
    }
    const mainMenu = document.getElementById('mainMenuContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');

    if (mainMenu) mainMenu.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    if (dashView) dashView.style.display = 'block';

    incarcaDateDashboard();

    const tabs = document.querySelectorAll('.dash-tab-btn');
    if (tabName === 'arhiva' && tabs[0]) schimbaTabDash('arhiva', tabs[0]);
    if (tabName === 'abonament' && tabs[2]) schimbaTabDash('abonament', tabs[2]);
    if (tabName === 'afiliere' && tabs[3]) schimbaTabDash('afiliere', tabs[3]);
    if (tabName === 'setari' && tabs[4]) {
        schimbaTabDash('setari', tabs[4]);
        const emailInput = document.getElementById('settingsNewEmail');
        if (emailInput) emailInput.value = profilCurent.email;
    }
}

function schimbaTabDash(tabName, btnEl) {
    document.querySelectorAll('.dash-section').forEach(el => {
        if (el.id && el.id.startsWith('dashTab')) el.classList.remove('active');
    });
    document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));

    const tabEl = document.getElementById('dashTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (tabEl) tabEl.classList.add('active');
    if (btnEl) btnEl.classList.add('active');
}

function actualizeazaEmailCont() {
    const emailInput = document.getElementById('settingsNewEmail');
    if (!emailInput) return;
    const nouEmail = emailInput.value.trim().toLowerCase();
    if (!nouEmail || !nouEmail.includes('@')) { arataNotificare("E-mail invalid!", true); return; }
    let db = obtineBazaConturi();
    if (db[nouEmail] && nouEmail !== profilCurent.email) { arataNotificare("E-mailul este deja folosit!", true); return; }

    let vechi = profilCurent.email;
    profilCurent.email = nouEmail;
    db[nouEmail] = profilCurent;
    if (vechi !== nouEmail) delete db[vechi];

    salveazaBazaConturi(db);
    localStorage.setItem('act_peloc_utilizator_activ', nouEmail);
    actualizeazaUIAvanced();
    arataNotificare("✅ E-mail actualizat cu succes!");
}

function incarcaProfilSalvat() {
    const active = localStorage.getItem('act_peloc_utilizator_activ');
    if (active) {
        let db = obtineBazaConturi();
        if (db[active]) {
            profilCurent = db[active];
            actualizeazaUIAvanced();
        }
    }
}

function incarcaDateDashboard() {
    if (!profilCurent) return;
    const emailEl = document.getElementById('infoDashEmail');
    const profilEl = document.getElementById('infoDashProfil');
    const pachetEl = document.getElementById('infoDashPachet');
    const ramaseEl = document.getElementById('infoDashRamase');
    const puncteEl = document.getElementById('infoPuncteAfiliere');
    const reducereEl = document.getElementById('infoReducereAfiliere');
    const linkRefEl = document.getElementById('myReferralLinkText');

    if (emailEl) emailEl.innerText = profilCurent.email;
    if (profilEl) profilEl.innerText = profilCurent.tip;
    if (pachetEl) pachetEl.innerText = profilCurent.pachet;
    if (ramaseEl) ramaseEl.innerText = profilCurent.ramase;

    const puncte = profilCurent.puncteAfiliere || 0;
    if (puncteEl) puncteEl.innerText = `${puncte} punct${puncte !== 1 ? 'e' : ''}`;
    if (reducereEl) reducereEl.innerText = `${puncte * 30}% reducere pentru următoarele ${puncte} contracte`;

    if (linkRefEl) linkRefEl.innerText = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(profilCurent.email)}`;

    const lista = document.getElementById('dashboardContracteLista');
    if (!lista) return;
    lista.innerHTML = '';
    let istoric = profilCurent.arhivaContracte || [];
    if (istoric.length === 0) {
        lista.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Niciun contract generat în acest cont momentan.</td></tr>`;
        return;
    }
    istoric.forEach(item => {
        lista.innerHTML += `
            <tr>
                <td><b>${item.idAct}</b></td>
                <td>${item.numeClient}</td>
                <td>
                    <button class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 11px;" onclick="genereazaContractOficialPDF()">📥 Descarcă</button>
                </td>
            </tr>
        `;
    });
}

function copiazaLinkAfiliere() {
    const linkText = document.getElementById('myReferralLinkText');
    if (linkText) {
        navigator.clipboard.writeText(linkText.innerText).then(() => { arataNotificare("📋 Linkul de afiliere a fost copiat!"); });
    }
}
function trimiteAfiliereWhatsApp() {
    const linkText = document.getElementById('myReferralLinkText');
    if (!linkText) return;
    const link = linkText.innerText;
    const mesaj = encodeURIComponent(`Salut! Folosește platforma ActPeLoc pentru a genera contracte auto instant și ai 35% reducere prin acest link: ${link}`);
    window.open(`https://api.whatsapp.com/send?text=${mesaj}`, '_blank');
}

function salveazaInArhivaprivata(item) {
    if (!profilCurent) return;
    if (!profilCurent.arhivaContracte) profilCurent.arhivaContracte = [];
    profilCurent.arhivaContracte.unshift(item);
    let db = obtineBazaConturi();
    db[profilCurent.email] = profilCurent;
    salveazaBazaConturi(db);
}

function deschideMeniuPrincipal() {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    const progress = document.getElementById('progressBarContainer');
    const banner = document.getElementById('stepsCompletedBanner');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const demisieSelector = document.getElementById('demisieSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const mainMenu = document.getElementById('mainMenuContainer');
    const roleBanner = document.getElementById('roleBanner');

    if (progress) progress.style.display = 'none';
    if (banner) banner.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (demisieSelector) demisieSelector.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'block';
    if (roleBanner) roleBanner.style.display = 'none';
    currentStep = 1;
}

function selecteazaCategorie(cat) {
    tipContractCurent = cat;
    const mainMenu = document.getElementById('mainMenuContainer');
    const dashView = document.getElementById('dashboardView');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const demisieSelector = document.getElementById('demisieSelectorContainer');
    const modTitle = document.getElementById('modSelectorTitle');
    const formAuto1 = document.getElementById('formAutoStep1');
    const formImob1 = document.getElementById('formImobiliareStep1');
    const formDemisie1 = document.getElementById('formDemisieStep1');
    const titleStep1 = document.getElementById('titleStep1');

    if (mainMenu) mainMenu.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    
    if (cat === 'auto') {
        if (modTitle) modTitle.innerText = "Mod de Lucru - Contract Auto ITL 054";
        if (formAuto1) formAuto1.style.display = 'grid';
        if (formImob1) formImob1.style.display = 'none';
        if (formDemisie1) formDemisie1.style.display = 'none';
        if (titleStep1) titleStep1.innerText = "Pasul 1: Datele Vânzătorului";
        if (modeSelector) modeSelector.style.display = 'block';
        if (demisieSelector) demisieSelector.style.display = 'none';
    } else if (cat === 'imobiliare') {
        if (modTitle) modTitle.innerText = "Mod de Lucru - Contract Imobiliar cu Inventar";
        if (formAuto1) formAuto1.style.display = 'none';
        if (formImob1) formImob1.style.display = 'grid';
        if (formDemisie1) formDemisie1.style.display = 'none';
        if (titleStep1) titleStep1.innerText = "Pasul 1: Datele Părților & Imobilului";
        if (modeSelector) modeSelector.style.display = 'block';
        if (demisieSelector) demisieSelector.style.display = 'none';
    } else if (cat === 'demisie') {
        if (formAuto1) formAuto1.style.display = 'none';
        if (formImob1) formImob1.style.display = 'none';
        if (modeSelector) modeSelector.style.display = 'none';
        if (demisieSelector) demisieSelector.style.display = 'block'; // Deschidem meniul de selecție simplă vs detaliată!
    }
}

function selecteazaTipDemisieSiPorneste(tip) {
    const demisieSelector = document.getElementById('demisieSelectorContainer');
    const formDemisie1 = document.getElementById('formDemisieStep1');
    const titleStep1 = document.getElementById('titleStep1');
    const headerTitle = document.getElementById('demisieFormHeaderTitle');
    const formatInput = document.getElementById('demisTipFormat');

    if (demisieSelector) demisieSelector.style.display = 'none';
    if (formDemisie1) formDemisie1.style.display = 'grid';
    if (formatInput) formatInput.value = tip;

    if (tip === 'simpla') {
        if (titleStep1) titleStep1.innerText = "Cerere de Demisie Simplă și Rapidă";
        if (headerTitle) headerTitle.innerText = "Date Cerere Simplă (Preaviz & Salariat)";
    } else {
        if (titleStep1) titleStep1.innerText = "Cerere de Demisie Detaliată & Juridică";
        if (headerTitle) headerTitle.innerText = "Date Cerere Detaliată (Cu Drepturi & Vechime)";
    }

    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step1').classList.add('active');
}

const elementeFormular = [
    'sellerName', 'sellerCounty', 'sellerPostalCode', 'sellerCity', 'seller_sector', 'sellerStreet', 'sellerStreetNo', 'sellerBlock', 'sellerBuilding', 'sellerFloor', 'sellerApartment', 'seller_ci_serie', 'seller_ci_number', 'seller_ci_cnp', 'seller_phone', 'seller_email',
    'sellerFiscalCounty', 'sellerFiscalPostalCode', 'sellerFiscalCity', 'sellerFiscalSector', 'sellerFiscalStreet', 'sellerFiscalStreetNo',
    'sellerRepresentant', 'sellerQuality', 'reprCISeries', 'reprCINumber', 'reprCNP', 'reprPhone', 'reprEmail',
    'buyerName', 'buyer_judet', 'buyerPostalCode', 'buyer_city', 'buyer_sector', 'buyerStreet', 'buyerStreetNo', 'buyerBlock', 'buyerBuilding', 'buyerFloor', 'buyerApartment', 'buyerCISeries', 'buyerCINumber', 'buyerCNP', 'buyerPhone', 'buyerEmail',
    'buyerFiscalCounty', 'buyerFiscalPostalCode', 'buyerFiscalCity', 'buyerFiscalSector', 'buyerFiscalStreet', 'buyerFiscalStreetNo',
    'buyerRepresentant', 'buyerQuality', 'buyerRepresCISeries', 'buyerRepresCINumber', 'buyerRepresCNP', 'buyerRepresPhone', 'buyerRepresEmail',
    'make', 'type', 'chassisSeries', 'motorSeries', 'cilCapacity', 'maxWeight', 'regNumber', 'ITPExpirationDate', 'vehicleIDCardNumber', 'productionYear', 'euroStandard', 'acquiredDate', 'acquiredActType', 'acquiredActDetails', 'figurePrice', 'lettersPrice',
    'proprietarNume', 'proprietarCnp', 'proprietarAct', 'chiriasNume', 'chiriasCnp', 'chiriasAct', 'imobilAdresa', 'imobilInventar', 'imobilDurata', 'imobilDataStart', 'imobilChirie', 'imobilGarantie',
    'demisFirma', 'demisNume', 'demisFunctie', 'demisDepartament', 'demisAdresa', 'demisAct', 'demisCnp', 'demisCimNr', 'demisCimData', 'demisZilePreaviz', 'demisDataStart', 'demisDataSfarsit', 'demisTipFormat'
];

function initAutoSave() {
    elementeFormular.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const v = localStorage.getItem('act_peloc_' + id);
        if (v !== null) el.value = v;
        el.addEventListener('input', () => { localStorage.setItem('act_peloc_' + id, el.value); });
    });
    incarcaProfilSalvat();
    incarcaTemaSalvata();
    initCanvasSemnatura('sigProprietarCanvas');
    initCanvasSemnatura('sigChiriasCanvas');
    initCanvasSemnatura('sigDemisieCanvas');
}

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

function stergeSalvareaLocala() {
    elementeFormular.forEach(id => {
        localStorage.removeItem('act_peloc_' + id);
    });
}

function arataNotificare(msg, error = false) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.innerText = msg;
    toast.className = error ? 'error' : '';
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function valideazaCNP(cnp) {
    return /^\d{13}$/.test(cnp.trim());
}

function valideazaEmail(email) {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function valideazaPasCurent() {
    if (tipContractCurent === 'imobiliare' || tipContractCurent === 'demisie') return true;
    if (currentStep === 1 && userRole === 'vanzator') {
        const cnpEl = document.getElementById('seller_ci_cnp');
        const emailEl = document.getElementById('seller_email');
        const cnp = cnpEl ? cnpEl.value : '';
        const email = emailEl ? emailEl.value : '';

        if (cnp && !valideazaCNP(cnp)) {
            arataNotificare("⚠️ CNP-ul vânzătorului trebuie să conțină exact 13 cifre!", true);
            if (cnpEl) cnpEl.focus();
            return false;
        }
        if (email && !valideazaEmail(email)) {
            arataNotificare("⚠️ E-mailul vânzătorului nu este valid!", true);
            if (emailEl) emailEl.focus();
            return false;
        }
    }
    return true;
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    const mainMenu = document.getElementById('mainMenuContainer');
    const dashView = document.getElementById('dashboardView');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const progressBar = document.getElementById('progressBarContainer');

    if (mainMenu) mainMenu.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (progressBar) progressBar.style.display = 'flex';
    
    const p2 = document.getElementById('p2'), p3 = document.getElementById('p3'), p4 = document.getElementById('p4');
    const step4Desc = document.getElementById('step4Desc');
    const localActions = document.getElementById('localActions');
    const waitingContainer = document.getElementById('waitingAnimationContainer');
    const finalDownload = document.getElementById('finalDownloadContainer');
    const imobSemnaturi = document.getElementById('imobiliareSemnaturiContainer');
    
    if (tipContractCurent === 'imobiliare') {
        if(p2) p2.style.display = 'none';
        if(p3) p3.style.display = 'none';
        if(p4) p4.style.display = 'none';
        if(localActions) localActions.style.display = (mod === 'remote') ? 'block' : 'none';
        if(waitingContainer) waitingContainer.style.display = 'none';
        if(finalDownload) finalDownload.style.display = (mod === 'local') ? 'block' : 'none';
        if(imobSemnaturi) imobSemnaturi.style.display = 'block';
        
        if (mod === 'remote') {
            document.getElementById('proprietarSignBox').style.display = 'block';
            document.getElementById('chiriasSignBox').style.display = 'none';
            if(step4Desc) step4Desc.innerText = "Semnați ca proprietar și generați linkul pentru chiriaș.";
        } else {
            document.getElementById('proprietarSignBox').style.display = 'block';
            document.getElementById('chiriasSignBox').style.display = 'block';
            if(step4Desc) step4Desc.innerText = "Toate datele au fost completate. Semnați și generați contractul.";
        }
    } else if (mod === 'local') {
        if(p2) p2.style.display = 'flex';
        if(p3) p3.innerText = '3';
        if(p4) { p4.innerText = '4'; p4.style.display = 'flex'; }
        
        if(localActions) localActions.style.display = 'none';
        if(waitingContainer) waitingContainer.style.display = 'none';
        if(finalDownload) finalDownload.style.display = 'block';
        if(imobSemnaturi) imobSemnaturi.style.display = 'none';
        if(step4Desc) step4Desc.innerText = "Tranzacție locală pregătită. Confirmați pentru descărcare.";
    } else {
        if(p2) p2.style.display = 'none';
        if(p3) p3.innerText = '2';
        if(p4) { p4.style.display = 'none'; }

        if(localActions) localActions.style.display = 'block';
        if(waitingContainer) waitingContainer.style.display = 'none';
        if(finalDownload) finalDownload.style.display = 'none';
        if(imobSemnaturi) imobSemnaturi.style.display = 'none';
        if(step4Desc) step4Desc.innerText = "Generați linkul securizat pentru a-l trimite cumpărătorului.";
    }

    currentStep = 1;
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    const step1 = document.getElementById('step1');
    if (step1) step1.classList.add('active');
    updateProgress();
}

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

function updateProgress() {
    if (tipContractCurent === 'imobiliare' || tipContractCurent === 'demisie') return;
    const total = (modLucru === 'remote' && userRole === 'vanzator') ? 2 : 4;
    for (let i = 1; i <= 4; i++) {
        const p = document.getElementById('p' + i);
        if (!p) continue;
        p.style.display = (i > total) ? 'none' : 'flex';
        p.classList.remove('active', 'completed');
        if (i < currentStep) p.classList.add('completed');
        if (i === currentStep) p.classList.add('active');
    }
}

function nextStep(step) {
    if (!valideazaPasCurent()) return;

    if (tipContractCurent === 'demisie') {
        if (step === 1) {
            const step1 = document.getElementById('step1');
            const step4 = document.getElementById('step4');
            const titleStep4 = document.getElementById('titleStep4');
            const step4Desc = document.getElementById('step4Desc');
            const localActions = document.getElementById('localActions');
            const waitingContainer = document.getElementById('waitingAnimationContainer');
            const finalDownload = document.getElementById('finalDownloadContainer');
            const imobSemnaturi = document.getElementById('imobiliareSemnaturiContainer');
            const btnDescarca = document.getElementById('btnDescarcaOficial');

            if (step1) step1.classList.remove('active');
            if (step4) step4.classList.add('active');
            if (titleStep4) titleStep4.innerText = "Pasul Final: Cerere Demisie Pregătită";
            if (step4Desc) step4Desc.innerText = "Verificați datele introduse. Cererea conține formatul selectat și semnătura dumneavoastră.";
            if (localActions) localActions.style.display = 'none';
            if (waitingContainer) waitingContainer.style.display = 'none';
            if (finalDownload) finalDownload.style.display = 'block';
            if (imobSemnaturi) imobSemnaturi.style.display = 'none';
            if (btnDescarca) btnDescarca.innerText = "📥 Descarcă Cererea de Demisie PDF";
            if (btnDescarca) btnDescarca.setAttribute('onclick', 'genereazaCerereDemisiePDF()');
            currentStep = 4;
        }
        return;
    }

    if (tipContractCurent === 'imobiliare') {
        if (step === 1) {
            const step1 = document.getElementById('step1');
            const step4 = document.getElementById('step4');
            const titleStep4 = document.getElementById('titleStep4');
            const step4Desc = document.getElementById('step4Desc');
            const localActions = document.getElementById('localActions');
            const waitingContainer = document.getElementById('waitingAnimationContainer');
            const finalDownload = document.getElementById('finalDownloadContainer');
            const imobSemnaturi = document.getElementById('imobiliareSemnaturiContainer');
            const btnDescarca = document.getElementById('btnDescarcaOficial');

            if (step1) step1.classList.remove('active');
            if (step4) step4.classList.add('active');
            if (titleStep4) titleStep4.innerText = isRemoteTenantView ? "Pasul Final: Vizualizare & Semnare Chiriaș" : "Pasul 2: Semnături & Finalizare Contract Imobiliar";
            
            if (isRemoteTenantView) {
                if (step4Desc) step4Desc.innerText = "Verificați detaliile contractului de mai sus și semnați în caseta de mai jos:";
                if (localActions) localActions.style.display = 'none';
                if (waitingContainer) waitingContainer.style.display = 'none';
                if (finalDownload) finalDownload.style.display = 'block';
                if (imobSemnaturi) imobSemnaturi.style.display = 'block';
                document.getElementById('proprietarSignBox').style.display = 'none';
                document.getElementById('chiriasSignBox').style.display = 'block';
                if (btnDescarca) btnDescarca.innerText = "📥 Semnează și Descarcă Contractul";
            } else {
                if (step4Desc) step4Desc.innerText = modLucru === 'remote' ? "Semnați ca proprietar și generați linkul pentru chiriaș:" : "Toate datele au fost completate. Semnați și generați contractul:";
                if (localActions) localActions.style.display = modLucru === 'remote' ? 'block' : 'none';
                if (waitingContainer) waitingContainer.style.display = 'none';
                if (finalDownload) finalDownload.style.display = modLucru === 'local' ? 'block' : 'none';
                if (imobSemnaturi) imobSemnaturi.style.display = 'block';
                if (btnDescarca) btnDescarca.setAttribute('onclick', 'genereazaContractImobiliarPDF()');
            }
            currentStep = 4;
        }
        return;
    }

    const stepEl = document.getElementById('step' + step);
    if (stepEl) stepEl.classList.remove('active');
    
    if (modLucru === 'remote' && userRole === 'vanzator' && step === 1) {
        currentStep = 3;
    } else if (modLucru === 'remote' && userRole === 'vanzator' && step === 3) {
        currentStep = 4;
    } else {
        currentStep = step + 1;
    }

    if (currentStep === 4) {
        if (modLucru === 'local') {
            const localActions = document.getElementById('localActions');
            const waitingContainer = document.getElementById('waitingAnimationContainer');
            const finalDownload = document.getElementById('finalDownloadContainer');
            const imobSemnaturi = document.getElementById('imobiliareSemnaturiContainer');
            const btnDescarca = document.getElementById('btnDescarcaOficial');

            if (localActions) localActions.style.display = 'none';
            if (waitingContainer) waitingContainer.style.display = 'none';
            if (finalDownload) finalDownload.style.display = 'block';
            if (imobSemnaturi) imobSemnaturi.style.display = 'none';
            if (btnDescarca) btnDescarca.setAttribute('onclick', 'genereazaContractOficialPDF()');
        }
    }

    const nextStepEl = document.getElementById('step' + currentStep);
    if (nextStepEl) nextStepEl.classList.add('active');
    updateProgress();
}

function prevStep(step) {
    if (tipContractCurent === 'imobiliare' || tipContractCurent === 'demisie') {
        if (step === 4 && !isRemoteTenantView) {
            const step4 = document.getElementById('step4');
            const step1 = document.getElementById('step1');
            if (step4) step4.classList.remove('active');
            if (step1) step1.classList.add('active');
            currentStep = 1;
        }
        return;
    }

    const stepEl = document.getElementById('step' + step);
    if (stepEl) stepEl.classList.remove('active');

    if (modLucru === 'remote' && userRole === 'vanzator' && step === 3) { currentStep = 1; }
    else if (modLucru === 'remote' && userRole === 'vanzator' && step === 4) { currentStep = 3; }
    else { currentStep = step - 1; }

    const prevStepEl = document.getElementById('step' + currentStep);
    if (prevStepEl) prevStepEl.classList.add('active');
    updateProgress();
}

function finalizarePas() {
    nextStep(currentStep);
}

window.onload = async function() {
    initAutoSave();
    initSplashTimer();

    const params = new URLSearchParams(window.location.search);
    if (params.has('ref')) {
        codReferralPrimit = decodeURIComponent(params.get('ref'));
        const referralBanner = document.getElementById('referralAlertBanner');
        if (referralBanner) referralBanner.style.display = 'flex';
        setTimeout(() => { deschideModalAuth('inregistrare'); }, 1200);
    }

    if (params.has('remote_imob')) {
        isRemoteTenantView = true;
        tipContractCurent = 'imobiliare';
        
        const dateSalvate = JSON.parse(localStorage.getItem('act_peloc_remote_imob') || '{}');
        for (let key in dateSalvate) {
            const el = document.getElementById(key);
            if (el) el.value = dateSalvate[key];
        }

        document.getElementById('mainMenuContainer').style.display = 'none';
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step4').classList.add('active');
        document.getElementById('titleStep4').innerText = "Vizualizare Contract & Semnătură Chiriaș";
        document.getElementById('step4Desc').innerText = "Proprietarul a completat datele de mai jos. Vă rugăm să le verificați și să semnați:";
        document.getElementById('localActions').style.display = 'none';
        document.getElementById('waitingAnimationContainer').style.display = 'none';
        document.getElementById('finalDownloadContainer').style.display = 'block';
        document.getElementById('imobiliareSemnaturiContainer').style.display = 'block';
        document.getElementById('proprietarSignBox').style.display = 'none';
        document.getElementById('chiriasSignBox').style.display = 'block';
        document.getElementById('btnDescarcaOficial').innerText = "📥 Semnează și Descarcă Contractul Oficial";
        document.getElementById('btnDescarcaOficial').setAttribute('onclick', 'genereazaContractImobiliarPDF()');
        document.getElementById('btnGroupBackFinal').style.display = 'none';
    }
};

function colecteazaDate() {
    let d = {};
    elementeFormular.forEach(id => {
        const el = document.getElementById(id);
        d[id] = el ? String(el.value || '').toUpperCase().trim() : '';
    });
    return d;
}

function pornesteFluxRemote() {
    if (tipContractCurent === 'imobiliare') {
        const d = colecteazaDate();
        localStorage.setItem('act_peloc_remote_imob', JSON.stringify(d));
        globalSessionId = 'IMOB-' + Math.floor(100000 + Math.random() * 900000);
        linkCumparatorGlobal = `${window.location.origin}${window.location.pathname}?remote_imob=${globalSessionId}`;
        
        document.getElementById('localActions').style.display = 'none';
        document.getElementById('waitingAnimationContainer').style.display = 'block';
        const qrcodeEl = document.getElementById('qrcode');
        if (qrcodeEl) {
            qrcodeEl.innerHTML = "";
            new QRCode(qrcodeEl, { text: linkCumparatorGlobal, width: 120, height: 120 });
        }
        document.getElementById('shareLinkContainer').innerText = linkCumparatorGlobal;
        arataNotificare("✅ Link generat cu succes pentru chiriaș!");
        return;
    }

    pornesteFluxRemoteAuto();
}

async function pornesteFluxRemoteAuto() {
    if (!valideazaPasCurent()) return;
    const d = colecteazaDate();
    try {
        const res = await fetch('/api/creeaza-tranzactie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        const json = await res.json();
        if (json.success) {
            globalSessionId = json.sessionId;
            linkCumparatorGlobal = `${window.location.origin}${window.location.pathname}?sessionId=${globalSessionId}`;
            const localActions = document.getElementById('localActions');
            const waitingContainer = document.getElementById('waitingAnimationContainer');
            const qrcodeEl = document.getElementById('qrcode');
            const shareLinkEl = document.getElementById('shareLinkContainer');

            if (localActions) localActions.style.display = 'none';
            if (waitingContainer) waitingContainer.style.display = 'block';
            if (qrcodeEl) {
                qrcodeEl.innerHTML = "";
                new QRCode(qrcodeEl, { text: linkCumparatorGlobal, width: 120, height: 120 });
            }
            if (shareLinkEl) shareLinkEl.innerText = linkCumparatorGlobal;
        }
    } catch(e) { arataNotificare("Sesiune locală creată cu succes!", true); }
}

function copiazaLinkul() {
    navigator.clipboard.writeText(linkCumparatorGlobal).then(() => { arataNotificare("📋 Link copiat în clipboard!"); });
}
function trimitePeWhatsApp() {
    const msg = encodeURIComponent(`Salut! Accesează linkul pentru a vizualiza și semna contractul de închiriere: ${linkCumparatorGlobal}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

const curataDiacritice = (text) => {
    if (!text) return '';
    return String(text).toUpperCase()
        .replace(/Ă/g, 'A').replace(/Â/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/Ș/g, 'S').replace(/Ş/g, 'S')
        .replace(/Ț/g, 'T').replace(/Ţ/g, 'T');
};

async function genereazaContractOficialPDF() {
    const chassisEl = document.getElementById('chassisSeries');
    if (!chassisEl) return;
    const vin = chassisEl.value.trim();
    if (vin.length !== 17) {
        arataNotificare("⚠️ Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true);
        chassisEl.focus();
        return;
    }
    arataNotificare("Se generează contractul oficial auto...");
    try {
        const d = colecteazaDate();
        const resT = await fetch('contract-instrainare-dobandire-auto-model-2026-ITL-054.pdf');
        const tBytes = await resT.arrayBuffer();
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(tBytes);
        const form = pdfDoc.getForm();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        elementeFormular.forEach(id => {
            try {
                const f = form.getTextField(id);
                if (f && d[id]) {
                    let valFinala = String(d[id]).toUpperCase();
                    if (id === 'maxWeight' && !valFinala.includes('KG')) valFinala += ' KG';
                    f.setText("    " + curataDiacritice(valFinala));
                    f.setFont(font);
                    f.setFontSize(7.5);
                }
            } catch(e){}
        });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_AUTO_ITL_054.pdf";
        a.click();

        salveazaInArhivaprivata({ idAct: 'ACT-' + Math.floor(1000 + Math.random()*9000), numeClient: d['buyerName'] || 'Cumpărător' });
        stergeSalvareaLocala();
        arataNotificare("✅ Contract auto generat și salvat în arhivă!");
    } catch(e) { arataNotificare("Eroare generare PDF: " + e.message, true); }
}

async function genereazaContractImobiliarPDF() {
    arataNotificare("Se generează contractul imobiliar cu inventar și semnături...");
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;

        const deseneazaFooter = () => {
            page.drawText(curataDiacritice("Generat prin ActPeLoc.ro — Toate drepturile rezervate"), { 
                x: 45, y: 30, size: 8, font, color: PDFLib.rgb(0.5, 0.5, 0.5) 
            });
        };

        const deseneazaTitluSectiune = (text) => {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 8.5, font: fontBold });
            y -= 13;
        };

        const deseneazaParagraf = (text) => {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 7, font });
            y -= 11;
        };

        const titluText = "CONTRACT DE INCHIRIERE LOCUINTA";
        const textWidth = fontBold.widthOfTextAtSize(titluText, 12);
        const centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 12, font: fontBold });
        y -= 20;

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Locator (Proprietar): ${getVal('proprietarNume') || '....................................'},`);
        deseneazaParagraf(`CNP: ${getVal('proprietarCnp') || '................'}, CI seria: ${getVal('proprietarAct') || '........'}.`);
        deseneazaParagraf(`1.2. Locatar (Chirias): ${getVal('chiriasNume') || '....................................'},`);
        deseneazaParagraf(`CNP: ${getVal('chiriasCnp') || '................'}, CI seria: ${getVal('chiriasAct') || '........'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI SI DESTINATIA");
        deseneazaParagraf(`2.1. Locatorul inchiriaza Locatarului imobilul cu destinatia exclusiva de locuinta, situat in:`);
        deseneazaParagraf(`${getVal('imobilAdresa') || '..................................................................................................................'}.`);
        
        const inventarInput = getVal('imobilInventar');
        if (inventarInput) {
            deseneazaParagraf(`2.2. Imobilul se preda utilat si mobilat, urmatorul inventar fiind preluat in buna stare: ${inventarInput}.`);
        } else {
            deseneazaParagraf(`2.2. Imobilul este predat in stare buna de utilizare, conform intelegerii prealabile a partilor.`);
        }
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract se incheie pe o perioada de ${getVal('imobilDurata') || '12 LUNI'}, incepand cu data de ${getVal('imobilDataStart') || '01.09.2026'}.`);
        deseneazaParagraf(`3.2. La expirarea termenului, contractul poate fi prelungit prin acordul scris al ambelor parti.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 4: CHIRIA, GARANTIA SI MODALITATEA DE PLATA");
        deseneazaParagraf(`4.1. Chiria lunara stabilita este in cuantum de ${getVal('imobilChirie') || '350 EUR'}, achitata in avans pana la data de 5 a fiecarei luni.`);
        deseneazaParagraf(`4.2. Cu titlu de garantie, Locatarul achita la semnare suma de ${getVal('imobilGarantie') || '350 EUR'}, destinata acoperirii daunelor sau utilitatilor neachitate.`);
        deseneazaParagraf(`4.3. Garantia se restituie in termen de cel mult 7 zile calendaristice de la predarea imobilului si achitarea datoriilor.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 5: DREPTURILE SI OBLIGATIILE PARTILOR");
        deseneazaParagraf(`5.1. Locatorul garanteaza linistita folosinta a imobilului și nu poate interveni in spatiu fara notificare prealabila.`);
        deseneazaParagraf(`5.2. Locatarul se obliga sa achite la termen chiria, cotele de intretinere, consumul de energie, gaze și apa pe baza contoarelor.`);
        deseneazaParagraf(`5.3. Subinchirierea totala sau partiala catre terti, precum și desfasurarea de activitati comerciale sunt strict interzise.`);
        deseneazaParagraf(`5.4. Reparatiile capitale cad in sarcina Locatorului, în timp ce reparatiile curente și intretinerea locuintei revin Locatarului.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 6: REGULI SPECIALE (ANIMALE DE COMPANIE SI FUMAT)");
        deseneazaParagraf(`6.1. Detinerea de animale de companie in imobil este permisa doar cu acordul prealabil scris al Locatorului.`);
        deseneazaParagraf(`6.2. Fumatul in interiorul imobilului este strict interzis, eventualele daune sau mirosuri persistente fiind suportate integral de Locatar.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 7: MODIFICARI STRUCTURALE SI INSPECTIA IMOBILULUI");
        deseneazaParagraf(`7.1. Locatarul nu poate efectua modificari structurale, zugraveli majore sau interventii la instalatii fara acordul scris al Locatorului.`);
        deseneazaParagraf(`7.2. Locatorul are dreptul de a inspecta starea imobilului cu o notificare prealabila de minim 48 de ore adresata Locatarului.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 8: INCETAREA SI REZILIEREA ANTICIPATA");
        deseneazaParagraf(`8.1. Prezentul contract poate fi denuntat unilateral de oricare dintre parti, cu un preaviz scris de minim 60 de zile.`);
        deseneazaParagraf(`8.2. Nerespectarea obligatiilor contractuale de catre una dintre parti atrage rezilierea de plin drept și plata de daune-interese.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 9: FORTA MAJORA SI LITIGII");
        deseneazaParagraf(`9.1. Forta majora exonereaza de raspundere partea care o invoca, în conditiile legii.`);
        deseneazaParagraf(`9.2. Litigiile decurgand din acest contract se vor solutiona pe cale amiabila sau, în caz de esec, de instantele judecatoresti competente.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 10: DISPOZITII FINALE SI FISCALE (ANAF)");
        deseneazaParagraf(`10.1. Prezentul contract constituie titlu executoriu conform dispozitiilor Codului de Procedura Civila.`);
        deseneazaParagraf(`10.2. Locatorul are obligatia legala de inregistrare a contractului la organul fiscal competent (ANAF) în termen de 30 zile.`);
        y -= 15;

        if (y < 160) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }

        page.drawText(curataDiacritice(`Incheiat astazi, ${new Date().toLocaleDateString('ro-RO')}, in 2 exemplare originale, conform Codului Civil.`), { x: 45, y, size: 7.5, font: fontBold });
        y -= 22;
        
        deseneazaTitluSectiune("SEMNATURILE PARTILOR:");
        y -= 4;

        const sigPropCanvas = document.getElementById('sigProprietarCanvas');
        const sigChirCanvas = document.getElementById('sigChiriasCanvas');
        
        if (sigPropCanvas && sigPropCanvas.offsetParent !== null) {
            const sigPImageBytes = await pdfDoc.embedPng(sigPropCanvas.toDataURL('image/png'));
            page.drawImage(sigPImageBytes, { x: 45, y: y - 50, width: 120, height: 40 });
        }
        if (sigChirCanvas && sigChirCanvas.offsetParent !== null) {
            const sigCImageBytes = await pdfDoc.embedPng(sigChirCanvas.toDataURL('image/png'));
            page.drawImage(sigCImageBytes, { x: 310, y: y - 50, width: 120, height: 40 });
        }

        page.drawText(curataDiacritice("Semnatura Proprietar (Locator)"), { x: 45, y: y - 62, size: 7, font: fontBold });
        page.drawText(curataDiacritice("Semnatura Chirias (Locatar)"), { x: 310, y: y - 62, size: 7, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_INCHIRIERE_ACTPELOC.pdf";
        a.click();

        salveazaInArhivaprivata({ idAct: 'IMOB-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('chiriasNume') || 'Chiriaș') });
        arataNotificare("✅ Contract imobiliar generat cu succes cu tot cu inventar!");
    } catch(e) { arataNotificare("Eroare PDF: " + e.message, true); }
}

async function genereazaCerereDemisiePDF() {
    arataNotificare("Se generează cererea de demisie...");
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const tipFormat = getVal('demisTipFormat') || 'simpla';
        const firma = getVal('demisFirma') || '...................................................';
        const nume = getVal('demisNume') || '...................................................';
        const functie = getVal('demisFunctie') || '....................';
        const departament = getVal('demisDepartament') || '....................';
        const adresa = getVal('demisAdresa') || '....................................................................';
        const act = getVal('demisAct') || '........';
        const cnp = getVal('demisCnp') || '...................';
        const cimNr = getVal('demisCimNr') || '....';
        const cimData = getVal('demisCimData') || '............';
        const zilePreaviz = getVal('demisZilePreaviz') || '20 ZILE LUCRATOARE';
        const dataStart = getVal('demisDataStart') || '............';
        const dataSfarsit = getVal('demisDataSfarsit') || '............';

        page.drawText(curataDiacritice(`CĂTRE CONDUCEREA: ${firma}`), { x: 45, y, size: 9, font: fontBold });
        y -= 30;

        const titluText = "CERERE DE DEMISIE";
        const textWidth = fontBold.widthOfTextAtSize(titluText, 13);
        const centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 13, font: fontBold });
        y -= 35;

        const p1 = `Subsemnatul/a ${nume}, având funcția de ${functie} în cadrul departamentului ${departament}, domiciliat/ă în ${adresa}, posesor/posesoare al/a CI seria ${act}, CNP ${cnp}, angajat/ă în baza Contractului Individual de Muncă nr. ${cimNr} din data de ${cimData}.`;
        
        page.drawText(curataDiacritice(p1), { x: 45, y, size: 8.5, font, maxWidth: 505 });
        y -= 65;

        if (tipFormat === 'simpla') {
            const pSimpla = `Prin prezenta vă notific încetarea contractului individual de muncă prin demisie, cu respectarea termenului de preaviz de ${zilePreaviz}, începând cu data de ${dataStart} și având ca ultimă zi de activitate data de ${dataSfarsit}.`;
            page.drawText(curataDiacritice(pSimpla), { x: 45, y, size: 9, font, maxWidth: 505 });
            y -= 75;

            page.drawText(curataDiacritice("Vă rog să luați act de prezenta cerere și să o înregistrați."), { x: 45, y, size: 9, font: fontBold });
            y -= 50;
        } else {
            const p2 = `Prin prezenta, în conformitate cu prevederile art. 81 din Legea nr. 53/2003 (Codul Muncii), vă aduc la cunoștință încetarea contractului individual de muncă prin demisie.`;
            page.drawText(curataDiacritice(p2), { x: 45, y, size: 8.5, font, maxWidth: 505 });
            y -= 45;

            const p3 = `Termenul de preaviz de ${zilePreaviz}, conform prevederilor legale, va începe să curgă începând cu data de ${dataStart}, ultima zi de activitate și de prezență la locul de muncă urmând să fie la data de ${dataSfarsit}.`;
            page.drawText(curataDiacritice(p3), { x: 45, y, size: 8.5, font, maxWidth: 505 });
            y -= 55;

            const p4 = `Solicit conducerii societății ca la data încetării contractului să îmi fie achitate drepturile salariale cuvenite la zi, inclusiv compensarea în bani a zilelor de concediu de odihnă efectuate sau neefectuate, și să mi se elibereze adeverința de vechime / extrasul REVISAL și nota de lichidare.`;
            page.drawText(curataDiacritice(p4), { x: 45, y, size: 8.5, font, maxWidth: 505 });
            y -= 65;

            page.drawText(curataDiacritice("Vă rog să luați act de prezenta cerere și să o înregistrați la registratura societății."), { x: 45, y, size: 8.5, font: fontBold });
            y -= 40;
        }

        page.drawText(curataDiacritice(`Data formulării: ${new Date().toLocaleDateString('ro-RO')}`), { x: 45, y, size: 8.5, font });
        y -= 40;

        const sigDemCanvas = document.getElementById('sigDemisieCanvas');
        if (sigDemCanvas && sigDemCanvas.offsetParent !== null) {
            const sigBytes = await pdfDoc.embedPng(sigDemCanvas.toDataURL('image/png'));
            page.drawImage(sigBytes, { x: 45, y: y - 55, width: 140, height: 45 });
        }

        page.drawText(curataDiacritice("Semnătura Salariatului"), { x: 45, y: y - 68, size: 8, font: fontBold });

        // Casetă HR
        page.drawRectangle({ x: 310, y: y - 85, width: 240, height: 80, borderColor: PDFLib.rgb(0.3, 0.3, 0.3), borderWidth: 1 });
        page.drawText(curataDiacritice("REZERVAT PENTRU ANGAJATOR (HR)"), { x: 320, y: y - 15, size: 7.5, font: fontBold });
        page.drawText(curataDiacritice("Luat la cunoștință, Data: ........................"), { x: 320, y: y - 35, size: 7, font });
        page.drawText(curataDiacritice("Nr. înregistrare: ...................................."), { x: 320, y: y - 50, size: 7, font });
        page.drawText(curataDiacritice("Semnătura și ștampila: ........................"), { x: 320, y: y - 65, size: 7, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CERERE_DEMISIE_OFICIALA.pdf";
        a.click();

        salveazaInArhivaprivata({ idAct: 'DEM-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('demisNume') || 'Salariat') });
        arataNotificare("✅ Cererea de demisie a fost generată și salvată cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Demisie: " + e.message, true); }
}