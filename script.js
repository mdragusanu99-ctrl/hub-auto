let tipContractCurent = 'auto';
let currentStepIndex = 1;
let profilCurent = { email: 'mdragusanu99@platforma.ro', pachet: 'GRATUIT', ramase: 9 };

const dateCategorii = {
    auto: {
        titlu: "Auto & Transport",
        acte: [
            { id: 'auto-054', nume: "Contract Vânzare-Cumpărare Auto (ITL 054)", desc: "Model oficial fiscal pentru înmatriculare / radieri.", func: "pornesteFluxDocument('auto')" },
            { id: 'itl-016', nume: "Declarație Scoatere din Evidență Auto (ITL-016)", desc: "Model oficial pentru radiere fiscală la Primărie.", func: "pornesteFluxDocument('itl_016')" },
            { id: 'itl-005', nume: "Declarație Fiscală ITL-005 (Impunere Auto)", desc: "Declarație fiscală pentru stabilirea impozitului auto.", func: "pornesteFluxDocument('itl_005')" },
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
}

function arataNotificare(mesaj, esteEroare = false) {
    const toast = document.getElementById('notificationToast');
    if (!toast) return;
    toast.innerText = mesaj;
    toast.style.background = esteEroare ? '#dc2626' : '#1e293b';
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

function deschideMeniuLateral() { document.getElementById('sideMenu').classList.add('open'); }
function inchideMeniuLateral() { document.getElementById('sideMenu').classList.remove('open'); }

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
                <p style="font-size: 11px; color: var(--text-muted);">${act.desc}</p>
            </div>
            <button class="btn" style="justify-content:center;" onclick="${act.func}">Generează ➔</button>
        `;
        container.appendChild(div);
    });
}

function pornesteFluxDocument(tip) {
    tipContractCurent = tip;
    document.getElementById('listaDocumenteContainer').style.display = 'none';
    document.getElementById('modeSelectorContainer').style.display = 'block';
    document.getElementById('modSelectorTitle').innerText = `Generare: ${tip.toUpperCase()}`;
    activeazaPasulUI(1);
}

function valideazaPasCurent(stepNum) {
    if (stepNum === 1) {
        const cnpInputs = ['sellerCnp', 'proprietarCnp', 'itlContribuabilNume', 'itl005Cnp', 'comodantAutoCnp', 'comodantImobilCnp', 'pvProprietarCnp'];
        for (let id of cnpInputs) {
            const el = document.getElementById(id);
            if (el && el.offsetParent !== null) {
                let val = el.value.trim();
                if (id.includes('Cnp') && val.length > 0 && val.length !== 13) {
                    arataNotificare("Eroare: CNP-ul trebuie să conțină exact 13 caractere!", true);
                    el.focus();
                    return false;
                }
            }
        }
    }
    if (stepNum === 2) {
        const vinInputs = ['itlAutoVin', 'itl005Vin', 'chassisSeries'];
        for (let id of vinInputs) {
            const el = document.getElementById(id);
            if (el && el.offsetParent !== null) {
                let val = el.value.trim();
                if (val.length > 0 && val.length !== 17) {
                    arataNotificare("Eroare: Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true);
                    el.focus();
                    return false;
                }
            }
        }
    }
    return true;
}

function activeazaPasulUI(stepNum) {
    currentStepIndex = stepNum;
    for (let i = 1; i <= 4; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.style.display = (i === stepNum) ? 'block' : 'none';
        
        const ind = document.getElementById('ind' + i);
        if (ind) {
            if (i <= stepNum) ind.className = 'step-ind active';
            else ind.className = 'step-ind';
        }
    }

    ['formAutoStep1', 'formImobiliareStep1', 'formItl016Step1', 'formItl005Step1', 'formComodatAutoStep1', 'formComodatImobilStep1', 'formPvLocuintaStep1'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    ['formAutoStep2', 'formImobiliareStep2', 'formItl016Step2', 'formItl005_2', 'formComodatAutoStep2', 'formComodatImobilStep2', 'formPvLocuintaStep2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (stepNum === 1) {
        if (tipContractCurent === 'auto') document.getElementById('formAutoStep1').style.display = 'grid';
        else if (tipContractCurent === 'imobiliare') document.getElementById('formImobiliareStep1').style.display = 'grid';
        else if (tipContractCurent === 'itl_016') document.getElementById('formItl016Step1').style.display = 'grid';
        else if (tipContractCurent === 'itl_005') document.getElementById('formItl005Step1').style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto') document.getElementById('formComodatAutoStep1').style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil') document.getElementById('formComodatImobilStep1').style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta') document.getElementById('formPvLocuintaStep1').style.display = 'grid';
    }

    if (stepNum === 2) {
        if (tipContractCurent === 'auto') document.getElementById('formAutoStep2').style.display = 'grid';
        else if (tipContractCurent === 'imobiliare') document.getElementById('formImobiliareStep2').style.display = 'grid';
        else if (tipContractCurent === 'itl_016') document.getElementById('formItl016Step2').style.display = 'grid';
        else if (tipContractCurent === 'itl_005') document.getElementById('formItl005_2').style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto') document.getElementById('formComodatAutoStep2').style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil') document.getElementById('formComodatImobilStep2').style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta') document.getElementById('formPvLocuintaStep2').style.display = 'grid';
    }

    const fAuto3 = document.getElementById('formAutoStep3');
    if (fAuto3) fAuto3.style.display = (tipContractCurent === 'auto' && stepNum === 3) ? 'grid' : 'none';

    if (stepNum === 4) {
        const d = colecteazaDate();
        const prevBox = document.getElementById('livePreviewContainer');
        if (prevBox) {
            prevBox.innerHTML = `<strong>DOCUMENT:</strong> ${tipContractCurent.toUpperCase()}<br>` +
                                `<strong>Părți:</strong> ${d.sellerName || d.proprietarNume || 'N/A'} &rarr; ${d.buyerName || d.chiriasNume || 'N/A'}<br>` +
                                `<strong>Valoare:</strong> ${d.contractPrice || d.imobilChirie || '0'} ${d.contractCurrency || d.imobilMoneda || 'RON'}<br>` +
                                `<em>Date validate cu succes, pregătit pentru generare PDF.</em>`;
        }
    }

    initCanvasSemnatura('sigProprietarCanvas');
    initCanvasSemnatura('sigChiriasCanvas');
}

function nextStep(current) {
    if (!valideazaPasCurent(current)) return;
    if (current < 3) activeazaPasulUI(current + 1);
    else activeazaPasulUI(4);
}

function prevStep(current) {
    if (current > 1) activeazaPasulUI(current - 1);
    else deschidePaginaPrincipala();
}

function initCanvasSemnatura(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let desenand = false;

    canvas.addEventListener('mousedown', (e) => { desenand = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    canvas.addEventListener('mousemove', (e) => { if (!desenand) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
    window.addEventListener('mouseup', () => { desenand = false; });
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
        sellerCnp: document.getElementById('sellerCnp')?.value || '',
        buyerName: document.getElementById('buyerName')?.value || '',
        buyerCnp: document.getElementById('buyerCnp')?.value || '',
        vehicleMake: document.getElementById('vehicleMake')?.value || '',
        chassisSeries: document.getElementById('chassisSeries')?.value || '',
        contractPrice: document.getElementById('contractPrice')?.value || '',
        contractCurrency: document.getElementById('contractCurrency')?.value || 'EUR',
        proprietarNume: document.getElementById('proprietarNume')?.value || '',
        imobilChirie: document.getElementById('imobilChirie')?.value || '',
        imobilMoneda: document.getElementById('imobilMoneda')?.value || 'EUR',
        chiriasNume: document.getElementById('chiriasNume')?.value || '',
        itlContribuabilNume: document.getElementById('itlContribuabilNume')?.value || '',
        itl005Nume: document.getElementById('itl005Nume')?.value || ''
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
        container.innerHTML = `<p style="font-size: 12px; color: var(--text-muted);">Niciun document generat.</p>`;
        return;
    }
    container.innerHTML = arhiva.map(item => `
        <div class="doc-item">
            <div><strong>${item.idAct}</strong> - ${item.nume}</div>
            <span style="font-size: 11px; color: var(--text-muted);">${item.data}</span>
        </div>
    `).join('');
}

function curataArhivaGlobala() {
    localStorage.removeItem('act_peloc_arhiva');
    deschideArhiva();
    arataNotificare("🗑️ Arhivă golită.");
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
    arataNotificare(`🎉 Pachetul ${pachet} activat!`);
}

function deconectareUtilizator() {
    inchideMeniuLateral();
    arataNotificare("🔒 Deconectat cu succes.");
    deschidePaginaPrincipala();
}

function comutaChatBox() {
    const box = document.getElementById('chatWindowBox');
    box.style.display = (box.style.display === 'flex') ? 'none' : 'flex';
}

function trimiteMesajChat() {
    const txt = document.getElementById('chatInputText');
    const body = document.getElementById('chatBodyContent');
    if (!txt.value.trim()) return;
    
    body.innerHTML += `<div style="background: var(--bg-body); padding: 6px; border-radius: 4px; text-align: right;">${txt.value}</div>`;
    txt.value = '';
    setTimeout(() => {
        body.innerHTML += `<div style="background: var(--primary-light); padding: 6px; border-radius: 4px; color: var(--primary);">Am înțeles. Te ajutăm imediat!</div>`;
        body.scrollTop = body.scrollHeight;
    }, 700);
}

window.addEventListener('DOMContentLoaded', () => {
    initSplashTimer();
    verificaSiActiveazaCredite();
});