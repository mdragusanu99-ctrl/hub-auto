/* =================================================================v
   ACTPELOC — SCRIPT CENTRAL DE LOGICĂ & NAVIGARE (EDIȚIA 2026)
   Dedicat exclusiv categoriilor: Auto & Transport & Imobiliare
   ================================================================= */

let state = {
    currentCategory: null,
    currentDocType: null,
    currentStep: 1,
    isRemoteMode: false,
    user: null,
    activePackage: 'GRATUIT',
    contracteGenerate: []
};

const dateCategorii = {
    auto: {
        titlu: "Auto & Transport",
        icon: "🚗",
        descriere: "Contracte de vânzare-cumpărare auto, declarații fiscale ITL și comodate.",
        acte: [
            { id: "itl_054", titlu: "Contract Înstrăinare-Dobândire Mijloc de Transport (ITL 054)", desc: "Model oficial valabil pentru înmatriculare și radiere fiscală." },
            { id: "itl_016", titlu: "Declarație Fiscală Scoatere din Evidență Auto (ITL-016)", desc: "Necesară la Primărie pentru scoaterea vehiculului de pe rol." },
            { id: "itl_005", titlu: "Declarație Fiscală Impunere Auto (ITL-005)", desc: "Pentru înregistrarea mijlocului de transport la noul domiciliu." },
            { id: "comodat_auto", titlu: "Contract de Comodat Auto", desc: "Folosirea autoturismului de către o altă persoană fără vânzare." },
            { id: "procura_auto", titlu: "Procură / Împuternicire Specială Auto (RAR / DRPCIV)", desc: "Pentru reprezentare la Registrul Auto Român și Înmatriculări." }
        ]
    },
    imobiliare: {
        titlu: "Imobiliare & Locuințe",
        icon: "🏠",
        descriere: "Contracte de închiriere locuințe, inventar de bunuri și comodat imobile.",
        acte: [
            { id: "inchiriere_locuinta", titlu: "Contract de Închiriere Locuință cu Inventar", desc: "Include clauze de garanție, termen și inventar detaliat de bunuri." },
            { id: "comodat_imobil", titlu: "Contract de Comodat Imobil / Sediu Social", desc: "Cedarea folosinței unei locuințe sau spații comerciale cu titlu gratuit." },
            { id: "proces_verbal_primire", titlu: "Proces-Verbal de Predare-Primire Locuință", desc: "Inventarierea stării tehnice, a contoarelor și a bunurilor la predare." }
        ]
    }
};

document.addEventListener("DOMContentLoaded", () => {
    verificaStareUtilizatorLocal();
    pornireSplashTimer();
    activeazaAscultatoriCanvasOptimizzati();
});

function inchideSplash() {
    const splash = document.getElementById("splashScreen");
    if (splash) {
        splash.classList.add("fade-out");
        setTimeout(() => splash.style.display = "none", 700);
    }
}

function pornireSplashTimer() {
    let secunde = 4;
    const timerText = document.getElementById("splashTimerText");
    if (!timerText) return;
    
    const interval = setInterval(() => {
        secunde--;
        if (secunde > 0) {
            timerText.innerText = `Se deschide automat în ${secunde} secunde...`;
        } else {
            clearInterval(interval);
            inchideSplash();
        }
    }, 1000);
}

function deschideMeniuPrincipal() {
    const elementeDeAscuns = ["listaDocumenteContainer", "dashboardView", "modeSelectorContainer", "step1", "step2", "step3", "step4", "step5"];
    elementeDeAscuns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
            el.classList.remove("active");
        }
    });

    const pb = document.getElementById("progressBarContainer");
    if (pb) pb.classList.remove("active-progress");

    const hub = document.getElementById("hubCategorii");
    if (hub) hub.style.display = "block";

    state.currentCategory = null;
    state.currentDocType = null;
    state.currentStep = 1;
}

function deschideCategorie(catKey) {
    state.currentCategory = catKey;
    const catData = dateCategorii[catKey];
    if (!catData) return;

    document.getElementById("titluCategorieSelectata").innerText = `${catData.icon} Documente Disponibile: ${catData.titlu}`;
    
    const containerActe = document.getElementById("elementeListaActe");
    containerActe.innerHTML = "";

    catData.acte.forEach(act => {
        const card = document.createElement("div");
        card.className = "category-mega-card auto-card";
        card.style.padding = "20px";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${act.titlu}</h4>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${act.desc}</p>
                </div>
                <span style="font-size: 18px; color: var(--primary);">➔</span>
            </div>
        `;
        card.onclick = () => selecteazaDocument(act.id);
        containerActe.appendChild(card);
    });

    amestecaVizibilitateElemente(["listaDocumenteContainer"], ["hubCategorii", "dashboardView", "modeSelectorContainer", "progressBarContainer"]);
}

function inchideListaCategorii() {
    deschideMeniuPrincipal();
}

function selecteazaDocument(docId) {
    state.currentDocType = docId;
    amestecaVizibilitateElemente(["modeSelectorContainer"], ["hubCategorii", "listaDocumenteContainer"]);
    document.getElementById("modSelectorTitle").innerText = `Mod de Lucru: ${docId.toUpperCase()}`;
}

function selecteazaCategorieTip(catKey) {
    state.currentCategory = catKey;
    deschideCategorie(catKey);
}

function selecteazaModSiPorneste(mod) {
    state.isRemoteMode = (mod === 'remote');
    state.currentStep = 1;
    
    // Resetăm starea de plată la fiecare pornire nouă a unui contract
    const payCont = document.querySelector(".paymentStepContainer");
    const downCont = document.querySelector(".finalDownloadContainer");
    if (payCont) payCont.style.display = "block";
    if (downCont) downCont.style.display = "none";

    pregatesteFormulareDupaTipDocument();
    amestecaVizibilitateElemente([], ["modeSelectorContainer", "hubCategorii", "listaDocumenteContainer"]);
    
    const pb = document.getElementById("progressBarContainer");
    if (pb) pb.classList.add("active-progress");

    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`step${i}`);
        if (el) el.classList.remove("active");
    }
    const pas1 = document.getElementById("step1");
    if (pas1) pas1.classList.add("active");
    
    actualizeazaProgresWizard();
    asiguraVizibilitateCorectaPasi();
}

function pregatesteFormulareDupaTipDocument() {
    const elementeDeAscuns = [
        "formAutoStep1", "formAutoStep2", "formAutoStep3",
        "formComodatAutoStep1", "formComodatAutoStep2", "formComodatAutoStep3",
        "formItl016Step1", "formItl016Step2", "formItl016Step3",
        "formProcuraStep1", "formProcuraStep2", "formProcuraStep3",
        "formComodatImobilStep1", "formComodatImobilStep2", "formComodatImobilStep3",
        "formImobiliareStep1", "formImobiliareStep2",
        "formPvLoc1", "formPvLoc2", "formPvLoc3",
        "imobiliareSemnaturiContainer", "pvLocuintaSemnaturiContainer", "procuraSignContainer"
    ];
    
    elementeDeAscuns.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    const doc = state.currentDocType;
    
    if (doc === 'itl_054') {
        arataElemente(["formAutoStep1"], "Pasul 1: Date Vânzător");
        arataElemente(["formAutoStep2"], "Pasul 2: Date Cumpărător");
        arataElemente(["formAutoStep3"], "Pasul 3: Vehiculul și Prețul");
    } else if (doc === 'itl_016') {
        arataElemente(["formItl016Step1"], "Pasul 1: Date Contribuabil");
        arataElemente(["formItl016Step2"], "Pasul 2: Mijloc de Transport");
        arataElemente(["formItl016Step3", "itlSignContainer"], "Pasul 3: Act și Semnătură");
    } else if (doc === 'itl_005') {
        arataElemente(["formAutoStep1"], "Pasul 1: Date Titular Nou");
        arataElemente(["formAutoStep3"], "Pasul 2: Date Vehicul");
    } else if (doc === 'comodat_auto') {
        arataElemente(["formComodatAutoStep1"], "Pasul 1: Comodant");
        arataElemente(["formComodatAutoStep2"], "Pasul 2: Comodatar");
        arataElemente(["formComodatAutoStep3"], "Pasul 3: Detalii Auto");
    } else if (doc === 'procura_auto') {
        arataElemente(["formProcuraStep1"], "Pasul 1: Mandant");
        arataElemente(["formProcuraStep2"], "Pasul 2: Mandatar");
        arataElemente(["formProcuraStep3", "procuraSignContainer"], "Pasul 3: Vehicul & Semnătură");
    } else if (doc === 'inchiriere_locuinta') {
        arataElemente(["formImobiliareStep1"], "Pasul 1: Proprietar & Imobil");
        arataElemente(["formImobiliareStep2"], "Pasul 2: Chiriaș");
        arataElemente(["imobiliareSemnaturiContainer"], "Pasul 3: Semnături Părți");
    } else if (doc === 'comodat_imobil') {
        arataElemente(["formComodatImobilStep1"], "Pasul 1: Comodant");
        arataElemente(["formComodatImobilStep2"], "Pasul 2: Comodatar");
        arataElemente(["formComodatImobilStep3"], "Pasul 3: Detalii Imobil");
    } else if (doc === 'proces_verbal_primire') {
        arataElemente(["formPvLoc1"], "Pasul 1: Locator");
        arataElemente(["formPvLoc2"], "Pasul 2: Locatar");
        arataElemente(["formPvLoc3", "pvLocuintaSemnaturiContainer"], "Pasul 3: Inventar");
    }
}

function arataElemente(ids, titluPas1) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "grid";
    });
    if (titluPas1) {
        const t1 = document.getElementById("titleStep1");
        if (t1) t1.innerText = titluPas1;
    }
}

// Validare și Sanitizare
function valideazaPasulCurent(current) {
    const pasEl = document.getElementById(`step${current}`);
    if (!pasEl) return true;
    
    const requiredInputs = pasEl.querySelectorAll("input[required], select[required]");
    let valid = true;

    requiredInputs.forEach(input => {
        // Ignorăm validarea câmpurilor care aparțin unor elemente ascunse în mod dinamic
        if (input.offsetParent === null) return;

        if (!input.value.trim()) {
            valid = false;
            input.style.borderColor = "var(--danger)";
        } else {
            input.style.borderColor = "var(--border-color)";
        }
    });

    if (!valid) {
        arataToast("Te rugăm să completezi toate câmpurile obligatorii!", true);
    }
    return valid;
}

function sanitizeazaDateleCricale() {
    const vinInputs = document.querySelectorAll("#chassisSeries, #itlAutoVin, #comodatAutoVin, #procuraAutoVin");
    vinInputs.forEach(input => {
        if (input) input.value = input.value.toUpperCase().trim();
    });

    const cnpInputs = document.querySelectorAll("#seller_ci_cnp, #buyerCNP, #comodantAutoCnp, #itlContribuabilCnp");
    cnpInputs.forEach(input => {
        if (input) input.value = input.value.trim();
    });
}

function actualizeazaProgresWizard() {
    for (let i = 1; i <= 5; i++) {
        const pasEl = document.getElementById(`p${i}`);
        if (!pasEl) continue;
        pasEl.classList.remove("active", "completed");
        
        if (!state.isRemoteMode) {
            // În modul local, avem doar pașii: 1, 2, 3 și 5 (Plată)
            // Ascundem complet bulina 4 din DOM vizual pentru a nu crea confuzie
            if (i === 4) {
                pasEl.style.display = "none";
                continue;
            } else {
                pasEl.style.display = "flex";
            }
        } else {
            if (i === 4) pasEl.style.display = "flex";
        }

        let vizualCurrent = state.currentStep;
        if (!state.isRemoteMode && state.currentStep === 5) {
            vizualCurrent = 5; // Direct la pasul 5
        }

        if (i < vizualCurrent) {
            pasEl.classList.add("completed");
        } else if (i === vizualCurrent) {
            pasEl.classList.add("active");
        }
    }
}

function nextStep(current) {
    if (!valideazaPasulCurent(current)) return;
    sanitizeazaDateleCricale();

    const pasCurentEl = document.getElementById(`step${current}`);
    if (pasCurentEl) pasCurentEl.classList.remove("active");

    if (state.isRemoteMode) {
        if (current === 1) {
            state.currentStep = 2;
        } else if (current === 2) {
            state.currentStep = 4; // Pasul de trimitere link distanță
            pornesteFluxRemote();
        } else if (current === 4) {
            state.currentStep = 5; // Spre plată
        }
    } else {
        // Modul Local: Sărim direct la pasul final de plată (Pasul 5) din pasul 3
        if (current === 3) {
            state.currentStep = 5;
        } else {
            state.currentStep = current + 1;
        }
    }

    if (state.currentStep === 5) {
    // Dacă venim prima dată la pasul 5, ne asigurăm că se vede plata, nu ecranul de succes vechi
    const payCont = document.querySelector(".paymentStepContainer");
    const downCont = document.querySelector(".finalDownloadContainer");
    // Dacă nu a fost marcat ca plătit anterior în sesiune:
    if (!state.platitCurent) {
        if (payCont) payCont.style.display = "block";
        if (downCont) downCont.style.display = "none";
    }
}

    pregatesteFormulareDupaTipDocument();
    asiguraVizibilitateCorectaPasi();

    const pasUrmatorEl = document.getElementById(`step${state.currentStep}`);
    if (pasUrmatorEl) pasUrmatorEl.classList.add("active");

    actualizeazaProgresWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(current) {
    const pasCurentEl = document.getElementById(`step${current}`);
    if (pasCurentEl) pasCurentEl.classList.remove("active");

    if (state.isRemoteMode) {
        if (current === 4) {
            state.currentStep = 2;
        } else {
            state.currentStep = current - 1;
        }
    } else {
        // În modul local, de la pasul 5 înapoi ajungem la pasul 3
        if (current === 5) {
            state.currentStep = 3;
        } else {
            state.currentStep = current - 1;
        }
    }

    if (state.currentStep < 1) state.currentStep = 1;

    pregatesteFormulareDupaTipDocument();
    asiguraVizibilitateCorectaPasi();

    const pasAnteriorEl = document.getElementById(`step${state.currentStep}`);
    if (pasAnteriorEl) pasAnteriorEl.classList.add("active");

    actualizeazaProgresWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function asiguraVizibilitateCorectaPasi() {
    const localActions = document.getElementById("localActions");
    const p4Container = document.getElementById("p4");
    const btnNextStep3 = document.getElementById("btnNextStep3");

    if (state.isRemoteMode) {
        if (localActions) localActions.style.display = "block";
        if (p4Container) p4Container.style.display = "flex";
        if (btnNextStep3) btnNextStep3.innerText = "Finalizare & Opțiuni ➔";
    } else {
        if (localActions) localActions.style.display = "none";
        // Ascundem bulina 4 din bara de sus în modul local pentru a avea exact 4 pași vizuali
        if (p4Container) p4Container.style.display = "none";
        if (btnNextStep3) btnNextStep3.innerText = "Mergi la Plată & Finalizare ➔";
    }
}

// Autentificare și Cont
function deschideModalAuth(mod = 'autentificare') {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.style.display = "flex";
    
    const regFields = document.querySelectorAll(".reg-field");
    const title = document.getElementById("authModalTitle");
    const subtitle = document.getElementById("authModalSubtitle");
    const btn = document.getElementById("authSubmitBtn");
    const switchBox = document.getElementById("authSwitchContainer");

    if (mod === 'inregistrare') {
        title.innerText = "Creează Cont Gratuit";
        subtitle.innerText = "Primești 3 contracte incluse instant.";
        btn.innerText = "🚀 Înregistrează-te";
        regFields.forEach(el => el.style.display = "block");
        switchBox.innerHTML = `Ai deja un cont? <span style="color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="deschideModalAuth('autentificare')">Intră în cont</span>`;
    } else {
        title.innerText = "Autentificare Cont";
        subtitle.innerText = "Introdu credențialele tale unice.";
        btn.innerText = "🔑 Intră în Cont";
        regFields.forEach(el => el.style.display = "none");
        switchBox.innerHTML = `Nu ai un cont? <span style="color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="deschideModalAuth('inregistrare')">Creează-ți unul chiar acum</span>`;
    }
}

function inchideModalAuth() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

function schimbaModulAuth(mod) { deschideModalAuth(mod); }

function selecteazaPachetModal(pkg) {
    document.querySelectorAll(".package-card").forEach(c => c.classList.remove("selected"));
    const card = document.getElementById(`pkg_${pkg}`);
    if (card) card.classList.add("selected");
    state.activePackage = pkg;
}

function gestioneazaAutentificareSauInregistrare() {
    const email = document.getElementById("authEmail").value.trim();
    if (!email) {
        arataToast("Introdu o adresă de e-mail validă!", true);
        return;
    }

    state.user = {
        email: email,
        profil: document.getElementById("authTipProfil") ? document.getElementById("authTipProfil").value : "PERSOANA_FIZICA",
        pachet: state.activePackage,
        credite: state.activePackage === 'GRATUIT' ? 3 : 400
    };

    localStorage.setItem("actpeloc_user", JSON.stringify(state.user));
    actualizeazaUIContUtilizator();
    inchideModalAuth();
    arataToast("Autentificare reușită cu succes!");
}

function verificaStareUtilizatorLocal() {
    const saved = localStorage.getItem("actpeloc_user");
    if (saved) {
        try {
            state.user = JSON.parse(saved);
            actualizeazaUIContUtilizator();
        } catch(e) {}
    }
}

function actualizeazaUIContUtilizator() {
    if (!state.user) return;
    document.getElementById("userStatusText").innerText = state.user.email.split('@')[0];
    document.getElementById("userAvatarText").innerText = state.user.email[0].toUpperCase();
    document.getElementById("dashNavBtn").style.display = "inline-flex";
    document.getElementById("dropdownEmailText").innerText = state.user.email;
}

function gestioneazaClickContulMeu() {
    if (!state.user) {
        deschideModalAuth('inregistrare');
    } else {
        const menu = document.getElementById("profileDropdownMenu");
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
}

function deconectareUtilizator() {
    localStorage.removeItem("actpeloc_user");
    state.user = null;
    document.getElementById("userStatusText").innerText = "Contul Meu";
    document.getElementById("userAvatarText").innerText = "👤";
    document.getElementById("dashNavBtn").style.display = "none";
    document.getElementById("profileDropdownMenu").style.display = "none";
    arataToast("Ai fost deconectat cu succes!");
    deschideMeniuPrincipal();
}

function acceseazaDashboardTab(tabName) {
    document.getElementById("profileDropdownMenu").style.display = "none";
    amestecaVizibilitateElemente(["dashboardView"], ["hubCategorii", "listaDocumenteContainer", "modeSelectorContainer", "progressBarContainer", "step1", "step2", "step3", "step4", "step5"]);
    schimbaTabDash(tabName, document.querySelector(`.dash-tab-btn`));
}

function schimbaTabDash(tabKey, btnEl) {
    document.querySelectorAll(".dash-tab-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    const tabs = ['arhiva', 'nou', 'abonament', 'afiliere', 'setari'];
    tabs.forEach(t => {
        const el = document.getElementById(`dashTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (el) el.style.display = (t === tabKey) ? "block" : "none";
    });
}

// Plată & Descărcare
function proceseazaPlataSiDescarca() {
    arataToast("Se procesează plata securizată și se generează PDF-ul...");
    
    setTimeout(() => {
        if (state.user && state.user.credite > 0) {
            state.user.credite--;
            localStorage.setItem("actpeloc_user", JSON.stringify(state.user));
        }
        
        document.querySelector(".paymentStepContainer").style.display = "none";
        document.querySelector(".finalDownloadContainer").style.display = "block";
        
        arataToast("Plată confirmată! Documentul este gata.");
        
        if (typeof genereazaSiDescarcaPDFOficial === 'function') {
            genereazaSiDescarcaPDFOficial();
        }
    }, 1500);
}

function ruleazaDescarcareaFinala() {
    if (typeof genereazaSiDescarcaPDFOficial === 'function') {
        genereazaSiDescarcaPDFOficial();
    } else {
        arataToast("Modulul PDF se încarcă...", true);
    }
}

// Utilitare & Canvas
function amestecaVizibilitateElemente(arataIDs, ascundeIDs) {
    ascundeIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    arataIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "block";
    });
}

function arataToast(mesaj, eroare = false) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.innerText = mesaj;
    toast.className = eroare ? "error show" : "show";
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function comutaTema() {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") === "dark";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
    document.getElementById("themeToggleBtn").innerText = isDark ? "🌙" : "☀️";
}

function comutaDomiciliuFiscal() {
    const sec = document.getElementById("sectiuneFiscala");
    if (sec) sec.style.display = sec.style.display === "none" ? "grid" : "none";
}

function comutaFirma() {
    const sec = document.getElementById("sectiuneFirma");
    if (sec) sec.style.display = sec.style.display === "none" ? "grid" : "none";
}

function curataCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function activeazaAscultatoriCanvasOptimizzati() {
    document.addEventListener("mousedown", (e) => {
        if (e.target.tagName === 'CANVAS') initCanvasDrawing(e);
    });
    document.addEventListener("touchstart", (e) => {
        if (e.target.tagName === 'CANVAS') initCanvasDrawing(e);
    }, { passive: true });
}

function initCanvasDrawing(e) {
    const canvas = e.target;
    const ctx = canvas.getContext("2d");
    let desenand = true;

    function obtinePozitie(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.clientX || (evt.touches ? evt.touches[0].clientX : 0);
        const clientY = evt.clientY || (evt.touches ? evt.touches[0].clientY : 0);
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const pos = obtinePozitie(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = document.body.getAttribute("data-theme") === "dark" ? "#ffffff" : "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    function miscare(evt) {
        if (!desenand) return;
        const p = obtinePozitie(evt);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }

    function opreste() {
        desenand = false;
        window.removeEventListener("mousemove", miscare);
        window.removeEventListener("mouseup", opreste);
        window.removeEventListener("touchmove", miscare);
        window.removeEventListener("touchend", opreste);
    }

    window.addEventListener("mousemove", miscare);
    window.addEventListener("mouseup", opreste);
    window.addEventListener("touchmove", miscare);
    window.addEventListener("touchend", opreste);
}

function pornesteFluxRemote() {
    const localAct = document.getElementById("localActions");
    const waitCont = document.getElementById("waitingAnimationContainer");
    if (localAct) localAct.style.display = "none";
    if (waitCont) waitCont.style.display = "block";

    const link = `https://actpeloc.ro/semneaza?s=${Math.random().toString(36).substring(7)}`;
    const shareCont = document.getElementById("shareLinkContainer");
    if (shareCont) shareCont.innerText = link;
    
    const qrContainer = document.getElementById("qrcode");
    if (qrContainer) {
        qrContainer.innerHTML = "";
        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(qrContainer, { text: link, width: 120, height: 120 });
            } catch (err) {
                arataToast("Eroare la generarea codului QR", true);
            }
        }
    }
    arataToast("Link de semnătură la distanță generat!");
}

function copiazaLinkul() {
    const text = document.getElementById("shareLinkContainer").innerText;
    navigator.clipboard.writeText(text);
    arataToast("Link copiat în clipboard!");
}

function trimitePeWhatsApp() {
    const text = document.getElementById("shareLinkContainer").innerText;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Salut! Te rog să accesezi acest link securizat pentru a semna documentul: " + text)}`, '_blank');
}

function copiazaLinkAfiliere() {
    const text = document.getElementById("myReferralLinkText").innerText;
    navigator.clipboard.writeText(text);
    arataToast("Linkul de afiliere a fost copiat!");
}

function trimiteAfiliereWhatsApp() {
    const text = document.getElementById("myReferralLinkText").innerText;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Salut! Folosește acest link pe ActPeLoc pentru a beneficia de reducere: " + text)}`, '_blank');
}

function actualizeazaEmailCont() {
    const noulEmail = document.getElementById("settingsNewEmail").value.trim();
    if (!noulEmail) {
        arataToast("Introdu un e-mail valid!", true);
        return;
    }
    state.user.email = noulEmail;
    localStorage.setItem("actpeloc_user", JSON.stringify(state.user));
    actualizeazaUIContUtilizator();
    arataToast("Adresa de e-mail a fost actualizată!");
}