/* =================================================================v
   ACTPELOC — SCRIPT CENTRAL DE LOGICĂ & INTERFAȚĂ (EDIȚIA 2026)
   Dedicat exclusiv categoriilor: Auto & Transport și Imobiliare & Locuințe
   ================================================================= */

let currentStepIndex = 1;
let maxStepsTotal = 4;
let modLucru = 'local';
let tipContractCurent = 'auto'; // Valori suportate: 'auto', 'itl_016', 'itl_005', 'comodat_auto', 'procura', 'imobiliare', 'comodat_imobil', 'pv_locuinta'
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

// Dicționarul categoriilor și actelor pentru meniul principal (Exclusiv Auto & Imobiliare)
const dateCategorii = {
    auto: {
        titlu: "Auto & Transport",
        acte: [
            { id: 'auto-054', nume: "Contract Vânzare-Cumpărare Auto (ITL 054)", desc: "Model oficial fiscal pentru înmatriculare / radieri.", func: "pornesteFluxDocument('auto')" },
            { id: 'itl-016', nume: "Declarație Scoatere din Evidență Auto (ITL-016)", desc: "Model oficial pentru radiere fiscală la Primărie (vânzător).", func: "pornesteFluxDocument('itl_016')" },
            { id: 'itl-005', nume: "Declarație Fiscală ITL-005 (Cumpărător / Impunere Auto)", desc: "Declarație fiscală pentru stabilirea impozitului pe mijloacele de transport la achiziție.", func: "pornesteFluxDocument('itl_005')" },
            { id: 'comodat-auto', nume: "Contract de Comodat Auto", desc: "Împrumut folosință gratuită autoturism (cu serie șasiu 17 caractere).", func: "pornesteFluxDocument('comodat_auto')" },
            { id: 'procura-auto', nume: "Procură / Împuternicire RAR & Înmatriculări", desc: "Pentru reprezentare în fața RAR, SPCRPCIV și autorităților fiscale.", func: "pornesteFluxDocument('procura')" }
        ]
    },
    imobiliare: {
        titlu: "Imobiliare & Locuințe",
        acte: [
            { id: 'imob-inchiriere', nume: "Contract de Închiriere Locuință", desc: "Include inventar detaliat și clauze fiscale ANAF.", func: "pornesteFluxDocument('imobiliare')" },
            { id: 'comodat-imobil', nume: "Contract de Comodat Imobil", desc: "Pentru stabilire sediu social (ONRC) sau locuință (cu CF).", func: "pornesteFluxDocument('comodat_imobil')" },
            { id: 'pv-locuinta', nume: "Proces-Verbal Predare-Primire Locuință", desc: "Inventar bunuri, indici contoare & stare tehnică.", func: "pornesteFluxDocument('pv_locuinta')" }
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
    const listaDoc = document.getElementById('listaDocumenteContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const progressBar = document.getElementById('progressBarContainer');

    for (let i = 1; i <= 5; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.classList.remove('active');
    }

    if (hub) hub.style.display = 'block';
    if (listaDoc) listaDoc.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (dashView) dashView.style.display = 'none';
    if (progressBar) progressBar.classList.remove('active-progress');
    currentStepIndex = 1;
}

function deschideDashboard() {
    const hub = document.getElementById('hubCategorii');
    const listaDoc = document.getElementById('listaDocumenteContainer');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const dashView = document.getElementById('dashboardView');
    const progressBar = document.getElementById('progressBarContainer');

    for (let i = 1; i <= 5; i++) {
        const s = document.getElementById('step' + i);
        if (s) s.classList.remove('active');
    }

    if (hub) hub.style.display = 'none';
    if (listaDoc) listaDoc.style.display = 'none';
    if (modeSelector) modeSelector.style.display = 'none';
    if (progressBar) progressBar.classList.remove('active-progress');

    if (dashView) {
        dashView.style.display = 'block';
        verificaSiActiveazaCredite();
        const emailText = document.getElementById('infoDashEmail');
        if (emailText) emailText.innerText = profilCurent.email;
        const pachetText = document.getElementById('infoDashPachet');
        if (pachetText) pachetText.innerText = profilCurent.pachet;
        const profilText = document.getElementById('infoDashProfil');
        if (profilText) profilText.innerText = profilCurent.profil || 'PERSOANA_FIZICA';
        const refLink = document.getElementById('myReferralLinkText');
        if (refLink) refLink.innerText = `${window.location.origin}${window.location.pathname}?ref=MARIO99`;
    }
}

function acceseazaDashboardTab(tabName) {
    deschideDashboard();
    schimbaTabDash(tabName, document.querySelector(`.dash-tab-btn`));
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
            <td><button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; width: auto;" onclick="arataNotificare('Descărcare arhivă disponibilă în sesiunea activă.')">📥 Redescarcă</button></td>
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
        'itlContribuabilNume', 'itlContribuabilCnp', 'itlContribuabilAct', 'itlContribuabilAdresa', 'itlContribuabilCalitate', 'itlContribuabilTelefon', 'itlContribuabilEmail',
        'itlAutoMarca', 'itlAutoMotor', 'itlAutoVin', 'itlAutoCapacitate', 'itlAutoDataDobandirii', 'itlMotivRadiere', 'itlDataEfectiva',
        'itlTipActDoveditor', 'itlNumarDataAct', 'itlNoulProprietarNume', 'itlNoulProprietarAdresa',
        'comodantAutoNume', 'comodantAutoCnp', 'comodantAutoAct', 'comodantAutoAdresa',
        'comodatarAutoNume', 'comodatarAutoCnp', 'comodatarAutoAct', 'comodatarAutoAdresa',
        'comodatAutoMarca', 'comodatAutoModel', 'comodatAutoVin', 'comodatAutoNr',
        'procuraMandantNume', 'procuraMandantCnp', 'procuraMandantAct', 'procuraMandantAdresa',
        'procuraMandatarNume', 'procuraMandatarCnp', 'procuraMandatarAct', 'procuraMandatarAdresa',
        'procuraAutoMarca', 'procuraAutoModel', 'procuraAutoVin',
        'comodantImobilNume', 'comodantImobilCnp', 'comodantImobilAct', 'comodantImobilAdresa',
        'comodatarImobilNume', 'comodatarImobilCnp', 'comodatarImobilAct', 'comodatarImobilAdresa',
        'comodatImobilAdresaBun', 'comodatImobilCf',
        'proprietarNume', 'proprietarCnp', 'proprietarAct', 'imobilAdresa', 'imobilChirie', 'imobilGarantie',
        'chiriasNume', 'chiriasCnp', 'chiriasAct',
        'pvProprietarNume', 'pvProprietarCnp', 'pvProprietarAct', 'pvProprietarAdresa',
        'pvChiriasNume', 'pvChiriasCnp', 'pvChiriasAct', 'pvInventarBunuri'
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        d[id] = el ? String(el.value || '').trim() : '';
    });
    return d;
}

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
    deschideMeniuPrincipal();
}

function pornesteFluxDocument(cat) {
    selecteazaCategorieTip(cat);
}

function selecteazaCategorieTip(cat) {
    tipContractCurent = cat; 
    const hub = document.getElementById('hubCategorii');
    const listaDoc = document.getElementById('listaDocumenteContainer');
    const dashView = document.getElementById('dashboardView');
    const modeSelector = document.getElementById('modeSelectorContainer');
    const modTitle = document.getElementById('modSelectorTitle');

    if (hub) hub.style.display = 'none';
    if (listaDoc) listaDoc.style.display = 'none';
    if (dashView) dashView.style.display = 'none';

    if (modTitle) {
        let numeFrumos = "Document Oficial";
        if (cat === 'auto') numeFrumos = "Contract Vânzare-Cumpărare Auto (ITL 054)";
        else if (cat === 'itl_016') numeFrumos = "Declarație Scoatere din Evidență Auto (ITL-016)";
        else if (cat === 'itl_005') numeFrumos = "Declarație Fiscală Impunere Auto (ITL-005)";
        else if (cat === 'comodat_auto') numeFrumos = "Contract de Comodat Auto";
        else if (cat === 'procura') numeFrumos = "Procură / Împuternicire Specială Auto";
        else if (cat === 'imobiliare') numeFrumos = "Contract de Închiriere Locuință";
        else if (cat === 'comodat_imobil') numeFrumos = "Contract de Comodat Imobil";
        else if (cat === 'pv_locuinta') numeFrumos = "Proces-Verbal Predare-Primire Locuință";
        
        modTitle.innerText = `Mod de Lucru - ${numeFrumos}`;
    }
    if (modeSelector) modeSelector.style.display = 'block';
}

function selecteazaModSiPorneste(mod) {
    modLucru = mod;
    const modeSelector = document.getElementById('modeSelectorContainer');
    if (modeSelector) modeSelector.style.display = 'none';

    const progressBar = document.getElementById('progressBarContainer');
    if (progressBar) progressBar.classList.add('active-progress');

    // În modul local sǎrim peste pasul 4 (remote), deci avem 4 pași totali. În remote avem 5 pași.
    maxStepsTotal = (mod === 'remote') ? 5 : 4;

    for (let i = 1; i <= 5; i++) {
        const pBulina = document.getElementById('p' + i);
        if (pBulina) {
            if (mod === 'local' && i === 4) {
                pBulina.style.display = 'none';
            } else {
                pBulina.style.display = (i <= 5) ? 'flex' : 'none';
            }
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
    const fComodAuto1 = document.getElementById('formComodatAutoStep1');
    const fComodImob1 = document.getElementById('formComodatImobilStep1');
    const fImob1 = document.getElementById('formImobiliareStep1');
    const fProcura1 = document.getElementById('formProcuraStep1');
    const fItl1 = document.getElementById('formItl016Step1');
    const fPvLoc1 = document.getElementById('formPvLoc1');

    [fAuto1, fComodAuto1, fComodImob1, fImob1, fProcura1, fItl1, fPvLoc1].forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (stepNum === 1) {
        if (tipContractCurent === 'auto' && fAuto1) fAuto1.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComodAuto1) fComodAuto1.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComodImob1) fComodImob1.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob1) fImob1.style.display = 'grid';
        else if (tipContractCurent === 'procura' && fProcura1) fProcura1.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl1) fItl1.style.display = 'grid';
        else if (tipContractCurent === 'itl_005' && fItl1) fItl1.style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc1) fPvLoc1.style.display = 'grid';

        const t1 = document.getElementById('titleStep1');
        if (t1) {
            if (tipContractCurent === 'auto') t1.innerText = "Pasul 1: Datele Vânzătorului";
            else if (tipContractCurent === 'comodat_auto') t1.innerText = "Pasul 1: Datele Comodantului (Proprietar Auto)";
            else if (tipContractCurent === 'comodat_imobil') t1.innerText = "Pasul 1: Datele Comodantului (Proprietar Imobil)";
            else if (tipContractCurent === 'imobiliare') t1.innerText = "Pasul 1: Datele Proprietarului & Imobilului";
            else if (tipContractCurent === 'procura') t1.innerText = "Pasul 1: Datele Mandantului (Proprietar)";
            else if (tipContractCurent === 'itl_016') t1.innerText = "Pasul 1: Datele Contribuabilului (Declarant)";
            else if (tipContractCurent === 'itl_005') t1.innerText = "Pasul 1: Datele Contribuabilului / Dobânditorului";
            else if (tipContractCurent === 'pv_locuinta') t1.innerText = "Pasul 1: Datele Locatorului (Proprietar)";
        }
    }

    // Gestionare vizibilitate formulare Pas 2
    const fAuto2 = document.getElementById('formAutoStep2');
    const fComodAuto2 = document.getElementById('formComodatAutoStep2');
    const fComodImob2 = document.getElementById('formComodatImobilStep2');
    const fImob2 = document.getElementById('formImobiliareStep2');
    const fProcura2 = document.getElementById('formProcuraStep2');
    const fItl2 = document.getElementById('formItl016Step2');
    const fPvLoc2 = document.getElementById('formPvLoc2');

    [fAuto2, fComodAuto2, fComodImob2, fImob2, fProcura2, fItl2, fPvLoc2].forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (stepNum === 2) {
        if (tipContractCurent === 'auto' && fAuto2) fAuto2.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComodAuto2) fComodAuto2.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComodImob2) fComodImob2.style.display = 'grid';
        else if (tipContractCurent === 'imobiliare' && fImob2) fImob2.style.display = 'grid';
        else if (tipContractCurent === 'procura' && fProcura2) fProcura2.style.display = 'grid';
        else if (tipContractCurent === 'itl_016' && fItl2) fItl2.style.display = 'grid';
        else if (tipContractCurent === 'itl_005' && fItl2) fItl2.style.display = 'grid';
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc2) fPvLoc2.style.display = 'grid';

        const t2 = document.getElementById('titleStep2');
        if (t2) {
            if (tipContractCurent === 'auto') t2.innerText = "Pasul 2: Datele Cumpărătorului";
            else if (tipContractCurent === 'comodat_auto') t2.innerText = "Pasul 2: Datele Comodatarului (Utilizator Auto)";
            else if (tipContractCurent === 'comodat_imobil') t2.innerText = "Pasul 2: Datele Comodatarului (Beneficiar Imobil)";
            else if (tipContractCurent === 'imobiliare') t2.innerText = "Pasul 2: Datele Chiriașului (Locatar)";
            else if (tipContractCurent === 'procura') t2.innerText = "Pasul 2: Datele Mandatarului (Împuternicit)";
            else if (tipContractCurent === 'itl_016') t2.innerText = "Pasul 2: Vehiculul și Motivul Radierii";
            else if (tipContractCurent === 'itl_005') t2.innerText = "Pasul 2: Datele Mijlocului de Transport Dobândit";
            else if (tipContractCurent === 'pv_locuinta') t2.innerText = "Pasul 2: Datele Locatarului & Imobil";
        }
    }

    // Gestionare vizibilitate formulare Pas 3
    const fAuto3 = document.getElementById('formAutoStep3');
    const fComodAuto3 = document.getElementById('formComodatAutoStep3');
    const fComodImob3 = document.getElementById('formComodatImobilStep3');
    const fProcura3 = document.getElementById('formProcuraStep3');
    const fItl3 = document.getElementById('formItl016Step3');
    const fPvLoc3 = document.getElementById('formPvLoc3');
    const procuraSignContainer = document.getElementById('procuraSignContainer');
    const imobContainer = document.getElementById('imobiliareSemnaturiContainer');

    [fAuto3, fComodAuto3, fComodImob3, fProcura3, fItl3, fPvLoc3, procuraSignContainer, imobContainer].forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (stepNum === 3) {
        if (tipContractCurent === 'auto' && fAuto3) fAuto3.style.display = 'grid';
        else if (tipContractCurent === 'comodat_auto' && fComodAuto3) fComodAuto3.style.display = 'grid';
        else if (tipContractCurent === 'comodat_imobil' && fComodImob3) fComodImob3.style.display = 'grid';
        else if (tipContractCurent === 'procura' && fProcura3) {
            fProcura3.style.display = 'grid';
            if (procuraSignContainer) procuraSignContainer.style.display = 'block';
            initCanvasSemnatura('sigProcuraMandantCanvas');
        }
        else if (tipContractCurent === 'itl_016' && fItl3) {
            fItl3.style.display = 'grid';
            initCanvasSemnatura('sigItlDeclarantCanvas');
        } 
        else if (tipContractCurent === 'itl_005' && fItl3) {
            fItl3.style.display = 'grid';
            initCanvasSemnatura('sigItlDeclarantCanvas');
        } 
        else if (tipContractCurent === 'pv_locuinta' && fPvLoc3) {
            fPvLoc3.style.display = 'grid';
            if (imobContainer) imobContainer.style.display = 'block';
            initCanvasSemnatura('sigProprietarCanvas');
            initCanvasSemnatura('sigChiriasCanvas');
        }
        else if (tipContractCurent === 'imobiliare') {
            if (imobContainer) imobContainer.style.display = 'block';
            initCanvasSemnatura('sigProprietarCanvas');
            initCanvasSemnatura('sigChiriasCanvas');
        }

        const titleStep3El = document.getElementById('titleStep3');
        if (titleStep3El) {
            if (tipContractCurent === 'auto') titleStep3El.innerText = "Pasul 3: Vehiculul și Prețul";
            else if (tipContractCurent === 'comodat_auto') titleStep3El.innerText = "Pasul 3: Detalii Autoturism & Semnături";
            else if (tipContractCurent === 'comodat_imobil') titleStep3El.innerText = "Pasul 3: Detalii Imobil & Semnături";
            else if (tipContractCurent === 'imobiliare') titleStep3El.innerText = "Pasul 3: Condiții, Inventar & Semnături";
            else if (tipContractCurent === 'procura') titleStep3El.innerText = "Pasul 3: Vehicul, Instituții & Semnătură";
            else if (tipContractCurent === 'itl_016') titleStep3El.innerText = "Pasul 3: Act Doveditor, Noul Proprietar & Semnătură Olografă";
            else if (tipContractCurent === 'itl_005') titleStep3El.innerText = "Pasul 3: Anexe, Facilități & Semnătură Olografă";
            else if (tipContractCurent === 'pv_locuinta') titleStep3El.innerText = "Pasul 3: Inventar, Stare Tehnică & Semnături";
        }
    }

    // Gestionare Pas 4 / 5 (Trimitere la distanță sau Plată directă)
    const localActions = document.getElementById('localActions');
    const btnNextStep4 = document.getElementById('btnNextStep4');

    if (modLucru === 'remote' && stepNum === 4) {
        if (localActions) localActions.style.display = 'block';
        if (btnNextStep4) btnNextStep4.style.display = 'inline-block';
    } else {
        if (localActions) localActions.style.display = 'none';
        if (btnNextStep4) btnNextStep4.style.display = 'none';
    }
}

function nextStep(current) {
    if (modLucru === 'local' && current === 3) {
        // În mod local, de la pasul 3 sărim direct la pasul 5 (Plată)
        activeazaPasulUI(5);
        return;
    }

    if (current < 5) {
        activeazaPasulUI(current + 1);
    } else {
        proceseazaPlataSiDescarca();
    }
}

function prevStep(current) {
    if (modLucru === 'local' && current === 5) {
        // În mod local, de la pasul 5 înapoi mergem direct la pasul 3
        activeazaPasulUI(3);
        return;
    }

    if (current > 1) {
        activeazaPasulUI(current - 1);
    } else {
        deschideMeniuPrincipal();
    }
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

function pornesteFluxRemote() {
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
    const text = encodeURIComponent(`Completează documentul oficial accesând linkul securizat: ${linkCumparatorGlobal}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function proceseazaPlataSiDescarca() {
    if (!profilCurent || (profilCurent.ramase <= 0 && profilCurent.pachet === 'GRATUIT')) {
        arataNotificare("⚠️ Ați epuizat numărul de documente incluse din cont!", true);
        deschideDashboard();
        return;
    }

    arataNotificare("Se procesează plata securizată...");

    setTimeout(() => {
        arataNotificare("✅ Plată efectuată cu succes!");

        // CU ASTA (folosind ID-uri directe):
        const paymentContainer = document.getElementById('paymentStepContainer');
        if (paymentContainer) paymentContainer.style.display = 'none';
        
        const finalDownloadContainer = document.getElementById('finalDownloadContainer');
        if (finalDownloadContainer) finalDownloadContainer.style.display = 'block';

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
    } else if (tipContractCurent === 'itl_016') {
        if (typeof genereazaItl016PDF === 'function') genereazaItl016PDF();
    } else if (tipContractCurent === 'itl_005') {
        if (typeof genereazaItl005PDF === 'function') genereazaItl005PDF();
    } else if (tipContractCurent === 'procura') {
        if (typeof genereazaProcuraPDF === 'function') genereazaProcuraPDF();
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
        numeClient: dateFormular.buyerName || dateFormular.chiriasNume || dateFormular.comodatarAutoNume || dateFormular.comodatarImobilNume || dateFormular.itlNoulProprietarNume || dateFormular.itlContribuabilNume || 'Client Auto/Imobiliar',
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

function deschideModalAuth(mod = 'autentificare') {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function inchideModalAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function schimbaModulAuth(mod) {
    deschideModalAuth(mod);
}

function selecteazaPachetModal(pkg) {
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById('pkg_' + pkg);
    if (card) card.classList.add('selected');
}

function gestioneazaAutentificareSauInregistrare() {
    let email = document.getElementById('authEmail').value.trim();
    if (!email) {
        arataNotificare('Introduceți un e-mail valid!', true);
        return;
    }
    profilCurent.email = email;
    arataNotificare('Autentificare reușită!');
    inchideModalAuth();
    verificaSiActiveazaCredite();
}

function deconectareUtilizator() {
    arataNotificare('Ați fost deconectat.');
    deschideMeniuPrincipal();
}

function actualizeazaEmailCont() {
    let noulEmail = document.getElementById('settingsNewEmail').value.trim();
    if (!noulEmail) {
        arataNotificare('Introduceți un e-mail valid!', true);
        return;
    }
    profilCurent.email = noulEmail;
    arataNotificare('E-mail actualizat cu succes!');
}

function copiazaLinkAfiliere() {
    const text = document.getElementById('myReferralLinkText').innerText;
    navigator.clipboard.writeText(text);
    arataNotificare('Link de afiliere copiat!');
}

function trimiteAfiliereWhatsApp() {
    const text = document.getElementById('myReferralLinkText').innerText;
    window.open(`https://wa.me/?text=${encodeURIComponent('Folosește linkul meu pe ActPeLoc: ' + text)}`, '_blank');
}

window.addEventListener('DOMContentLoaded', () => {
    initSplashTimer();
    verificaSiActiveazaCredite();
    randeazaArhivaInDashboard();
});