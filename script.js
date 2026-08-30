// ==========================================
// MODULUL PRINCIPAL DE LOGICĂ ȘI INTERFAȚĂ (script.js) - ARHITECTURĂ LOGICĂ 2026
// ==========================================

let currentStepIndex = 1;
let maxStepsTotal = 4;
let modLucru = 'local';
let tipContractCurent = 'auto'; // Valori: 'auto', 'comodat_auto', 'imobiliare', 'comodat_imobil', 'prestari_servicii', 'demisie', 'cim', 'fisa_postului', 'proces_verbal', 'act_aditional','procura', 'itl_016','itl-005','pv_locuinta'
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

// Dicționarul categoriilor și actelor pentru meniul Bento Grid 2026
const dateCategorii = {
  auto: {
        titlu: "Auto & Transport",
        acte: [
            { id: 'auto-054', nume: "Contract Vânzare-Cumpărare Auto (ITL 054)", desc: "Model oficial fiscal pentru înmatriculare / radieri.", func: "pornesteFluxDocument('auto')" },
            { id: 'itl-016', nume: "Declarație Scoatere din Evidență Auto (ITL-016)", desc: "Model oficial pentru radiere fiscală la Primărie (vânzător).", func: "pornesteFluxDocument('itl_016')" }, // ➔ Adăugat aici
            { id: 'comodat-auto', nume: "Contract de Comodat Auto", desc: "Împrumut folosință gratuită autoturism (cu serie șasiu 17 caractere).", func: "pornesteFluxDocument('comodat_auto')" },
            { id: 'procura-auto', nume: "Procură / Împuternicire RAR & Înmatriculări", desc: "Pentru reprezentare în fața RAR, SPCRPCIV și autorităților fiscale.", func: "pornesteFluxDocument('procura')" },
            { id: 'itl-005', nume: "Declarație Fiscală ITL-005 (Cumpărător / Impunere Auto)", desc: "Declarație fiscală pentru stabilirea impozitului pe mijloacele de transport la achiziție.", func: "pornesteFluxDocument('itl_005')" }
            
        ]
    },
   imobiliare: {
    titlu: "Imobiliare & Locuințe",
    acte: [
        { id: 'imob-inchiriere', nume: "Contract de Închiriere Locuință", desc: "Include inventar detaliat și clauze fiscale ANAF.", func: "pornesteFluxDocument('imobiliare')" },
        { id: 'comodat-imobil', nume: "Contract de Comodat Imobil", desc: "Pentru stabilire sediu social (ONRC) sau locuință (cu CF).", func: "pornesteFluxDocument('comodat_imobil')" },
        { id: 'pv-locuinta', nume: "Proces-Verbal Predare-Primire Locuință", desc: "Inventar bunuri, indici contoare & stare tehnică.", func: "pornesteFluxDocument('pv_locuinta')" } // ➔ Adăugat aici
    ]
},
    b2b: {
        titlu: "Prestări Servicii B2B",
        acte: [
            { id: 'prestari-servicii', nume: "Contract de Prestări Servicii Independent", desc: "Clauze solide de protecție IP și evitare reclasificare ANAF.", func: "pornesteFluxDocument('prestari_servicii')" }
        ]
    },
  munca: {
        titlu: "Muncă & Carieră",
        acte: [
            { id: 'contract-munca', nume: "Contract Individual de Muncă (CIM)", desc: "Model cadru legal conform Codului Muncii, cu clauze de salariu, program și semnături.", func: "pornesteFluxDocument('cim')" },
            { id: 'fisa-postului', nume: "Fișa Postului", desc: "Anexă obligatorie la CIM cu atribuții, responsabilități și cerințe.", func: "pornesteFluxDocument('fisa_postului')" },
            { id: 'act-aditional', nume: "Act Adițional la CIM", desc: "Modificare salariu, funcție, program sau loc de muncă conform Art. 41 Codul Muncii.", func: "pornesteFluxDocument('act_aditional')" },
            { id: 'cerere-demisie', nume: "Cerere de Demisie Oficială", desc: "Calcul automat termen preaviz conform Codului Muncii.", func: "pornesteFluxDocument('demisie')" },
            { id: 'proces-verbal', nume: "Proces-Verbal de Predare-Primire", desc: "Inventar active, echipamente, scule sau chei cu semnături.", func: "pornesteFluxDocument('proces_verbal')" }
        ]
    }
};

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
    const hub = document.getElementById('hubCategorii');
    const mainMenu = document.getElementById('mainMenuContainer');
    const listaDoc = document.getElementById('listaDocumenteContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const progressBar = document.getElementById('progressBarContainer');
    const stepsBanner = document.getElementById('stepsCompletedBanner');

    for (let i = 1; i <= 5; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.classList.remove('active');
    }

    if (hub) hub.style.display = 'block';
    if (mainMenu) mainMenu.style.display = 'block';
    if (listaDoc) listaDoc.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    if (progressBar) progressBar.style.display = 'none';
    if (stepsBanner) stepsBanner.style.display = 'none';
    currentStepIndex = 1;
}

function deschideDashboard() {
    const hub = document.getElementById('hubCategorii');
    const mainMenu = document.getElementById('mainMenuContainer');
    const listaDoc = document.getElementById('listaDocumenteContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const progressBar = document.getElementById('progressBarContainer');
    const stepsBanner = document.getElementById('stepsCompletedBanner');

    for (let i = 1; i <= 5; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.classList.remove('active');
    }

    if (hub) hub.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'none';
    if (listaDoc) listaDoc.style.display = 'none';
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
        'comodantAutoNume', 'comodantAutoCnp', 'comodantAutoAct', 'comodantAutoAdresa',
        'comodatarAutoNume', 'comodatarAutoCnp', 'comodatarAutoAct', 'comodatarAutoAdresa',
        'comodatAutoMarca', 'comodatAutoModel', 'comodatAutoVin', 'comodatAutoNr', 'comodatAutoMotor', 'comodatAutoCmc', 'comodatAutoDurata',
        'comodantImobilNume', 'comodantImobilCnp', 'comodantImobilAct', 'comodantImobilAdresa',
        'comodatarImobilNume', 'comodatarImobilCnp', 'comodatarImobilAct', 'comodatarImobilAdresa',
        'comodatImobilAdresaBun', 'comodatImobilCf', 'comodatCadastru', 'comodatImobilScop', 'comodatImobilDurata',
        'cimAngajatorNume', 'cimAngajatorCui', 'cimAngajatorReg', 'cimAngajatorAdresa', 'cimAngajatorReprezentant',
        'cimSalariatNume', 'cimSalariatCnp', 'cimSalariatSerie', 'cimSalariatNumar', 'cimSalariatEmitent', 'cimSalariatAdresa', 'cimSalariatIban',
        'cimFunctie', 'cimTipDurata', 'cimTimpMunca', 'cimSalariuBrut', 'cimDataStart', 'cimLocMunca',
        'fisaAngajator', 'fisaSalariat', 'fisaFunctie', 'fisaCor', 'fisaDepartament', 'fisaSubordonare', 'fisaAtributii', 'fisaResponsabilitati', 'fisaStudii', 'fisaVechime',
        'pvPredatorNume', 'pvPredatorCuiCnp', 'pvPredatorCalitate', 'pvPredatorAdresa',
    'pvPrimitorNume', 'pvPrimitorCnp', 'pvPrimitorAct', 'pvPrimitorFunctie', 'pvPrimitorAdresa',
    'pvTemei', 'pvInventar',
    'actAngajator', 'actSalariat', 'actCimNr', 'actCimData', 'actTipModificare', 'actDataAplicarii', 'actContinutNou',
    'procuraMandantNume', 'procuraMandantCnp', 'procuraMandantAct', 'procuraMandantAdresa',
        'procuraMandatarNume', 'procuraMandatarCnp', 'procuraMandatarAct', 'procuraMandatarAdresa',
        'procuraAutoMarca', 'procuraAutoModel', 'procuraAutoVin', 'procuraAutoNr', 'procuraAutoMotor',
        'itlContribuabilNume', 'itlContribuabilCnp', 'itlContribuabilAct', 'itlContribuabilAdresa', 'itlContribuabilCalitate', 'itlContribuabilTelefon', 'itlContribuabilEmail',
        'itlAutoMarca', 'itlAutoMotor', 'itlAutoVin', 'itlAutoCapacitate', 'itlAutoDataDobandirii', 'itlMotivRadiere', 'itlDataEfectiva',
        'itlTipActDoveditor', 'itlNumarDataAct', 'itlNoulProprietarNume', 'itlNoulProprietarAdresa',
        'itl005TipContribuabil', 'itl005Nume', 'itl005Act', 'itl005Cnp', 'itl005Adresa', 'itl005Telefon', 'itl005Email',
        'itl005PjNume', 'itl005PjCui', 'itl005PjReg', 'itl005PjIban',
        'itl005ModDobandire', 'itl005Marca', 'itl005Vin', 'itl005Motor', 'itl005Capacitate', 'itl005An', 'itl005Norma', 'itl005DataDobandirii',
        'itl005Co2', 'itl005PutereKw',
        'itl005Scutire', 'itl005Anexa1', 'itl005Anexa2', 'itl005Anexa3',
        'proprietarNume', 'proprietarCnp', 'proprietarAct', 'proprietarAdresa',
        'pvProprietarNume', 'pvProprietarCnp', 'pvProprietarAct', 'pvProprietarAdresa',
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        d[id] = el ? String(el.value || '').trim() : '';
    });
    return d;
}

// Control categorii Bento Grid 2026
function deschideCategorie(cheie) {
    const hub = document.getElementById('hubCategorii');
    const container = document.getElementById('listaDocumenteContainer');
    const titlu = document.getElementById('titluCategorieSelectata');
    const lista = document.getElementById('elementeListaActe');

    const cat = dateCategorii[cheie];
    if (!cat) return;

    titlu.innerText = cat.titlu;
    lista.innerHTML = '';

    cat.acte.forEach(act => {
        lista.innerHTML += `
            <div onclick="${act.func}" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border-color); margin-bottom: 10px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div>
                    <h4 style="font-weight: 700; font-size: 15px; color: var(--text-main); margin-bottom: 4px;">${act.nume}</h4>
                    <p style="font-size: 13px; color: var(--text-muted);">${act.desc}</p>
                </div>
                <span style="font-weight: bold; color: var(--primary); font-size: 16px;">→</span>
            </div>
        `;
    });

    if (hub) hub.style.display = 'none';
    if (container) container.style.display = 'block';
}

function inchideListaCategorii() {
    const hub = document.getElementById('hubCategorii');
    const container = document.getElementById('listaDocumenteContainer');
    if (hub) hub.style.display = 'block';
    if (container) container.style.display = 'none';
}

function pornesteFluxDocument(cat) {
    selecteazaCategorieTip(cat);
}

function selecteazaCategorieTip(cat) {
    tipContractCurent = cat; 
    const hub = document.getElementById('hubCategorii');
    const listaDoc = document.getElementById('listaDocumenteContainer');
    const mainMenu = document.getElementById('mainMenuContainer');
    const dashView = document.getElementById('dashboardView');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const modTitle = document.getElementById('modSelectorTitle');

    if (hub) hub.style.display = 'none';
    if (listaDoc) listaDoc.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'none';
    if (dashView) dashView.style.display = 'none';

    if (cat === 'auto' || cat === 'imobiliare' || cat === 'itl_005') {
        if (modTitle) modTitle.innerText = `Mod de Lucru - ${cat === 'auto' ? 'Contract Auto ITL 054' : cat === 'itl_005' ? 'Declarație Fiscală ITL-005' : 'Contract Închiriere Locuință'}`;
        if (modeSelector) modeSelector.style.display = 'block';
    } else {
        if (modeSelector) modeSelector.style.display = 'none';
        maxStepsTotal = (cat === 'fisa_postului') ? 5 : 4;
        selecteazaModSiPorneste('local');
    }
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    const modeSelector = document.getElementById('modeSelectorContainer');
    if (modeSelector) modeSelector.style.display = 'none';

    const progressBar = document.getElementById('progressBarContainer');
    if (progressBar) progressBar.style.display = 'flex';

    if (tipContractCurent === 'fisa_postului'|| tipContractCurent === 'act_aditional') {
        maxStepsTotal = 5;
    } else if (tipContractCurent === 'proces_verbal' || tipContractCurent === 'procura' || tipContractCurent === 'itl_016' || tipContractCurent === 'itl_005') {
        maxStepsTotal = 4;
    } else if (tipContractCurent === 'imobiliare' || tipContractCurent === 'pv_locuinta' || tipContractCurent === 'comodat_auto' || tipContractCurent === 'comodat_imobil' || tipContractCurent === 'prestari_servicii' || tipContractCurent === 'cim') {
        maxStepsTotal = 4;
    } else if (tipContractCurent === 'auto') {
        maxStepsTotal = (mod === 'remote') ? 5 : 4;
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

    // Gestionare vizibilitate formulare Pas 1
    const fAuto1 = document.getElementById('formAutoStep1');
    const fPrest1 = document.getElementById('formPrestariStep1');
    const fComodAuto1 = document.getElementById('formComodatAutoStep1');
    const fComodImob1 = document.getElementById('formComodatImobilStep1');
    const fImob1 = document.getElementById('formImobiliareStep1');
    const fDem1 = document.getElementById('formDemisieStep1');
    const fCim1 = document.getElementById('formCimStep1');
    const fFisa1 = document.getElementById('formFisaStep1');
    const fPv1 = document.getElementById('formPvStep1');
    const fAct1 = document.getElementById('formActAditionalStep1');
    const fProcura1 = document.getElementById('formProcuraStep1');
    const fItl1 = document.getElementById('formItl016Step1');
    const fItl005_1 = document.getElementById('formItl005Step1');
    const fPvLoc1 = document.getElementById('formPvLocuintaStep1');

    if (fAuto1) fAuto1.style.display = 'none';
    if (fPrest1) fPrest1.style.display = 'none';
    if (fComodAuto1) fComodAuto1.style.display = 'none';
    if (fComodImob1) fComodImob1.style.display = 'none';
    if (fImob1) fImob1.style.display = 'none';
    if (fDem1) fDem1.style.display = 'none';
    if (fCim1) fCim1.style.display = 'none';
    if (fFisa1) fFisa1.style.display = 'none';
    if (fPv1) fPv1.style.display = 'none';
    if (fAct1) fAct1.style.display = 'none';
    if (fProcura1) fProcura1.style.display = 'none';
    if (fItl1) fItl1.style.display = 'none';
    if (fItl005_1) fItl005_1.style.display = 'none';
    if (fPvLoc1) fPvLoc1.style.display = 'none';

    if (stepNum === 1) {
        if (tipContractCurent === 'auto' && fAuto1) fAuto1.style.display = 'grid';
        else if (tipContractCurent === 'prestari_servicii' && fPrest1) fPrest1.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComodAuto1) fComodAuto1.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComodImob1) fComodImob1.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob1) fImob1.style.display = 'grid';
        else if (tipContractCurent === 'demisie' && fDem1) fDem1.style.display = 'grid';
        else if (tipContractCurent === 'cim' && fCim1) fCim1.style.display = 'grid';
        else if (tipContractCurent === 'fisa_postului' && fFisa1) fFisa1.style.display = 'grid';
        else if (tipContractCurent === 'act_aditional' && fAct1) fAct1.style.display = 'grid';
        else if (tipContractCurent === 'proces_verbal' && fPv1) fPv1.style.display = 'grid';
        else if (tipContractCurent === 'procura' && fProcura1) fProcura1.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl1) fItl1.style.display = 'grid';
        else if (tipContractCurent === 'itl_005' && fItl005_1) fItl005_1.style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc1) fPvLoc1.style.display = 'grid';

        if (tipContractCurent === 'auto') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Vânzătorului";
        else if (tipContractCurent === 'prestari_servicii') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Prestatorului";
        else if (tipContractCurent === 'comodat_auto') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Comodantului (Proprietar Auto)";
        else if (tipContractCurent === 'comodat_imobil') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Comodantului (Proprietar Imobil)";
        else if (tipContractCurent === 'imobiliare') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Proprietarului & Imobilului";
        else if (tipContractCurent === 'demisie') document.getElementById('titleStep1').innerText = "Cerere de Demisie Oficială";
        else if (tipContractCurent === 'cim') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Angajatorului";
        else if (tipContractCurent === 'fisa_postului') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Angajatorului, Salariatului & Postului";
        else if (tipContractCurent === 'proces_verbal') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Predătorului";
        else if (tipContractCurent === 'act_aditional') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Părților & CIM";
        else if (tipContractCurent === 'procura') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Mandantului (Proprietar)";
        else if (tipContractCurent === 'itl_016') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Contribuabilului (Declarant)";
        else if (tipContractCurent === 'itl_005') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Contribuabilului / Dobânditorului";
        else if (tipContractCurent === 'pv_locuinta') document.getElementById('titleStep1').innerText = "Pasul 1: Datele Locatorului";
    }

    // Gestionare vizibilitate formulare Pas 2
    const fAuto2 = document.getElementById('formAutoStep2');
    const fPrest2 = document.getElementById('formPrestariStep2');
    const fComodAuto2 = document.getElementById('formComodatAutoStep2');
    const fComodImob2 = document.getElementById('formComodatImobilStep2');
    const fImob2 = document.getElementById('formImobiliareStep2');
    const demisSign = document.getElementById('demisSignBoxContainer');
    const fCim2 = document.getElementById('formCimStep2');
    const fFisa2 = document.getElementById('formFisaStep2');
    const fPv2 = document.getElementById('formPvStep2');
    const fAct2 = document.getElementById('formActAditionalStep2');
    const fProcura2 = document.getElementById('formProcuraStep2');
    const fItl2 = document.getElementById('formItl016Step2');
    const fItl005_2 = document.getElementById('formItl005Step2');
    const fPvLoc2 = document.getElementById('formPvLocuintaStep2');

    if (fAuto2) fAuto2.style.display = 'none';
    if (fPrest2) fPrest2.style.display = 'none';
    if (fComodAuto2) fComodAuto2.style.display = 'none';
    if (fComodImob2) fComodImob2.style.display = 'none';
    if (fImob2) fImob2.style.display = 'none';
    if (demisSign) demisSign.style.display = 'none';
    if (fCim2) fCim2.style.display = 'none';
    if (fFisa2) fFisa2.style.display = 'none';
    if (fPv2) fPv2.style.display = 'none';
    if (fAct2) fAct2.style.display = 'none';
    if (fProcura2) fProcura2.style.display = 'none';
    if (fItl2) fItl2.style.display = 'none';
    if (fItl005_2) fItl005_2.style.display = 'none';
    if (fPvLoc2) fPvLoc2.style.display = 'none';

    if (stepNum === 2) {
        if (tipContractCurent === 'auto' && fAuto2) fAuto2.style.display = 'grid';
        else if (tipContractCurent === 'prestari_servicii' && fPrest2) fPrest2.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComodAuto2) fComodAuto2.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComodImob2) fComodImob2.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob2) fImob2.style.display = 'grid';
        else if (tipContractCurent === 'cim' && fCim2) fCim2.style.display = 'grid';
        else if (tipContractCurent === 'fisa_postului' && fFisa2) fFisa2.style.display = 'grid';
        else if (tipContractCurent === 'act_aditional' && fAct2) fAct2.style.display = 'grid';
        else if (tipContractCurent === 'proces_verbal' && fPv2) fPv2.style.display = 'grid';
        else if (tipContractCurent === 'procura' && fProcura2) fProcura2.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl2) fItl2.style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc2) fPvLoc2.style.display = 'grid';
        else if (tipContractCurent === 'itl_005' && fItl005_2) fItl005_2.style.display = 'grid';
        else if (tipContractCurent === 'demisie') {
            if (demisSign) demisSign.style.display = 'block';
            initCanvasSemnatura('sigDemisieCanvas');
        }

        if (tipContractCurent === 'auto') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Cumpărătorului";
        else if (tipContractCurent === 'prestari_servicii') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Beneficiarului";
        else if (tipContractCurent === 'comodat_auto') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Comodatarului (Utilizator Auto)";
        else if (tipContractCurent === 'comodat_imobil') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Comodatarului (Beneficiar Imobil)";
        else if (tipContractCurent === 'imobiliare') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Chiriașului (Locatar)";
        else if (tipContractCurent === 'demisie') document.getElementById('titleStep2').innerText = "Pasul 2: Semnătură Salariat";
        else if (tipContractCurent === 'cim') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Salariatului & Condiții Post";
        else if (tipContractCurent === 'fisa_postului') document.getElementById('titleStep2').innerText = "Pasul 2: Atribuții și Responsabilități";
        else if (tipContractCurent === 'proces_verbal') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Primitorului";
        else if (tipContractCurent === 'act_aditional') document.getElementById('titleStep2').innerText = "Pasul 2: Obiectul Modificării";
        else if (tipContractCurent === 'procura') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Mandatarului (Împuternicit)";
        else if (tipContractCurent === 'itl_016') document.getElementById('titleStep2').innerText = "Pasul 2: Vehiculul și Motivul Radierii";
        else if (tipContractCurent === 'itl_005') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Mijlocului de Transport Dobândit";
        if (tipContractCurent === 'pv_locuinta') document.getElementById('titleStep2').innerText = "Pasul 2: Datele Locatarului & Imobil";
        
    }

    // Gestionare vizibilitate formulare Pas 3
    const fAuto3 = document.getElementById('formAutoStep3');
    const fPrest3 = document.getElementById('formPrestariStep3');
    const fComodAuto3 = document.getElementById('formComodatAutoStep3');
    const fComodImob3 = document.getElementById('formComodatImobilStep3');
    const fFisa3 = document.getElementById('formFisaStep3');
    const fPv3 = document.getElementById('formPvStep3');
    const fAct3 = document.getElementById('formActAditionalStep3');
    const fProcura3 = document.getElementById('formProcuraStep3');
    const fItl3 = document.getElementById('formItl016Step3');
    const fItl005_3 = document.getElementById('formItl005Step3');
    const fPvLoc3 = document.getElementById('formPvLocuintaStep3');

    if (fAuto3) fAuto3.style.display = 'none';
    if (fPrest3) fPrest3.style.display = 'none';
    if (fComodAuto3) fComodAuto3.style.display = 'none';
    if (fComodImob3) fComodImob3.style.display = 'none';
    if (fFisa3) fFisa3.style.display = 'none';
    if (fPv3) fPv3.style.display = 'none';
    if (fAct3) fAct3.style.display = 'none';
    if (fProcura3) fProcura3.style.display = 'none';
    if (fItl3) fItl3.style.display = 'none';
    if (fItl005_3) fItl005_3.style.display = 'none';
    if (fPvLoc3) fPvLoc3.style.display = 'none';

    if (stepNum === 3) {
        if (tipContractCurent === 'auto' && fAuto3) fAuto3.style.display = 'grid';
        if (stepNum === 3 && tipContractCurent === 'proces_verbal' && fPv3) {
        fPv3.style.display = 'grid';
        }
        else if (tipContractCurent === 'prestari_servicii' && fPrest3) fPrest3.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComodAuto3) fComodAuto3.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComodImob3) fComodImob3.style.display = 'grid';
        else if (tipContractCurent === 'fisa_postului' && fFisa3) fFisa3.style.display = 'grid';
        else if (tipContractCurent === 'act_aditional' && fAct3) fAct3.style.display = 'grid';
        else if (tipContractCurent === 'procura' && fProcura3) fProcura3.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl3) {fItl3.style.display = 'grid';
            initCanvasSemnatura('sigItlDeclarantCanvas');
        } else if (tipContractCurent === 'itl_005' && fItl005_3) {
            fItl005_3.style.display = 'grid';
            initCanvasSemnatura('sigItl005Canvas');
        } else if (tipContractCurent === 'pv_locuinta' && fPvLoc3) {
            fPvLoc3.style.display = 'grid';
            initCanvasSemnatura('sigProprietarCanvas');
            initCanvasSemnatura('sigChiriasCanvas');
        }
const procuraSignContainer = document.getElementById('procuraSignContainer');
    if (procuraSignContainer) {
        procuraSignContainer.style.display = (tipContractCurent === 'procura' && stepNum === 3) ? 'block' : 'none';
    }
    if (tipContractCurent === 'procura' && stepNum === 3) {
        initCanvasSemnatura('sigProcuraMandantCanvas');
    }

        const pvSemnContainer = document.getElementById('pvSemnaturiContainer');
    if (pvSemnContainer) {
        pvSemnContainer.style.display = (tipContractCurent === 'proces_verbal' && stepNum === 3) ? 'block' : 'none';
    }
    if (tipContractCurent === 'proces_verbal' && stepNum === 3) {
        initCanvasSemnatura('sigPvPredatorCanvas');
        initCanvasSemnatura('sigPvPrimitorCanvas');
    }

        const titleStep3El = document.getElementById('titleStep3');
        if (titleStep3El) {
            if (tipContractCurent === 'auto') titleStep3El.innerText = "Pasul 3: Vehiculul și Prețul";
            else if (tipContractCurent === 'prestari_servicii') titleStep3El.innerText = "Pasul 3: Detalii & Preț Servicii";
            else if (tipContractCurent === 'comodat_auto') titleStep3El.innerText = "Pasul 3: Detalii Autoturism & Semnături";
            else if (tipContractCurent === 'comodat_imobil') titleStep3El.innerText = "Pasul 3: Detalii Imobil & Semnături";
            else if (tipContractCurent === 'imobiliare') titleStep3El.innerText = "Pasul 3: Condiții, Inventar & Semnături";
            else if (tipContractCurent === 'cim') titleStep3El.innerText = "Pasul 3: Datele Contractului & Semnături";
            else if (tipContractCurent === 'fisa_postului') titleStep3El.innerText = "Pasul 3: Cerințele Postului";
            else if (tipContractCurent === 'proces_verbal') titleStep3El.innerText = "Pasul 3: Detalii Proces Verbal";
            else if (tipContractCurent === 'act_aditional') document.getElementById('titleStep3').innerText = "Pasul 3: Noile Condiții & Data";
            else if (tipContractCurent === 'procura') document.getElementById('titleStep3').innerText = "Pasul 3: Vehicul, Instituții & Semnătură";
            else if (tipContractCurent === 'itl_016') titleStep3El.innerText = "Pasul 3: Act Doveditor, Noul Proprietar & Semnătură";
            else if (tipContractCurent === 'itl_005') titleStep3El.innerText = "Pasul 3: Anexe, Facilități & Semnătură Olografă";
            else if (tipContractCurent === 'pv_locuinta') titleStep3El.innerText = "Pasul 3: Inventar, Stare Tehnică & Semnături";
        }
    }

    // Gestionare vizibilitate formulare Pas 4 pentru Fisa Postului
    const fFisa4 = document.getElementById('formFisaStep4');
    if (fFisa4) fFisa4.style.display = (tipContractCurent === 'fisa_postului' && stepNum === 4) ? 'block' : 'none';

    // Logică corectă pentru pașii de semnătură și plată
    let estePasSemnatura = false;
    let estePasPlataDescarcare = false;

    if (tipContractCurent === 'fisa_postului' || tipContractCurent === 'act_aditional') {
        estePasSemnatura = (stepNum === 4);
        estePasPlataDescarcare = (stepNum === 5);
    }
    if (tipContractCurent === 'fisa_postului') {
        estePasSemnatura = (stepNum === 4);
        estePasPlataDescarcare = (stepNum === 5);
    } else if (maxStepsTotal === 4 && (tipContractCurent === 'imobiliare' || tipContractCurent === 'pv_locuinta'|| tipContractCurent === 'comodat_auto' || tipContractCurent === 'comodat_imobil' || tipContractCurent === 'prestari_servicii' || tipContractCurent === 'proces_verbal' || tipContractCurent === 'cim')) {
        estePasSemnatura = (stepNum === 3);
        estePasPlataDescarcare = (stepNum === 4);
    } else if (maxStepsTotal === 4 && (tipContractCurent === 'auto' || tipContractCurent === 'prestari_servicii')) {
        estePasPlataDescarcare = (stepNum === 4);
    } else if (maxStepsTotal === 3) {
        estePasPlataDescarcare = (stepNum === 3);
    } else {
        estePasSemnatura = (stepNum === maxStepsTotal - 1);
        estePasPlataDescarcare = (stepNum === maxStepsTotal);
    }

    const imobContainer = document.getElementById('imobiliareSemnaturiContainer');
    const localAct = document.getElementById('localActions');
    const finalDownloadContainer = document.getElementById('finalDownloadContainer');
    const payments = document.querySelectorAll('.paymentStepContainer');
    const downloads = document.querySelectorAll('.finalDownloadContainer');
    const fAct4 = document.getElementById('formActAditionalStep4');

    if (estePasSemnatura) {
        if (imobContainer) imobContainer.style.display = (tipContractCurent === 'imobiliare') ? 'block' : 'none';
        if (localAct) localAct.style.display = (modLucru === 'remote') ? 'block' : 'none';
        if (finalDownloadContainer) finalDownloadContainer.style.display = 'none';
        if (fAct4) fAct4.style.display = (tipContractCurent === 'act_aditional' && stepNum === 4) ? 'block' : 'none';
        payments.forEach(el => el.style.display = 'none');
        downloads.forEach(el => el.style.display = 'none');

        const lblPart1 = document.getElementById('labelPart1Sign');
        const lblPart2 = document.getElementById('chiriasSignLabel');
        if (lblPart1 && lblPart2) {
            if (tipContractCurent === 'comodat_imobil' || tipContractCurent === 'comodat_auto') {
                lblPart1.innerText = "Semnătură Comodant (Proprietar)";
                lblPart2.innerText = "Semnătură Comodatar (Beneficiar)";
            } else if (tipContractCurent === 'prestari_servicii') {
                lblPart1.innerText = "Semnătură Prestator (Executant)";
                lblPart2.innerText = "Semnătură Beneficiar (Client)";
            } else if (tipContractCurent === 'cim') {
                lblPart1.innerText = "Semnătură Angajator (Reprezentant)";
                lblPart2.innerText = "Semnătură Salariat";
            } else if (tipContractCurent === 'fisa_postului') {
                lblPart1.innerText = "Semnătură Reprezentant (Angajator)";
                lblPart2.innerText = "Semnătură Salariat";
            } else {
                lblPart1.innerText = "Semnătură Proprietar (Locator)";
                lblPart2.innerText = "Semnătură Chiriaș (Locatar)";
            }
        }
        initCanvasSemnatura('sigFisaAngajatorCanvas');
        initCanvasSemnatura('sigFisaSalariatCanvas');
        initCanvasSemnatura('sigProprietarCanvas');
        initCanvasSemnatura('sigChiriasCanvas');
        initCanvasSemnatura('sigActAngajatorCanvas');
        initCanvasSemnatura('sigActSalariatCanvas');
    } else {
        if (imobContainer) imobContainer.style.display = 'none';
    }

    if (estePasPlataDescarcare) {
        payments.forEach(el => el.style.display = 'block');
        if (finalDownloadContainer) finalDownloadContainer.style.display = 'none';

        const btnNext3 = document.getElementById('btnNextStep3');
        if (btnNext3) btnNext3.style.display = 'none';
        const btnNext4 = document.getElementById('btnNextStep4');
        if (btnNext4) btnNext4.style.display = 'none';

        const titleFinal = document.getElementById('titleStep' + stepNum) || document.getElementById('titleStep3') || document.getElementById('titleStep4') || document.getElementById('titleStep5');
        if (titleFinal) titleFinal.innerText = `Pasul ${stepNum}: Finalizare și Plată Securizată`;
    } else {
        payments.forEach(el => el.style.display = 'none');
        downloads.forEach(el => el.style.display = 'none');
        
        const btnNext3 = document.getElementById('btnNextStep3');
        if (btnNext3) btnNext3.style.display = 'inline-block';
        const btnNext4 = document.getElementById('btnNextStep4');
        if (btnNext4) btnNext4.style.display = 'inline-block';
    }
}

function nextStep(current) {
    if (tipContractCurent === 'proces_verbal' && current === 3) {
        activeazaPasulUI(4);
        return;  
    }
    if (current < maxStepsTotal) {
        activeazaPasulUI(current + 1);
    } else {
        proceseazaPlataSiDescarca();
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

function proceseazaPlataSiDescarca() {
    if (!profilCurent || (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT')) {
        arataNotificare("⚠️ Ați epuizat numărul de contracte gratuite din cont!", true);
        deschideDashboard();
        return;
    }

    arataNotificare("Se procesează plata securizată...");

    setTimeout(() => {
        arataNotificare("✅ Plată efectuată cu succes!");

        const paymentContainer = document.querySelectorAll('.paymentStepContainer');
        paymentContainer.forEach(el => el.style.display = 'none');
        
        const finalDownloadContainer = document.querySelectorAll('.finalDownloadContainer');
        finalDownloadContainer.forEach(el => el.style.display = 'block');

        ruleazaDescarcareaFinala();

    }, 1000);
}

function ruleazaDescarcareaFinala() {
    if (tipContractCurent === 'auto') {
        if (typeof genereazaContractOficialPDF === 'function') genereazaContractOficialPDF();
    } else if (tipContractCurent === 'imobiliare') {
        if (typeof genereazaContractImobiliarPDF === 'function') genereazaContractImobiliarPDF();
    } else if (tipContractCurent === 'comodat_auto') {
        if (typeof genereazaContractComodatAutoPDF === 'function') genereazaContractComodatAutoPDF();
    } else if (tipContractCurent === 'comodat_imobil') {
        if (typeof genereazaContractComodatImobilPDF === 'function') genereazaContractComodatImobilPDF();
    } else if (tipContractCurent === 'prestari_servicii') {
        if (typeof genereazaContractPrestariServiciiPDF === 'function') genereazaContractPrestariServiciiPDF();
    } else if (tipContractCurent === 'demisie') {
        if (typeof genereazaCerereDemisiePDF === 'function') genereazaCerereDemisiePDF();
    } else if (tipContractCurent === 'cim') {
        if (typeof genereazaContractCimPDF === 'function') genereazaContractCimPDF();
    } else if (tipContractCurent === 'fisa_postului') {
        if (typeof genereazaFisaPostuluiPDF === 'function') genereazaFisaPostuluiPDF();
    } else if (tipContractCurent === 'proces_verbal') {
        if (typeof genereazaProcesVerbalPDF === 'function') genereazaProcesVerbalPDF();
    } else if (tipContractCurent === 'act_aditional') {
        if (typeof genereazaActAditionalPDF === 'function') genereazaActAditionalPDF();
    } else if (tipContractCurent === 'procura') {
        if (typeof genereazaProcuraPDF === 'function') genereazaProcuraPDF();
    } else if (tipContractCurent === 'itl_016') {
        if (typeof genereazaItl016PDF === 'function') genereazaItl016PDF(); // ➔ Adăugat
    } else if (tipContractCurent === 'itl_005') {
        if (typeof genereazaItl005PDF === 'function') genereazaItl005PDF();
    } else if (tipContractCurent === 'pv_locuinta') {
    if (typeof genereazaProcesVerbalLocuintaPDF === 'function') genereazaProcesVerbalLocuintaPDF();
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
        numeClient: dateFormular.buyerName || dateFormular.chiriasNume || dateFormular.proprietarNume || dateFormular.beneficiarNume || dateFormular.comodatarAutoNume || dateFormular.comodatarImobilNume || dateFormular.demisNume || dateFormular.cimSalariatNume || dateFormular.fisaSalariat || dateFormular.pvPrimitorNume ||
        dateFormular.procuraMandantNume || dateFormular.itlNoulProprietarNume || dateFormular.itlContribuabilNume || dateFormular.itl005Nume || 'Client Necunoscut',
        tip: tipContractCurent.toUpperCase(),
        data: new Date().toLocaleDateString('ro-RO')
    });
}

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