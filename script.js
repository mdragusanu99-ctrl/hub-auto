/* =================================================================v
   ACTPELOC — SCRIPT CENTRAL DE LOGICĂ & NAVIGARE (EDIȚIA 2026)
   Dedicat exclusiv categoriilor: Auto & Transport & Imobiliare
   ================================================================= */

// Starea Globală a Aplicației
let state = {
    currentCategory: null, // 'auto' sau 'imobiliare'
    currentDocType: null,
    currentStep: 1,
    isRemoteMode: false,
    user: null, // Datele utilizatorului logat
    activePackage: 'GRATUIT',
    contracteGenerate: []
};

// Datele și Structura Documentelor Disponibile (Strict Auto & Imobiliare)
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

// Inițializare la încărcarea paginii
document.addEventListener("DOMContentLoaded", () => {
    verificaStareUtilizatorLocal();
    pornireSplashTimer();
});

// ==========================================
// SPLASH SCREEN & NAVIGARE PRINCIPALĂ
// ==========================================
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
    // 1. Ascundem absolut tot ce ține de formulare, pași, listă de acte și moduri de lucru
    const elementeDeAscuns = [
        "listaDocumenteContainer", 
        "dashboardView", 
        "modeSelectorContainer", 
        "step1", "step2", "step3", "step4", "step5"
    ];
    
    elementeDeAscuns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
            el.classList.remove("active");
        }
    });

    // 2. Ascundem bara de progres folosind clasa dedicată
    const pb = document.getElementById("progressBarContainer");
    if (pb) pb.classList.remove("active-progress");

    // 3. Afișăm înapoi exclusiv ecranul principal cu cele 2 carduri (Auto & Imobiliare)
    const hub = document.getElementById("hubCategorii");
    if (hub) hub.style.display = "block";

    // Resetăm starea globală
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
    
    pregatesteFormulareDupaTipDocument();
    
    // Ascundem meniurile anterioare
    amestecaVizibilitateElemente([], ["modeSelectorContainer", "hubCategorii", "listaDocumenteContainer"]);
    
    // Afișăm bara de progres
    const pb = document.getElementById("progressBarContainer");
    if (pb) pb.classList.add("active-progress");

    // Ascundem toți pașii și îl activăm doar pe primul
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`step${i}`);
        if (el) el.classList.remove("active");
    }
    const pas1 = document.getElementById("step1");
    if (pas1) pas1.classList.add("active");
    
    actualizeazaProgresWizard();
}

// ==========================================
// CONFIGURARE DINAMICĂ FORMULARE PE DOCUMENTE
// ==========================================
function pregatesteFormulareDupaTipDocument() {
    // Ascundem tot inițial
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

    // Activăm ce este necesar pentru documentul curent
    const doc = state.currentDocType;
    
    if (doc === 'itl_054') {
        arataElemente(["formAutoStep1"], "Pasul 1: Date Vânzător");
        arataElemente(["formAutoStep2"], "Pasul 2: Date Cumpărător");
        arataElemente(["formAutoStep3"], "Pasul 3: Vehiculul și Prețul");
    } else if (doc === 'itl_016') {
        arataElemente(["formItl016Step1"], "Pasul 1: Date Contribuabil (Declarant)");
        arataElemente(["formItl016Step2"], "Pasul 2: Mijlocul de Transport & Motivul");
        arataElemente(["formItl016Step3", "itlSignContainer"], "Pasul 3: Act Doveditor și Semnătură");
    } else if (doc === 'itl_005') {
        arataElemente(["formAutoStep1"], "Pasul 1: Date Titular Nou");
        arataElemente(["formAutoStep3"], "Pasul 2: Datele Vehiculului înregistrat");
    } else if (doc === 'comodat_auto') {
        arataElemente(["formComodatAutoStep1"], "Pasul 1: Date Comodant (Proprietar)");
        arataElemente(["formComodatAutoStep2"], "Pasul 2: Date Comodatar (Utilizator)");
        arataElemente(["formComodatAutoStep3"], "Pasul 3: Detalii Auto & Durată");
    } else if (doc === 'procura_auto') {
        arataElemente(["formProcuraStep1"], "Pasul 1: Date Mandant (Proprietar)");
        arataElemente(["formProcuraStep2"], "Pasul 2: Date Mandatar (Împuternicit)");
        arataElemente(["formProcuraStep3", "procuraSignContainer"], "Pasul 3: Vehicul, Instituții & Semnătură");
    } else if (doc === 'inchiriere_locuinta') {
        arataElemente(["formImobiliareStep1"], "Pasul 1: Date Proprietar & Imobil");
        arataElemente(["formImobiliareStep2"], "Pasul 2: Date Chiriaș (Locatar)");
        arataElemente(["imobiliareSemnaturiContainer"], "Pasul 3: Semnături Părți");
    } else if (doc === 'comodat_imobil') {
        arataElemente(["formComodatImobilStep1"], "Pasul 1: Date Comodant (Proprietar)");
        arataElemente(["formComodatImobilStep2"], "Pasul 2: Date Comodatar (Beneficiar)");
        arataElemente(["formComodatImobilStep3"], "Pasul 3: Detalii Imobil & CF");
    } else if (doc === 'proces_verbal_primire') {
        arataElemente(["formPvLoc1"], "Pasul 1: Date Locator");
        arataElemente(["formPvLoc2"], "Pasul 2: Date Locatar & Imobil");
        arataElemente(["formPvLoc3", "pvLocuintaSemnaturiContainer"], "Pasul 3: Inventar & Semnături");
    }
}

function arataElemente(ids, titluPas1) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "grid"; // majoritatea sunt grid
    });
    if (titluPas1) {
        const t1 = document.getElementById("titleStep1");
        if (t1) t1.innerText = titluPas1;
    }
}

// ==========================================
// NAVIGARE PAȘI WIZARD (1 la 5)
// ==========================================
function nextStep(current) {
    const pasCurentEl = document.getElementById(`step${current}`);
    if (pasCurentEl) pasCurentEl.classList.remove("active");

    if (state.isRemoteMode) {
        // Fluxul la distanță: Pasul 1 (Datele tale) -> Pasul 2 (Vehicul/Detalii) -> Pasul 4 (Trimitere Link QR/WhatsApp)
        if (current === 1) {
            state.currentStep = 2;
        } else if (current === 2) {
            state.currentStep = 4; // Sărim direct la pasul de trimitere link
            pornesteFluxRemote();
        } else if (current === 4) {
            state.currentStep = 5;
            pregatesteEcranPlataSauDescarcare();
        }
    } else {
        // Fluxul local: Parcurge ordonat 1 -> 2 -> 3 -> 5 (sau 4)
        state.currentStep = current + 1;
        if (state.currentStep === 5) {
            pregatesteEcranPlataSauDescarcare();
        }
    }

    if (state.currentStep > 5) state.currentStep = 5;

    // AICI ERA LIPSA: Rechemăm pregătirea formularelor ca să se randeze câmpurile pasului curent
    pregatesteFormulareDupaTipDocument();

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
        state.currentStep = current - 1;
    }

    if (state.currentStep < 1) state.currentStep = 1;

    // Aici era lipsa: rechemăm pregătirea formularelor ca să se vadă câmpurile corecte pe ecran
    pregatesteFormulareDupaTipDocument();

    const pasAnteriorEl = document.getElementById(`step${state.currentStep}`);
    if (pasAnteriorEl) pasAnteriorEl.classList.add("active");

    actualizeazaProgresWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// GESTIONARE MODAL AUTENTIFICARE & CONT
// ==========================================
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

function schimbaModulAuth(mod) {
    deschideModalAuth(mod);
}

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
        credite: state.activePackage === 'GRATUIT' ? 3 : (state.activePackage === 'STANDARD' ? 400 : 1200)
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
    
    // Setări tab dashboard
    if (document.getElementById("infoDashEmail")) {
        document.getElementById("infoDashEmail").innerText = state.user.email;
        document.getElementById("infoDashProfil").innerText = state.user.profil;
        document.getElementById("infoDashPachet").innerText = state.user.pachet;
        document.getElementById("infoDashRamase").innerText = state.user.credite;
        document.getElementById("myReferralLinkText").innerText = `https://actpeloc.ro/?ref=${btoa(state.user.email).substring(0, 8)}`;
    }
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

// ==========================================
// DASHBOARD & TAB-URI INTERNE
// ==========================================
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

// ==========================================
// PLATĂ & DESCĂRCARE PDF FINAL
// ==========================================
function pregatesteEcranPlataSauDescarcare() {
    const containerePlata = document.querySelectorAll(".paymentStepContainer");
    const containereDescarcare = document.querySelectorAll(".finalDownloadContainer");

    if (state.user && state.user.credite > 0) {
        // Are credite gratuite, poate descărca direct sau simulăm plata
        containerePlata.forEach(el => el.style.display = "block");
        containereDescarcare.forEach(el => el.style.display = "none");
    } else {
        containerePlata.forEach(el => el.style.display = "block");
        containereDescarcare.forEach(el => el.style.display = "none");
    }
}

function proceseazaPlataSiDescarca() {
    arataToast("Se procesează plata securizată...");
    setTimeout(() => {
        if (state.user && state.user.credite > 0) {
            state.user.credite--;
            localStorage.setItem("actpeloc_user", JSON.stringify(state.user));
            actualizeazaUIContUtilizator();
        }
        
        document.querySelectorAll(".paymentStepContainer").forEach(el => el.style.display = "none");
        document.querySelectorAll(".finalDownloadContainer").forEach(el => el.style.display = "block");
        
        arataToast("Plată confirmată! Documentul este pregătit.");
        
        // Apelăm funcția de generare PDF din pdf-generator.js
        if (typeof genereazaSiDescarcaPDFOficial === 'function') {
            genereazaSiDescarcaPDFOficial();
        }
    }, 1200);
}

function ruleazaDescarcareaFinala() {
    if (typeof genereazaSiDescarcaPDFOficial === 'function') {
        genereazaSiDescarcaPDFOficial();
    } else {
        arataToast("Modulul PDF se încarcă...", true);
    }
}

// ==========================================
// FUNCȚII AUXILIARE & CANVAS SEMNĂTURI
// ==========================================
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
    sec.style.display = sec.style.display === "none" ? "grid" : "none";
}

function comutaFirma() {
    const sec = document.getElementById("sectiuneFirma");
    sec.style.display = sec.style.display === "none" ? "grid" : "none";
}

function comutaDomiciliuFiscalCumparator() {
    const sec = document.getElementById("sectiuneFiscalaCumparator");
    sec.style.display = sec.style.display === "none" ? "grid" : "none";
}

function comutaFirmaCumparator() {
    const sec = document.getElementById("sectiuneFirmaCumparator");
    sec.style.display = sec.style.display === "none" ? "grid" : "none";
}

function curataCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Inițializare desen pe canvas pentru semnături olografe
document.addEventListener("mousedown", initCanvasDrawing);
document.addEventListener("touchstart", initCanvasDrawing);

function initCanvasDrawing(e) {
    if (e.target.tagName !== 'CANVAS') return;
    const canvas = e.target;
    const ctx = canvas.getContext("2d");
    let desenand = true;

    function obtinePozitie(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.clientX || (evt.touches ? evt.touches[0].clientX : 0);
        const clientY = evt.clientY || (evt.touches ? evt.touches[0].clientY : 0);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
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
    document.getElementById("localActions").style.display = "none";
    document.getElementById("waitingAnimationContainer").style.display = "block";
    const link = `https://actpeloc.ro/semneaza?s=${Math.random().toString(36).substring(7)}`;
    document.getElementById("shareLinkContainer").innerText = link;
    
    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, { text: link, width: 120, height: 120 });
    }
    arataToastân("Link de semnătură la distanță generat!");
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
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Salut! Folosește acest link pe ActPeLoc pentru a beneficia de 35% reducere la generarea contractelor tale: " + text)}`, '_blank');
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