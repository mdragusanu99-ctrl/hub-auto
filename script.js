let currentStep = 1;
let buyerCurrentStep = 1;
let tipContractCurent = 'auto'; // 'auto' sau 'imobiliare'
let modLucru = 'local';
let globalSessionId = null;
let userRole = 'vanzator';
let pollInterval = null;
let codReferralPrimit = null;
let splashTimerInterval = null;
let profilCurent = null;
let modAuthCurent = 'logare';
let pachetSelectatInregistrare = 'GRATUIT';
let linkCumparatorGlobal = "";

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
        const btn = document.getElementById('themeToggleBtn');
        if(btn) btn.innerText = "☀️";
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
                    <button class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 11px;" onclick="descarcaDinArhiva('${item.idAct}')">📥 Contract</button>
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
    const mesaj = encodeURIComponent(`Salut! Folosește platforma ActPeLoc pentru a genera contracte instant și ai 35% reducere prin acest link: ${link}`);
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

function descarcaDinArhiva(idAct) {
    arataNotificare("Se Redescarcă documentul...");
    if (idAct.startsWith('IMOB')) {
        genereazaContractImobiliarPDF();
    } else {
        genereazaContractOficialPDF();
    }
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
    document.getElementById('modeSelectorContainer').style.display = 'block';
    document.getElementById('modSelectorTitle').innerText = cat === 'auto' ? "Mod de Lucru - Contract Auto ITL 054" : "Mod de Lucru - Contract Imobiliar";
}

function initCanvasuriSemnatura() {
    ['sigProprietarCanvas', 'sigChiriasCanvas'].forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let desenand = false;

        canvas.onmousedown = (e) => { desenand = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
        canvas.onmousemove = (e) => { if (!desenand) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); };
        canvas.onmouseup = () => { desenand = false; };
        canvas.onmouseleave = () => { desenand = false; };

        canvas.ontouchstart = (e) => {
            desenand = true;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            ctx.beginPath();
            ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
            e.preventDefault();
        };
        canvas.ontouchmove = (e) => {
            if (!desenand) return;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
            ctx.stroke();
            e.preventDefault();
        };
        canvas.ontouchend = () => { desenand = false; };
    });
}

function curataCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const elementeFormular = [
    'sellerName', 'sellerCounty', 'sellerPostalCode', 'sellerCity', 'seller_sector', 'sellerStreet', 'sellerStreetNo', 'sellerBlock', 'sellerBuilding', 'sellerFloor', 'sellerApartment', 'seller_ci_serie', 'seller_ci_number', 'seller_ci_cnp', 'seller_phone', 'seller_email',
    'sellerFiscalCounty', 'sellerFiscalPostalCode', 'sellerFiscalCity', 'sellerFiscalSector', 'sellerFiscalStreet', 'sellerFiscalStreetNo',
    'sellerRepresentant', 'sellerQuality', 'reprCISeries', 'reprCINumber', 'reprCNP', 'reprPhone', 'reprEmail',
    'buyerName', 'buyer_judet', 'buyerPostalCode', 'buyer_city', 'buyer_sector', 'buyerStreet', 'buyerStreetNo', 'buyerBlock', 'buyerBuilding', 'buyerFloor', 'buyerApartment', 'buyerCISeries', 'buyerCINumber', 'buyerCNP', 'buyerPhone', 'buyerEmail',
    'make', 'type', 'chassisSeries', 'motorSeries', 'cilCapacity', 'maxWeight', 'regNumber', 'ITPExpirationDate', 'vehicleIDCardNumber', 'productionYear', 'euroStandard', 'acquiredDate', 'acquiredActType', 'acquiredActDetails', 'figurePrice', 'lettersPrice',
    'proprietarNume', 'proprietarCnp', 'proprietarAct', 
    'chiriasNume', 'chiriasCnp', 'chiriasAct', 
    'imobilAdresa', 'imobilInventar', 'imobilDurata', 'imobilDataStart', 'imobilChirie', 'imobilGarantie'
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
}

function stergeSalvareaLocala() {
    elementeFormular.forEach(id => { localStorage.removeItem('act_peloc_' + id); });
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

function valideazaPasCurent() {
    if (tipContractCurent === 'auto') {
        if (currentStep === 1 && userRole === 'vanzator') {
            const campuriObligatorii = ['sellerName', 'sellerCounty', 'sellerPostalCode', 'sellerCity', 'sellerStreet', 'sellerStreetNo', 'seller_ci_serie', 'seller_ci_number', 'seller_ci_cnp'];
            for (let id of campuriObligatorii) {
                const val = document.getElementById(id).value.trim();
                if (!val) { arataNotificare(`⚠️ Completați câmpul obligatoriu!`, true); document.getElementById(id).focus(); return false; }
            }
            if (!valideazaCNP(document.getElementById('seller_ci_cnp').value)) {
                arataNotificare("⚠️ CNP-ul vânzătorului trebuie să aibă 13 cifre!", true); return false;
            }
        }
        if ((userRole === 'cumparator' && buyerCurrentStep === 1) || (currentStep === 2 && modLucru === 'local')) {
            const campuriObligatorii = ['buyerName', 'buyer_judet', 'buyerPostalCode', 'buyer_city', 'buyerStreet', 'buyerStreetNo', 'buyerCISeries', 'buyerCINumber', 'buyerCNP'];
            for (let id of campuriObligatorii) {
                const val = document.getElementById(id).value.trim();
                if (!val) { arataNotificare(`⚠️ Completați câmpul obligatoriu!`, true); document.getElementById(id).focus(); return false; }
            }
            if (!valideazaCNP(document.getElementById('buyerCNP').value)) {
                arataNotificare("⚠️ CNP-ul cumpărătorului trebuie să aibă 13 cifre!", true); return false;
            }
        }
        if (currentStep === 3 && userRole === 'vanzator') {
            const vin = document.getElementById('chassisSeries').value.trim();
            if (vin.length !== 17) { arataNotificare("⚠️ Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true); return false; }
        }
    } else {
        if (currentStep === 1 && userRole === 'vanzator') {
            if (!document.getElementById('proprietarNume').value.trim() || !document.getElementById('proprietarCnp').value.trim() || !document.getElementById('proprietarAct').value.trim()) {
                arataNotificare("⚠️ Completați datele proprietarului!", true); return false;
            }
        }
        if ((userRole === 'cumparator' && buyerCurrentStep === 1) || (currentStep === 2 && modLucru === 'local')) {
            if (!document.getElementById('chiriasNume').value.trim() || !document.getElementById('imobilAdresa').value.trim() || !document.getElementById('imobilChirie').value.trim()) {
                arataNotificare("⚠️ Completați datele chiriașului și imobilului!", true); return false;
            }
        }
    }
    return true;
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('progressBarContainer').style.display = 'flex';
    
    const p2 = document.getElementById('p2'), p3 = document.getElementById('p3'), p4 = document.getElementById('p4');
    
    if (tipContractCurent === 'auto') {
        document.getElementById('formAutoStep1').style.display = 'grid';
        document.getElementById('formImobiliareStep1').style.display = 'none';
        document.getElementById('formAutoStep2').style.display = 'grid';
        document.getElementById('formImobiliareStep2').style.display = 'none';
        document.getElementById('titleStep1').innerText = "Pasul 1: Datele Vânzătorului";
        document.getElementById('titleStep2').innerText = "Pasul 2: Datele Cumpărătorului";

        if (mod === 'local') {
            if(p2) p2.style.display = 'flex';
            if(p3) { p3.style.display = 'flex'; p3.innerText = '3'; }
            if(p4) { p4.style.display = 'flex'; p4.innerText = '4'; }
        } else {
            if(p2) p2.style.display = 'none';
            if(p3) { p3.style.display = 'flex'; p3.innerText = '2'; }
            if(p4) { p4.style.display = 'none'; }
        }
    } else {
        document.getElementById('formAutoStep1').style.display = 'none';
        document.getElementById('formImobiliareStep1').style.display = 'grid';
        document.getElementById('formAutoStep2').style.display = 'none';
        document.getElementById('formImobiliareStep2').style.display = 'grid';
        document.getElementById('titleStep1').innerText = "Pasul 1: Datele Proprietarului";
        document.getElementById('titleStep2').innerText = "Pasul 2: Datele Chiriașului & Imobilului";

        if (mod === 'local') {
            if(p2) p2.style.display = 'flex';
            if(p3) p3.style.display = 'none';
            if(p4) { p4.style.display = 'flex'; p4.innerText = '3'; }
        } else {
            if(p2) p2.style.display = 'none';
            if(p3) p3.style.display = 'none';
            if(p4) { p4.style.display = 'none'; }
        }
        initCanvasuriSemnatura();
    }

    currentStep = 1;
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    updateProgress();
}

function updateProgress() {
    if (userRole === 'cumparator') { updateProgressBuyer(); return; }
    let total = 4;
    if (tipContractCurent === 'imobiliare') total = modLucru === 'remote' ? 1 : 3;
    else total = (modLucru === 'remote') ? 2 : 4;

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
    if (userRole === 'cumparator') { nextStepBuyer(buyerCurrentStep); return; }

    document.getElementById('step' + step).classList.remove('active');
    
    if (tipContractCurent === 'auto') {
        if (modLucru === 'remote' && step === 1) currentStep = 3;
        else if (modLucru === 'remote' && step === 3) currentStep = 4;
        else currentStep = step + 1;
    } else {
        if (modLucru === 'remote' && step === 1) currentStep = 4;
        else if (modLucru === 'local' && step === 1) currentStep = 2;
        else if (modLucru === 'local' && step === 2) currentStep = 4;
    }

    if (currentStep === 4) {
        document.getElementById('localActions').style.display = modLucru === 'local' ? 'none' : 'block';
        document.getElementById('finalDownloadContainer').style.display = modLucru === 'local' ? 'block' : 'none';
        document.getElementById('step4Desc').innerText = modLucru === 'local' ? "Toate datele au fost completate. Puteți descărca documentul oficial." : "Generați linkul securizat pentru a-l trimite celeilalte părți.";
    }

    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
}

function prevStep(step) {
    if (userRole === 'cumparator') { prevStepBuyer(buyerCurrentStep); return; }

    document.getElementById('step' + step).classList.remove('active');
    if (tipContractCurent === 'auto') {
        if (modLucru === 'remote' && step === 3) currentStep = 1;
        else if (modLucru === 'remote' && step === 4) currentStep = 3;
        else currentStep = step - 1;
    } else {
        if (modLucru === 'remote' && step === 4) currentStep = 1;
        else if (modLucru === 'local' && step === 4) currentStep = 2;
        else currentStep = step - 1;
    }
    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
}

function updateProgressBuyer() {
    const p1 = document.getElementById('p1'), p2 = document.getElementById('p2'), p3 = document.getElementById('p3'), p4 = document.getElementById('p4');
    if(p1) { p1.style.display = 'flex'; p1.className = 'progress-step'; }
    if(p2) { p2.style.display = 'flex'; p2.className = 'progress-step'; }
    if(p3) p3.style.display = tipContractCurent === 'auto' ? 'flex' : 'none';
    if(p4) p4.style.display = 'none';

    if (buyerCurrentStep === 1) { if(p1) p1.classList.add('active'); }
    else if (buyerCurrentStep === 2) { if(p1) p1.classList.add('completed'); if(p2) p2.classList.add('active'); }
}

function nextStepBuyer(step) {
    if (!valideazaPasCurent()) return;
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    if (tipContractCurent === 'auto') {
        if (step === 1) {
            buyerCurrentStep = 2;
            document.getElementById('step3').classList.add('active');
        } else {
            buyerCurrentStep = 3;
            document.getElementById('step4').classList.add('active');
            document.getElementById('localActions').style.display = 'none';
            document.getElementById('buyerActions').style.display = 'block';
            document.getElementById('finalDownloadContainer').style.display = 'none';
        }
    } else {
        buyerCurrentStep = 2;
        document.getElementById('step4').classList.add('active');
        document.getElementById('localActions').style.display = 'none';
        document.getElementById('buyerActions').style.display = 'block';
        document.getElementById('finalDownloadContainer').style.display = 'none';
    }
    updateProgressBuyer();
}

function prevStepBuyer(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    if (tipContractCurent === 'auto' && step === 2) {
        buyerCurrentStep = 1; document.getElementById('step2').classList.add('active');
    } else {
        buyerCurrentStep = 2; document.getElementById('step3').classList.add('active');
    }
    updateProgressBuyer();
}

function finalizarePas() {
    if (userRole === 'cumparator') nextStepBuyer(buyerCurrentStep);
    else nextStep(currentStep);
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

    if (params.has('sessionId')) {
        globalSessionId = params.get('sessionId');
        userRole = 'cumparator';
        const splash = document.getElementById('splashScreen');
        if (splash) splash.style.display = 'none';
        const mainMenu = document.getElementById('mainMenuContainer');
        if (mainMenu) mainMenu.style.display = 'none';
        const progContainer = document.getElementById('progressBarContainer');
        if (progContainer) progContainer.style.display = 'flex';
        
        try {
            const res = await fetch(`/api/obtine-tranzactie/${globalSessionId}`);
            const json = await res.json();
            if (json.success) {
                tipContractCurent = json.data.tipContract || 'auto';
                for (const k in json.data) {
                    const el = document.getElementById(k);
                    if (el) el.value = (json.data[k] || '').toUpperCase();
                }
                document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
                
                if (tipContractCurent === 'auto') {
                    document.getElementById('formAutoStep1').style.display = 'grid';
                    document.getElementById('formImobiliareStep1').style.display = 'none';
                    document.getElementById('formAutoStep2').style.display = 'grid';
                    document.getElementById('formImobiliareStep2').style.display = 'none';
                    document.getElementById('step2').classList.add('active');
                } else {
                    document.getElementById('formAutoStep1').style.display = 'none';
                    document.getElementById('formImobiliareStep1').style.display = 'grid';
                    document.getElementById('formAutoStep2').style.display = 'none';
                    document.getElementById('formImobiliareStep2').style.display = 'grid';
                    document.getElementById('step2').classList.add('active');
                    initCanvasuriSemnatura();
                }

                const roleB = document.getElementById('roleBanner');
                if (roleB) {
                    roleB.style.display = 'flex';
                    roleB.innerHTML = "🔒 <b>Bun venit!</b> Completează datele tale mai jos.";
                }
                updateProgressBuyer();
            }
        } catch(e) {}
    }
};

function colecteazaDate() {
    let d = {};
    elementeFormular.forEach(id => {
        const el = document.getElementById(id);
        d[id] = el ? String(el.value || '').toUpperCase().trim() : '';
    });
    d['tipContract'] = tipContractCurent;
    const sEmail = document.getElementById('seller_email');
    if (sEmail) d['seller_email'] = sEmail.value.trim();
    const bEmail = document.getElementById('buyerEmail');
    if (bEmail) d['buyerEmail'] = bEmail.value.trim();

    const actType = document.getElementById('acquiredActType')?.value || '';
    const actDetails = document.getElementById('acquiredActDetails')?.value || '';
    d['acquiredAct'] = `${actType} ${actDetails}`.toUpperCase().trim();
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
            pornesteAscultareaLive();
        }
    } catch(e) { arataNotificare("Eroare server.", true); }
}

function copiazaLinkul() {
    navigator.clipboard.writeText(linkCumparatorGlobal).then(() => { arataNotificare("📋 Link copiat în clipboard!"); });
}
function trimitePeWhatsApp() {
    const msg = encodeURIComponent(`Salut! Completează datele pentru contract: ${linkCumparatorGlobal}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

function pornesteAscultareaLive() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/obtine-tranzactie/${globalSessionId}`);
            const json = await res.json();
            if (json.success && json.data.status === 'COMPLETAT_GATA_CONTRACT') {
                clearInterval(pollInterval);
                document.getElementById('waitingAnimationContainer').style.display = 'none';
                document.getElementById('finalDownloadContainer').style.display = 'block';
                document.getElementById('stepsCompletedBanner').style.display = 'block';
                document.getElementById('step4Desc').innerHTML = "<b style='color:#16a34a;'>Tranzacție complet sincronizată! Puteți descărca contractul.</b>";
                for (const k in json.data) {
                    const el = document.getElementById(k);
                    if (el) el.value = (json.data[k] || '').toUpperCase();
                }
            }
        } catch(e) {}
    }, 4000);
}

async function salvareDateCumparatorSiFinalizare() {
    if (!valideazaPasCurent()) return;
    const btn = document.querySelector('#buyerActions .btn-success');
    if (btn) { btn.disabled = true; btn.innerText = "Se trimite..."; }

    const d = colecteazaDate();
    try {
        const res = await fetch(`/api/actualizeaza-tranzactie/${globalSessionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        const json = await res.json();
        if (json.success) {
            arataNotificare("✅ Datele au fost trimise cu succes!");
            document.getElementById('buyerActions').style.display = 'none';
            document.getElementById('progressBarContainer').style.display = 'none';
            document.getElementById('stepsCompletedBanner').style.display = 'block';
            document.getElementById('titleStep4').innerText = "Tranzacție Finalizată";
            document.getElementById('step4Desc').innerText = "Datele tale au fost trimise!";
            document.getElementById('finalDownloadContainer').style.display = 'block';
        }
    } catch(e) { 
        arataNotificare("Eroare la trimitere.", true); 
        if (btn) { btn.disabled = false; btn.innerText = "✅ Trimite Datele"; }
    }
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
    const vinInput = document.getElementById('chassisSeries');
    const vin = vinInput.value.trim();
    vinInput.value = vin;

    if (vin.length !== 17) {
        arataNotificare("⚠️ Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true);
        vinInput.focus();
        return;
    }
    arataNotificare("Se generează contractul oficial...");
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
        arataNotificare("✅ Contract generat și salvat în arhivă!");
    } catch(e) { arataNotificare("Eroare generare PDF: " + e.message, true); }
}

async function genereazaContractImobiliarPDF() {
    arataNotificare("Se generează contractul imobiliar cu inventar opțional...");
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;

        const deseneazaFooter = () => {
            page.drawText(curataDiacritice("Generat prin ActPeLoc.ro — Toate drepturile rezervate"), { 
                x: 45, 
                y: 30, 
                size: 8, 
                font, 
                color: PDFLib.rgb(0.5, 0.5, 0.5) 
            });
        };

        const deseneazaTitluSectiune = (text) => {
            if (y < 80) { 
                deseneazaFooter();
                page = pdfDoc.addPage([595.28, 841.89]); 
                y = 780; 
            }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 8.5, font: fontBold });
            y -= 13;
        };

        const deseneazaParagraf = (text) => {
            if (y < 80) { 
                deseneazaFooter();
                page = pdfDoc.addPage([595.28, 841.89]); 
                y = 780; 
            }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 7, font });
            y -= 11;
        };

        // TITLU CENTRAT PE MIJLOC
        const titluText = "CONTRACT DE INCHIRIERE LOCUINTA";
        const textWidth = fontBold.widthOfTextAtSize(titluText, 12);
        const centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 12, font: fontBold });
        y -= 20;

        // ARTICOLUL 1
        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Locator (Proprietar): ${document.getElementById('proprietarNume').value || '....................................'},`);
        deseneazaParagraf(`CNP: ${document.getElementById('proprietarCnp').value || '................'}, CI seria: ${document.getElementById('proprietarAct').value || '........'}.`);
        deseneazaParagraf(`1.2. Locatar (Chirias): ${document.getElementById('chiriasNume').value || '....................................'},`);
        deseneazaParagraf(`CNP: ${document.getElementById('chiriasCnp').value || '................'}, CI seria: ${document.getElementById('chiriasAct').value || '........'}.`);
        y -= 4;

        // ARTICOLUL 2
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

        // ARTICOLUL 3
        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract se incheie pe o perioada de ${document.getElementById('imobilDurata').value || '12 LUNI'}, incepand cu data de ${document.getElementById('imobilDataStart').value || '01.09.2026'}.`);
        deseneazaParagraf(`3.2. La expirarea termenului, contractul poate fi prelungit prin acordul scris al ambelor parti.`);
        y -= 4;

        // ARTICOLUL 4
        deseneazaTitluSectiune("ARTICOLUL 4: CHIRIA, GARANTIA SI MODALITATEA DE PLATA");
        deseneazaParagraf(`4.1. Chiria lunara stabilita este in cuantum de ${document.getElementById('imobilChirie').value || '350 EUR'}, achitata in avans pana la data de 5 a fiecarei luni.`);
        deseneazaParagraf(`4.2. Cu titlu de garantie, Locatarul achita la semnare suma de ${document.getElementById('imobilGarantie').value || '350 EUR'}, destinata acoperirii daunelor sau utilitatilor neachitate.`);
        deseneazaParagraf(`4.3. Garantia se restituie in termen de cel mult 7 zile calendaristice de la predarea imobilului si achitarea datoriilor.`);
        y -= 4;

        // ARTICOLUL 5
        deseneazaTitluSectiune("ARTICOLUL 5: DREPTURILE SI OBLIGATIIle PARTILOR");
        deseneazaParagraf(`5.1. Locatorul garanteaza linistita folosinta a imobilului si nu poate interveni in spatiu fara notificare prealabila.`);
        deseneazaParagraf(`5.2. Locatarul se obliga sa achite la termen chiria, cotele de intretinere, consumul de energie, gaze si apa pe baza contoarelor.`);
        deseneazaParagraf(`5.3. Subinchirierea totala sau partiala catre terti, precum si desfasurarea de activitati comerciale sunt strict interzise.`);
        deseneazaParagraf(`5.4. Reparatiile capitale cad in sarcina Locatorului, in timp ce reparatiile curente si intretinerea locuintei revin Locatarului.`);
        y -= 4;

        // ARTICOLUL 6
        deseneazaTitluSectiune("ARTICOLUL 6: REGULI SPECIALE (ANIMALE DE COMPANIE SI FUMAT)");
        deseneazaParagraf(`6.1. Detinerea de animale de companie in imobil este permisa doar cu acordul prealabil scris al Locatorului.`);
        deseneazaParagraf(`6.2. Fumatul in interiorul imobilului este strict interzis, eventualele daune sau mirosuri persistente fiind suportate integral de Locatar.`);
        y -= 4;

        // ARTICOLUL 7
        deseneazaTitluSectiune("ARTICOLUL 7: MODIFICARI STRUCTURALE SI INSPECTIA IMOBILULUI");
        deseneazaParagraf(`7.1. Locatarul nu poate efectua modificari structurale, zugraveli majore sau interventii la instalatii fara acordul scris al Locatorului.`);
        deseneazaParagraf(`7.2. Locatorul are dreptul de a inspecta starea imobilului cu o notificare prealabila de minim 48 de ore adresata Locatarului.`);
        y -= 4;

        // ARTICOLUL 8
        deseneazaTitluSectiune("ARTICOLUL 8: INCETAREA SI REZILIEREA ANTICIPATA");
        deseneazaParagraf(`8.1. Prezentul contract poate fi denuntat unilateral de oricare dintre parti, cu un preaviz scris de minim 60 de zile.`);
        deseneazaParagraf(`8.2. Nerespectarea obligatiilor contractuale de catre una dintre parti atrage rezilierea de plin drept si plata de daune-interese.`);
        y -= 4;

        // ARTICOLUL 9
        deseneazaTitluSectiune("ARTICOLUL 9: FORTA MAJORA SI LITIGII");
        deseneazaParagraf(`9.1. Forta majora exonereaza de raspundere partea care o invoca, in conditiile legii.`);
        deseneazaParagraf(`9.2. Litigiile decurgand din acest contract se vor solutiona pe cale amiabila sau, in caz de esec, de instantele judecatoresti competente.`);
        y -= 4;

        // ARTICOLUL 10
        deseneazaTitluSectiune("ARTICOLUL 10: DISPOZITII FINALE SI FISCALE (ANAF)");
        deseneazaParagraf(`10.1. Prezentul contract constituie titlu executoriu conform dispozitiilor Codului de Procedura Civila.`);
        deseneazaParagraf(`10.2. Locatorul are obligatia legala de inregistrare a contractului la organul fiscal competent (ANAF) în termen de 30 zile.`);
        y -= 15;

        if (y < 160) { 
            deseneazaFooter();
            page = pdfDoc.addPage([595.28, 841.89]); 
            y = 780; 
        }

        // DATA INCHEIERII ȘI SEMNĂTURILE
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

        salveazaInArhivaprivata({ idAct: 'IMOB-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(document.getElementById('chiriasNume').value || 'Client') });
        arataNotificare("✅ Contract imobiliar generat cu succes cu tot cu inventar!");
    } catch(e) { arataNotificare("Eroare PDF: " + e.message, true); }
}