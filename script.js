let currentStep = 1;
let buyerCurrentStep = 1;
let modLucru = 'local';
let tipContractCurent = 'auto';
let globalSessionId = null;
let userRole = 'vanzator';
let pollInterval = null;
let domiciliuFiscalDiferit = false;
let esteFirmaSauMandatar = false;
let linkCumparatorGlobal = "";

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
        document.getElementById('themeToggleBtn').innerText = "☀️";
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
    document.getElementById('authModal').style.display = 'flex';
}

function inchideModalAuth() {
    document.getElementById('authModal').style.display = 'none';
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
        title.innerText = "Autentificare Cont";
        subtitle.innerText = "Introdu e-mailul și parola unică pentru a te loga.";
        btn.innerText = "🔑 Intră în Cont";
        regFields.forEach(el => el.style.display = 'none');
        switchCont.innerHTML = `Nu ai un cont? <span style="color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="schimbaModulAuth('inregistrare')">Creează-ți unul chiar acum</span>`;
    } else {
        title.innerText = "Creare Cont Nou";
        subtitle.innerText = "Alege pachetul și setează datele tale de acces.";
        btn.innerText = "🚀 Creează Cont & Activează";
        regFields.forEach(el => el.style.display = 'block');
        switchCont.innerHTML = `Ai deja un cont? <span style="color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="schimbaModulAuth('logare')">Autentifică-te aici</span>`;
    }
}

function gestioneazaClickContulMeu() {
    if (!profilCurent) {
        deschideModalAuth('logare');
    } else {
        const menu = document.getElementById('profileDropdownMenu');
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
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
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const parola = document.getElementById('authPassword').value;

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
    document.getElementById('userStatusText').innerText = profilCurent.email.split('@')[0];
    document.getElementById('userAvatarText').innerText = profilCurent.email.charAt(0).toUpperCase();
    document.getElementById('dropdownEmailText').innerText = profilCurent.email;
    document.getElementById('dashNavBtn').style.display = 'inline-flex';
}

function deconectareUtilizator() {
    localStorage.removeItem('act_peloc_utilizator_activ');
    profilCurent = null;
    document.getElementById('userStatusText').innerText = "Contul Meu";
    document.getElementById('userAvatarText').innerText = "👤";
    document.getElementById('dashNavBtn').style.display = 'none';
    document.getElementById('profileDropdownMenu').style.display = 'none';
    arataNotificare("V-ați deconectat cu succes!");
    deschideMeniuPrincipal();
}

function acceseazaDashboardTab(tabName) {
    document.getElementById('profileDropdownMenu').style.display = 'none';
    if (!profilCurent) {
        arataNotificare("⚠️ Autentificați-vă pentru a accesa Dashboard-ul!", true);
        deschideModalAuth('logare');
        return;
    }
    document.getElementById('mainMenuContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('dashboardView').style.display = 'block';

    incarcaDateDashboard();

    if (tabName === 'arhiva') schimbaTabDash('arhiva', document.querySelectorAll('.dash-tab-btn')[0]);
    if (tabName === 'abonament') schimbaTabDash('abonament', document.querySelectorAll('.dash-tab-btn')[2]);
    if (tabName === 'afiliere') schimbaTabDash('afiliere', document.querySelectorAll('.dash-tab-btn')[3]);
    if (tabName === 'setari') {
        schimbaTabDash('setari', document.querySelectorAll('.dash-tab-btn')[4]);
        document.getElementById('settingsNewEmail').value = profilCurent.email;
    }
}

function schimbaTabDash(tabName, btnEl) {
    document.querySelectorAll('.dash-section').forEach(el => {
        if (el.id.startsWith('dashTab')) el.classList.remove('active');
    });
    document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));

    if (tabName === 'arhiva') document.getElementById('dashTabArhiva').classList.add('active');
    if (tabName === 'nou') document.getElementById('dashTabNou').classList.add('active');
    if (tabName === 'abonament') document.getElementById('dashTabAbonament').classList.add('active');
    if (tabName === 'afiliere') document.getElementById('dashTabAfiliere').classList.add('active');
    if (tabName === 'setari') document.getElementById('dashTabSetari').classList.add('active');

    if (btnEl) btnEl.classList.add('active');
}

function actualizeazaEmailCont() {
    const nouEmail = document.getElementById('settingsNewEmail').value.trim().toLowerCase();
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
    document.getElementById('infoDashEmail').innerText = profilCurent.email;
    document.getElementById('infoDashProfil').innerText = profilCurent.tip;
    document.getElementById('infoDashPachet').innerText = profilCurent.pachet;
    document.getElementById('infoDashRamase').innerText = profilCurent.ramase;

    const puncte = profilCurent.puncteAfiliere || 0;
    document.getElementById('infoPuncteAfiliere').innerText = `${puncte} punct${puncte !== 1 ? 'e' : ''}`;
    document.getElementById('infoReducereAfiliere').innerText = `${puncte * 30}% reducere pentru următoarele ${puncte} contracte`;

    const linkRef = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(profilCurent.email)}`;
    document.getElementById('myReferralLinkText').innerText = linkRef;

    const lista = document.getElementById('dashboardContracteLista');
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
    navigator.clipboard.writeText(document.getElementById('myReferralLinkText').innerText).then(() => { arataNotificare("📋 Linkul de afiliere a fost copiat!"); });
}
function trimiteAfiliereWhatsApp() {
    const link = document.getElementById('myReferralLinkText').innerText;
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
    document.getElementById('progressBarContainer').style.display = 'none';
    document.getElementById('stepsCompletedBanner').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('mainMenuContainer').style.display = 'block';
    document.getElementById('roleBanner').style.display = 'none';
    currentStep = 1;
}

function selecteazaCategorie(cat) {
    tipContractCurent = cat;
    document.getElementById('mainMenuContainer').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    
    if (cat === 'auto') {
        document.getElementById('modSelectorTitle').innerText = "Mod de Lucru - Contract Auto ITL 054";
        document.getElementById('formAutoStep1').style.display = 'grid';
        document.getElementById('formImobiliareStep1').style.display = 'none';
        document.getElementById('formAutoStep2').style.display = 'grid';
        document.getElementById('formImobiliareStep2').style.display = 'none';
        document.getElementById('modeSelectorContainer').style.display = 'block';
    } else if (cat === 'imobiliare') {
        document.getElementById('modSelectorTitle').innerText = "Mod de Lucru - Contract Imobiliar cu Inventar";
        document.getElementById('formAutoStep1').style.display = 'none';
        document.getElementById('formImobiliareStep1').style.display = 'grid';
        document.getElementById('formAutoStep2').style.display = 'none';
        document.getElementById('formImobiliareStep2').style.display = 'grid';
        document.getElementById('modeSelectorContainer').style.display = 'block';
    }
}

const elementeFormular = [
    'sellerName', 'sellerCounty', 'sellerPostalCode', 'sellerCity', 'seller_sector', 'sellerStreet', 'sellerStreetNo', 'sellerBlock', 'sellerBuilding', 'sellerFloor', 'sellerApartment', 'seller_ci_serie', 'seller_ci_number', 'seller_ci_cnp', 'seller_phone', 'seller_email',
    'sellerFiscalCounty', 'sellerFiscalPostalCode', 'sellerFiscalCity', 'sellerFiscalSector', 'sellerFiscalStreet', 'sellerFiscalStreetNo',
    'sellerRepresentant', 'sellerQuality', 'reprCISeries', 'reprCINumber', 'reprCNP', 'reprPhone', 'reprEmail',
    'buyerName', 'buyer_judet', 'buyerPostalCode', 'buyer_city', 'buyer_sector', 'buyerStreet', 'buyerStreetNo', 'buyerBlock', 'buyerBuilding', 'buyerFloor', 'buyerApartment', 'buyerCISeries', 'buyerCINumber', 'buyerCNP', 'buyerPhone', 'buyerEmail',
    'make', 'type', 'chassisSeries', 'motorSeries', 'cilCapacity', 'maxWeight', 'regNumber', 'ITPExpirationDate', 'vehicleIDCardNumber', 'productionYear', 'euroStandard', 'acquiredDate', 'acquiredActType', 'acquiredActDetails', 'figurePrice', 'lettersPrice',
    'proprietarNume', 'proprietarCnp', 'proprietarAct', 'proprietarAdresa', 'chiriasNume', 'chiriasCnp', 'chiriasAct', 'imobilAdresa', 'imobilInventar', 'imobilDurata', 'imobilDataStart', 'imobilChirie', 'imobilGarantie'
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
    if (tipContractCurent === 'imobiliare') return true;
    if (currentStep === 1 && userRole === 'vanzator') {
        const cnp = document.getElementById('seller_ci_cnp').value;
        const email = document.getElementById('seller_email').value;

        if (cnp && !valideazaCNP(cnp)) {
            arataNotificare("⚠️ CNP-ul vânzătorului trebuie să conțină exact 13 cifre!", true);
            document.getElementById('seller_ci_cnp').focus();
            return false;
        }
        if (email && !valideazaEmail(email)) {
            arataNotificare("⚠️ E-mailul vânzătorului nu este valid!", true);
            document.getElementById('seller_email').focus();
            return false;
        }
    }
    return true;
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    document.getElementById('mainMenuContainer').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('progressBarContainer').style.display = 'flex';
    
    const p2 = document.getElementById('p2'), p3 = document.getElementById('p3'), p4 = document.getElementById('p4');
    
    if (tipContractCurent === 'imobiliare') {
        if(p2) p2.style.display = 'none';
        if(p3) p3.style.display = 'none';
        if(p4) p4.style.display = 'none';
        document.getElementById('localActions').style.display = 'none';
        document.getElementById('waitingAnimationContainer').style.display = 'none';
        document.getElementById('finalDownloadContainer').style.display = 'block';
        document.getElementById('step4Desc').innerText = "Toate datele imobilului și chiriașului au fost completate. Generați contractul.";
    } else if (mod === 'local') {
        if(p2) p2.style.display = 'flex';
        if(p3) p3.innerText = '3';
        if(p4) { p4.innerText = '4'; p4.style.display = 'flex'; }
        
        document.getElementById('localActions').style.display = 'none';
        document.getElementById('waitingAnimationContainer').style.display = 'none';
        document.getElementById('finalDownloadContainer').style.display = 'block';
        document.getElementById('step4Desc').innerText = "Tranzacție locală pregătită. Confirmați pentru descărcare.";
    } else {
        if(p2) p2.style.display = 'none';
        if(p3) p3.innerText = '2';
        if(p4) { p4.style.display = 'none'; }

        document.getElementById('localActions').style.display = 'block';
        document.getElementById('waitingAnimationContainer').style.display = 'none';
        document.getElementById('finalDownloadContainer').style.display = 'none';
        document.getElementById('step4Desc').innerText = "Generați linkul securizat pentru a-l trimite cumpărătorului.";
    }

    currentStep = 1;
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    updateProgress();
}

function comutaDomiciliuFiscal() {
    domiciliuFiscalDiferit = !domiciliuFiscalDiferit;
    document.getElementById('sectiuneFiscala').style.display = domiciliuFiscalDiferit ? 'grid' : 'none';
}
function comutaFirma() {
    esteFirmaSauMandatar = !esteFirmaSauMandatar;
    document.getElementById('sectiuneFirma').style.display = esteFirmaSauMandatar ? 'grid' : 'none';
}

function updateProgress() {
    if (tipContractCurent === 'imobiliare') return;
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

    if (tipContractCurent === 'imobiliare') {
        if (step === 1) {
            // Trecem direct de la formularul complet la pasul de finalizare/semnături
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step4').classList.add('active');
            document.getElementById('titleStep4').innerText = "Pasul 2: Semnături & Finalizare Contract Imobiliar";
            document.getElementById('step4Desc').innerText = "Toate datele proprietarului, chiriașului și imobilului au fost completate mai sus. Alegeți modul de semnare:";
            document.getElementById('localActions').style.display = 'none';
            document.getElementById('waitingAnimationContainer').style.display = 'none';
            document.getElementById('finalDownloadContainer').style.display = 'block';
            document.getElementById('btnDescarcaOficial').setAttribute('onclick', 'genereazaContractImobiliarPDF()');
            currentStep = 4;
        }
        return;
    }

    document.getElementById('step' + step).classList.remove('active');
    
    if (modLucru === 'remote' && userRole === 'vanzator' && step === 1) {
        currentStep = 3;
    } else if (modLucru === 'remote' && userRole === 'vanzator' && step === 3) {
        currentStep = 4;
    } else {
        currentStep = step + 1;
    }

    if (currentStep === 4) {
        if (modLucru === 'local') {
            document.getElementById('localActions').style.display = 'none';
            document.getElementById('waitingAnimationContainer').style.display = 'none';
            document.getElementById('finalDownloadContainer').style.display = 'block';
            document.getElementById('btnDescarcaOficial').setAttribute('onclick', 'genereazaContractOficialPDF()');
        }
    }

    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
}

function prevStep(step) {
    if (tipContractCurent === 'imobiliare') {
        if (step === 4) {
            document.getElementById('step4').classList.remove('active');
            document.getElementById('step1').classList.add('active');
            currentStep = 1;
        }
        return;
    }

    document.getElementById('step' + step).classList.remove('active');
    if (modLucru === 'remote' && userRole === 'vanzator' && step === 3) { currentStep = 1; }
    else if (modLucru === 'remote' && userRole === 'vanzator' && step === 4) { currentStep = 3; }
    else { currentStep = step - 1; }
    document.getElementById('step' + currentStep).classList.add('active');
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
        document.getElementById('referralAlertBanner').style.display = 'flex';
        setTimeout(() => { deschideModalAuth('inregistrare'); }, 1200);
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

async function pornesteFluxRemote() {
    if (!valideazaPasCurent()) return;
    const d = colecteazaDate();
    try {
        const res = await fetch('/api/creeaza-tranzactie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        const json = await res.json();
        if (json.success) {
            globalSessionId = json.sessionId;
            linkCumparatorGlobal = `${window.location.origin}${window.location.pathname}?sessionId=${globalSessionId}`;
            document.getElementById('localActions').style.display = 'none';
            document.getElementById('waitingAnimationContainer').style.display = 'block';
            document.getElementById('qrcode').innerHTML = "";
            new QRCode(document.getElementById('qrcode'), { text: linkCumparatorGlobal, width: 120, height: 120 });
            document.getElementById('shareLinkContainer').innerText = linkCumparatorGlobal;
        }
    } catch(e) { arataNotificare("Sesiune locală creată cu succes!", true); }
}

function copiazaLinkul() {
    navigator.clipboard.writeText(linkCumparatorGlobal).then(() => { arataNotificare("📋 Link copiat în clipboard!"); });
}
function trimitePeWhatsApp() {
    const msg = encodeURIComponent(`Salut! Completează datele pentru contract: ${linkCumparatorGlobal}`);
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
    const vin = document.getElementById('chassisSeries').value.trim();
    if (vin.length !== 17) {
        arataNotificare("⚠️ Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true);
        document.getElementById('chassisSeries').focus();
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

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Locator (Proprietar): ${document.getElementById('proprietarNume').value || '....................................'},`);
        deseneazaParagraf(`CNP: ${document.getElementById('proprietarCnp').value || '................'}, CI seria: ${document.getElementById('proprietarAct').value || '........'}.`);
        deseneazaParagraf(`1.2. Locatar (Chirias): ${document.getElementById('chiriasNume').value || '....................................'},`);
        deseneazaParagraf(`CNP: ${document.getElementById('chiriasCnp').value || '................'}, CI seria: ${document.getElementById('chiriasAct').value || '........'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI SI DESTINATIA");
        deseneazaParagraf(`2.1. Locatorul inchiriaza Locatarului imobilul cu destinatia exclusiva de locuinta, situat in:`);
        deseneazaParagraf(`${document.getElementById('imobilAdresa').value || '..................................................................................................................'}.`);
        
        const inventarInput = document.getElementById('imobilInventar').value.trim();
        if (inventarInput) {
            deseneazaParagraf(`2.2. Imobilul se preda utilat si mobilat, urmatorul inventar fiind preluat in buna stare: ${inventarInput}.`);
        } else {
            deseneazaParagraf(`2.2. Imobilul este predat in stare buna de utilizare, conform intelegerii prealabile a partilor.`);
        }
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract se incheie pe o perioada de ${document.getElementById('imobilDurata').value || '12 LUNI'}, incepand cu data de ${document.getElementById('imobilDataStart').value || '01.09.2026'}.`);
        deseneazaParagraf(`3.2. La expirarea termenului, contractul poate fi prelungit prin acordul scris al ambelor parti.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 4: CHIRIA, GARANTIA SI MODALITATEA DE PLATA");
        deseneazaParagraf(`4.1. Chiria lunara stabilita este in cuantum de ${document.getElementById('imobilChirie').value || '350 EUR'}, achitata in avans pana la data de 5 a fiecarei luni.`);
        deseneazaParagraf(`4.2. Cu titlu de garantie, Locatarul achita la semnare suma de ${document.getElementById('imobilGarantie').value || '350 EUR'}, destinata acoperirii daunelor sau utilitatilor neachitate.`);
        deseneazaParagraf(`4.3. Garantia se restituie in termen de cel mult 7 zile calendaristice de la predarea imobilului si achitarea datoriilor.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 5: DREPTURILE SI OBLIGATIIle PARTILOR");
        deseneazaParagraf(`5.1. Locatorul garanteaza linistita folosinta a imobilului si nu poate interveni in spatiu fara notificare prealabila.`);
        deseneazaParagraf(`5.2. Locatarul se obliga sa achite la termen chiria, cotele de intretinere, consumul de energie, gaze si apa pe baza contoarelor.`);
        deseneazaParagraf(`5.3. Subinchirierea totala sau partiala catre terti, precum si desfasurarea de activitati comerciale sunt strict interzise.`);
        deseneazaParagraf(`5.4. Reparatiile capitale cad in sarcina Locatorului, în timp ce reparatiile curente si intretinerea locuintei revin Locatarului.`);
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

        const sigPImageBytes = await pdfDoc.embedPng(document.getElementById('sigProprietarCanvas').toDataURL('image/png'));
        const sigCImageBytes = await pdfDoc.embedPng(document.getElementById('sigChiriasCanvas').toDataURL('image/png'));

        page.drawImage(sigPImageBytes, { x: 45, y: y - 50, width: 120, height: 40 });
        page.drawImage(sigCImageBytes, { x: 310, y: y - 50, width: 120, height: 40 });

        page.drawText(curataDiacritice("Semnatura Proprietar (Locator)"), { x: 45, y: y - 62, size: 7, font: fontBold });
        page.drawText(curataDiacritice("Semnatura Chirias (Locatar)"), { x: 310, y: y - 62, size: 7, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_INCHIRIERE_ACTPELOC.pdf";
        a.click();

        salveazaInArhivaprivata({ idAct: 'IMOB-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(document.getElementById('chiriasNume').value || 'Chiriaș') });
        arataNotificare("✅ Contract imobiliar generat cu succes cu tot cu inventar!");
    } catch(e) { arataNotificare("Eroare PDF: " + e.message, true); }
}