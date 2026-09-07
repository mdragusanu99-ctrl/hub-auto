// ==========================================
// SCRIPT.JS - Logică, Navigare și Stare Platformă
// ==========================================

let tipContractCurent = 'auto';
let maxStepsTotal = 4;
let currentStepIndex = 1;
let profilCurent = { email: 'mdragusanu99@platforma.ro', pachet: 'GRATUIT', ramase: 9 };

// Structura categoriilor și actelor
const dateCategorii = {
    auto: {
        titlu: "Auto & Transport",
        acte: [
            { id: 'auto-054', nume: "Contract Vânzare-Cumpărare Auto (ITL 054)", desc: "Model oficial fiscal pentru înmatriculare / radieri.", func: "pornesteFluxDocument('auto')" },
            { id: 'itl-016', nume: "Declarație Scoatere din Evidență Auto (ITL-016)", desc: "Model oficial pentru radiere fiscală la Primărie (vânzător).", func: "pornesteFluxDocument('itl_016')" },
            { id: 'itl-005', nume: "Declarație Fiscală ITL-005 (Cumpărător / Impunere Auto)", desc: "Declarație fiscală pentru stabilirea impozitului auto.", func: "pornesteFluxDocument('itl_005')" },
            { id: 'comodat-auto', nume: "Contract de Comodat Auto", desc: "Împrumut folosință autoturism fără costuri.", func: "pornesteFluxDocument('comodat_auto')" }
        ]
    },
    imobiliare: {
        titlu: "Imobiliare & Locuințe",
        acte: [
            { id: 'imob-inchiriere', nume: "Contract de Închiriere Locuință", desc: "Include inventar detaliat și clauze fiscale ANAF.", func: "pornesteFluxDocument('imobiliare')" },
            { id: 'pv-locuinta', nume: "Proces-Verbal Predare-Primire Locuință", desc: "Inventar bunuri, indici contoare & stare tehnică.", func: "pornesteFluxDocument('pv_locuinta')" },
            { id: 'comodat-imobil', nume: "Contract de Comodat Imobil / Sediu Social", desc: "Pentru stabilire sediu social firmă sau locuință gratuită.", func: "pornesteFluxDocument('comodat_imobil')" }
        ]
    }
};

function obtineBazaConturi() {
    try {
        let db = localStorage.getItem('act_peloc_db_accounts');
        return db ? JSON.parse(db) : {};
    } catch(e) { return {}; }
}

function salveazaBazaConturi(db) {
    localStorage.setItem('act_peloc_db_accounts', JSON.stringify(db));
}

function verificaSiActiveazaCredite() {
    let db = obtineBazaConturi();
    if (!db[profilCurent.email]) {
        db[profilCurent.email] = profilCurent;
        salveazaBazaConturi(db);
    } else {
        profilCurent = db[profilCurent.email];
        if (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT') {
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

function arataNotificare(mesaj, esteEroare = false) {
    const toast = document.getElementById('notificationToast');
    if (!toast) return;
    toast.innerText = mesaj;
    toast.style.background = esteEroare ? '#dc2626' : 'var(--text-main)';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function initSplashTimer() {
    let secunde = 4;
    const timer = document.getElementById('splashTimerText');
    let interval = setInterval(() => {
        secunde--;
        if (timer) timer.innerText = `Se deschide automat în ${secunde} secunde...`;
        if (secunde <= 0) {
            clearInterval(interval);
            inchideSplash();
        }
    }, 1000);
}

function inchideSplash() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => { splash.style.display = 'none'; }, 700);
    }
}

function deschideMeniuLateral() {
    document.getElementById('sideMenu').classList.add('open');
}

function inchideMeniuLateral() {
    document.getElementById('sideMenu').classList.remove('open');
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

function deschideModalAuth() { document.getElementById('authModal').style.display = 'flex'; }
function inchideModalAuth() { document.getElementById('authModal').style.display = 'none'; }

function salveazaContUtilizator() {
    const email = document.getElementById('authEmail').value.trim();
    const nume = document.getElementById('authNume').value.trim();
    if (!email) { arataNotificare("Introduceți un email valid!", true); return; }
    profilCurent.email = email;
    let db = obtineBazaConturi();
    db[email] = profilCurent;
    salveazaBazaConturi(db);
    document.getElementById('infoDashEmail').innerText = email;
    document.getElementById('authHeaderBtn').innerText = nume || email;
    inchideModalAuth();
    arataNotificare("✅ Autentificare reușită!");
}

function deschidePaginaPrincipala() {
    inchideMeniuLateral();
    document.getElementById('hubCategorii').style.display = 'block';
    document.getElementById('listaDocumenteContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('packagesView').style.display = 'none';
    document.getElementById('archiveView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
}

function selecteazaCategorieTip(cat) {
    document.getElementById('hubCategorii').style.display = 'none';
    const listaC = document.getElementById('listaDocumenteContainer');
    listaC.style.display = 'block';
    
    const infoCat = dateCategorii[cat];
    document.getElementById('titluCategorieLista').innerText = infoCat.titlu;
    const container = document.getElementById('containerItemiActe');
    container.innerHTML = "";

    infoCat.acte.forEach(act => {
        const div = document.createElement('div');
        div.className = 'doc-item';
        div.innerHTML = `
            <div>
                <strong>${act.nume}</strong>
                <p style="font-size: 12px; color: var(--text-muted);">${act.desc}</p>
            </div>
            <button class="btn" onclick="${act.func}">Generează ➔</button>
        `;
        container.appendChild(div);
    });
}

function pornesteFluxDocument(tip) {
    tipContractCurent = tip;
    document.getElementById('listaDocumenteContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'block';
    
    // Setează titlul modului
    document.getElementById('modSelectorTitle').innerText = `Generare: ${tip.toUpperCase()}`;
    activeazaPasulUI(1);
}

function activeazaPasulUI(stepNum) {
    currentStepIndex = stepNum;
    for (let i = 1; i <= 4; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.style.display = (i === stepNum) ? 'block' : 'none';
    }

    // Gestionare formulare pas 1 & 2 & 3
    const fAuto1 = document.getElementById('formAutoStep1');
    const fImob1 = document.getElementById('formImobiliareStep1');
    const fItl1 = document.getElementById('formItl016Step1');
    const fItl005_1 = document.getElementById('formItl005Step1');
    const fComAuto1 = document.getElementById('formComodatAutoStep1');
    const fComImob1 = document.getElementById('formComodatImobilStep1');
    const fPvLoc1 = document.getElementById('formPvLocuintaStep1');

    if (fAuto1) fAuto1.style.display = 'none';
    if (fImob1) fImob1.style.display = 'none';
    if (fItl1) fItl1.style.display = 'none';
    if (fItl005_1) fItl005_1.style.display = 'none';
    if (fComAuto1) fComAuto1.style.display = 'none';
    if (fComImob1) fComImob1.style.display = 'none';
    if (fPvLoc1) fPvLoc1.style.display = 'none';

    if (stepNum === 1) {
        if (tipContractCurent === 'auto' && fAuto1) fAuto1.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob1) fImob1.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl1) fItl1.style.display = 'grid';
        else if (tipContractCurent === 'itl_005' && fItl005_1) fItl005_1.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComAuto1) fComAuto1.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComImob1) fComImob1.style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc1) fPvLoc1.style.display = 'grid';
    }

    const fAuto2 = document.getElementById('formAutoStep2');
    const fImob2 = document.getElementById('formImobiliareStep2');
    const fItl2 = document.getElementById('formItl016Step2');
    const fItl005_2 = document.getElementById('formItl005_2');
    const fComAuto2 = document.getElementById('formComodatAutoStep2');
    const fComImob2 = document.getElementById('formComodatImobilStep2');
    const fPvLoc2 = document.getElementById('formPvLocuintaStep2');

    if (fAuto2) fAuto2.style.display = 'none';
    if (fImob2) fImob2.style.display = 'none';
    if (fItl2) fItl2.style.display = 'none';
    if (fItl005_2) fItl005_2.style.display = 'none';
    if (fComAuto2) fComAuto2.style.display = 'none';
    if (fComImob2) fComImob2.style.display = 'none';
    if (fPvLoc2) fPvLoc2.style.display = 'none';

    if (stepNum === 2) {
        if (tipContractCurent === 'auto' && fAuto2) fAuto2.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob2) fImob2.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl2) fItl2.style.display = 'grid';
        else if (tipContractCurent === 'itl_005' && fItl005_2) fItl005_2.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComAuto2) fComAuto2.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComImob2) fComImob2.style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc2) fPvLoc2.style.display = 'grid';
    }

    const fAuto3 = document.getElementById('formAutoStep3');
    if (fAuto3) fAuto3.style.display = (tipContractCurent === 'auto' && stepNum === 3) ? 'grid' : 'none';

    initCanvasSemnatura('sigProprietarCanvas');
    initCanvasSemnatura('sigChiriasCanvas');
}

function nextStep(current) {
    if (current < 3) {
        activeazaPasulUI(current + 1);
    } else {
        activeazaPasulUI(4); // Pasul 4 este plata și descărcarea
    }
}

function prevStep(current) {
    if (current > 1) {
        activeazaPasulUI(current - 1);
    } else {
        deschidePaginaPrincipala();
    }
}

function initCanvasSemnatura(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let desenand = false;

    canvas.addEventListener('mousedown', (e) => { desenand = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    canvas.addEventListener('mousemove', (e) => { if (!desenand) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
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

function colecteazaDate() {
    return {
        sellerName: document.getElementById('sellerName')?.value || '',
        sellerCounty: document.getElementById('sellerCounty')?.value || '',
        sellerCity: document.getElementById('sellerCity')?.value || '',
        sellerAddress: document.getElementById('sellerAddress')?.value || '',
        sellerIdSeries: document.getElementById('sellerIdSeries')?.value || '',
        sellerIdNumber: document.getElementById('sellerIdNumber')?.value || '',
        sellerCnp: document.getElementById('sellerCnp')?.value || '',
        buyerName: document.getElementById('buyerName')?.value || '',
        buyerCounty: document.getElementById('buyerCounty')?.value || '',
        buyerCity: document.getElementById('buyerCity')?.value || '',
        buyerAddress: document.getElementById('buyerAddress')?.value || '',
        buyerIdSeries: document.getElementById('buyerIdSeries')?.value || '',
        buyerIdNumber: document.getElementById('buyerIdNumber')?.value || '',
        buyerCnp: document.getElementById('buyerCnp')?.value || '',
        vehicleMake: document.getElementById('vehicleMake')?.value || '',
        vehicleModel: document.getElementById('vehicleModel')?.value || '',
        chassisSeries: document.getElementById('chassisSeries')?.value || '',
        engineSeries: document.getElementById('engineSeries')?.value || '',
        cylinderCapacity: document.getElementById('cylinderCapacity')?.value || '',
        maxWeight: document.getElementById('maxWeight')?.value || '',
        contractPrice: document.getElementById('contractPrice')?.value || '',
        contractDate: document.getElementById('contractDate')?.value || '',
        proprietarNume: document.getElementById('proprietarNume')?.value || '',
        proprietarCnp: document.getElementById('proprietarCnp')?.value || '',
        proprietarAct: document.getElementById('proprietarAct')?.value || '',
        imobilAdresa: document.getElementById('imobilAdresa')?.value || '',
        imobilChirie: document.getElementById('imobilChirie')?.value || '',
        imobilGarantie: document.getElementById('imobilGarantie')?.value || '',
        chiriasNume: document.getElementById('chiriasNume')?.value || '',
        chiriasCnp: document.getElementById('chiriasCnp')?.value || '',
        chiriasAct: document.getElementById('chiriasAct')?.value || '',
        itlContribuabilNume: document.getElementById('itlContribuabilNume')?.value || '',
        itlContribuabilCnp: document.getElementById('itlContribuabilCnp')?.value || '',
        itlContribuabilAct: document.getElementById('itlContribuabilAct')?.value || '',
        itlContribuabilAdresa: document.getElementById('itlContribuabilAdresa')?.value || '',
        itlAutoMarca: document.getElementById('itlAutoMarca')?.value || '',
        itlAutoMotor: document.getElementById('itlAutoMotor')?.value || '',
        itlAutoVin: document.getElementById('itlAutoVin')?.value || '',
        itlAutoCapacitate: document.getElementById('itlAutoCapacitate')?.value || '',
        itlAutoDataDobandirii: document.getElementById('itlAutoDataDobandirii')?.value || '',
        itl005TipContribuabil: document.getElementById('itl005TipContribuabil')?.value || 'pf',
        itl005Nume: document.getElementById('itl005Nume')?.value || '',
        itl005Cnp: document.getElementById('itl005Cnp')?.value || '',
        itl005Adresa: document.getElementById('itl005Adresa')?.value || '',
        itl005Marca: document.getElementById('itl005Marca')?.value || '',
        itl005Vin: document.getElementById('itl005Vin')?.value || '',
        itl005Capacitate: document.getElementById('itl005Capacitate')?.value || '',
        itl005An: document.getElementById('itl005An')?.value || '',
        comodantAutoNume: document.getElementById('comodantAutoNume')?.value || '',
        comodatarAutoNume: document.getElementById('comodatarAutoNume')?.value || '',
        comodantImobilNume: document.getElementById('comodantImobilNume')?.value || '',
        comodatarImobilNume: document.getElementById('comodatarImobilNume')?.value || '',
        pvProprietarNume: document.getElementById('pvProprietarNume')?.value || '',
        pvChiriasNume: document.getElementById('pvChiriasNume')?.value || '',
        pvInventarBunuri: document.getElementById('pvInventarBunuri')?.value || ''
    };
}

function proceseazaPlataSiDescarca() {
    arataNotificare("Se procesează plata securizată...");
    setTimeout(() => {
        arataNotificare("✅ Plată efectuată cu succes!");
        document.querySelector('.finalDownloadContainer').style.display = 'block';
        ruleazaDescarcareaFinala();
    }, 1000);
}

function ruleazaDescarcareaFinala() {
    if (tipContractCurent === 'auto') genereazaContractOficialPDF();
    else if (tipContractCurent === 'imobiliare') genereazaContractImobiliarPDF();
    else if (tipContractCurent === 'itl_016') genereazaItl016PDF();
    else if (tipContractCurent === 'itl_005') genereazaItl005PDF();
    else if (tipContractCurent === 'comodat_auto') genereazaContractComodatAutoPDF();
    else if (tipContractCurent === 'comodat_imobil') genereazaContractComodatImobilPDF();
    else if (tipContractCurent === 'pv_locuinta') genereazaProcesVerbalLocuintaPDF();

    salveazaInArhivaprivata({
        idAct: 'DOC-' + Math.floor(1000 + Math.random() * 9000),
        nume: tipContractCurent.toUpperCase(),
        data: new Date().toLocaleDateString('ro-RO')
    });
}

function salveazaInArhivaprivata(doc) {
    let arhiva = JSON.parse(localStorage.getItem('act_peloc_arhiva') || '[]');
    arhiva.push(doc);
    localStorage.setItem('act_peloc_arhiva', JSON.stringify(arhiva));
}

function deschideArhiva() {
    inchideMeniuLateral();
    document.getElementById('hubCategorii').style.display = 'none';
    document.getElementById('listaDocumenteContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('packagesView').style.display = 'none';
    document.getElementById('archiveView').style.display = 'block';
    document.getElementById('dashboardView').style.display = 'none';

    const container = document.getElementById('listaArhivaContainer');
    let arhiva = JSON.parse(localStorage.getItem('act_peloc_arhiva') || '[]');
    if (arhiva.length === 0) {
        container.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">Nu ai generat niciun document momentan.</p>`;
        return;
    }
    container.innerHTML = arhiva.map(item => `
        <div class="doc-item">
            <div><strong>${item.idAct || 'DOC'}</strong> - ${item.nume}</div>
            <span style="font-size: 12px; color: var(--text-muted);">${item.data}</span>
        </div>
    `).join('');
}

function deschidePachete() {
    inchideMeniuLateral();
    document.getElementById('hubCategorii').style.display = 'none';
    document.getElementById('listaDocumenteContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('packagesView').style.display = 'block';
    document.getElementById('archiveView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
}

function deschideDashboard() {
    inchideMeniuLateral();
    document.getElementById('hubCategorii').style.display = 'none';
    document.getElementById('listaDocumenteContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'none';
    document.getElementById('packagesView').style.display = 'none';
    document.getElementById('archiveView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
}

function cumparaPachet(pachet) {
    profilCurent.pachet = pachet;
    profilCurent.ramase = (pachet === 'BUSINESS' ? 20 : 5);
    let db = obtineBazaConturi();
    db[profilCurent.email] = profilCurent;
    salveazaBazaConturi(db);
    verificaSiActiveazaCredite();
    document.getElementById('infoDashPachet').innerText = pachet;
    arataNotificare(`🎉 Felicitări! Ai activat pachetul ${pachet}!`);
}

function deconectareUtilizator() {
    inchideMeniuLateral();
    arataNotificare("🔒 Ai fost deconectat cu succes.");
    deschidePaginaPrincipala();
}

function copiazaLinkAfiliere() {
    navigator.clipboard.writeText("https://actpeloc.ro/?ref=MARIO25");
    arataNotificare("📋 Link de afiliere copiat în clipboard!");
}

window.addEventListener('DOMContentLoaded', () => {
    initSplashTimer();
    verificaSiActiveazaCredite();
});