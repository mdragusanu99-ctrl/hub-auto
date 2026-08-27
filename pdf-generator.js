// ==========================================
// MODULUL DE GENERARE PDF ȘI SEMNĂTURI
// ==========================================

const curataDiacritice = (text) => {
    if (!text) return '';
    return String(text).toUpperCase()
        .replace(/Ă/g, 'A').replace(/Â/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/Ș/g, 'S').replace(/Ş/g, 'S')
        .replace(/Ț/g, 'T').replace(/Ţ/g, 'T');
};

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

// 1. GENERATOR CONTRACT VÂNZARE-CUMPĂRARE AUTO (ITL 054) CU INJECTARE ÎN CÂMPURILE PDF
async function genereazaContractOficialPDF() {
    const chassisEl = document.getElementById('chassisSeries');
    if (chassisEl) {
        const vin = chassisEl.value.trim();
        if (vin.length !== 17) {
            arataNotificare("⚠️ Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true);
            chassisEl.focus();
            return;
        }
    }

    arataNotificare("Se generează contractul de vânzare-cumpărare auto oficial...");
    try {
        const d = colecteazaDate(); // Colectează datele din formularul curent
        const resT = await fetch('contract-instrainare-dobandire-auto-model-2026-ITL-054.pdf');
        if (!resT.ok) throw new Error("Nu s-a putut încărca șablonul PDF oficial!");
        
        const tBytes = await resT.arrayBuffer();
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(tBytes);
        const form = pdfDoc.getForm();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Lista completă a câmpurilor interactive din formularul ITL 054 care primesc injectare
        const elementeFormular = [
            'sellerName', 'sellerCnp', 'sellerAddress', 'sellerCounty', 'sellerCity', 'sellerIdSeries', 'sellerIdNumber',
            'buyerName', 'buyerCnp', 'buyerAddress', 'buyerCounty', 'buyerCity', 'buyerIdSeries', 'buyerIdNumber',
            'vehicleMake', 'vehicleModel', 'chassisSeries', 'engineSeries', 'cylinderCapacity', 'maxWeight',
            'taxCertificateNo', 'contractPrice', 'contractDate'
        ];

        elementeFormular.forEach(id => {
            try {
                const f = form.getTextField(id);
                if (f && d[id]) {
                    let valFinala = String(d[id]).toUpperCase();
                    if (id === 'maxWeight' && !valFinala.includes('KG')) valFinala += ' KG';
                    if (id === 'cylinderCapacity' && !valFinala.includes('CM')) valFinala += ' CMC';
                    f.setText("    " + curataDiacritice(valFinala));
                    f.setFont(font);
                    f.setFontSize(7.5);
                }
            } catch(e) {
                // Câmp opțional negăsit în formular
            }
        });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = "CONTRACT_VANZARE_CUMPARARE_AUTO_ITL054.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'AUTO-' + Math.floor(1000 + Math.random()*9000), numeClient: d['buyerName'] || 'Cumpărător' });
        }
        arataNotificare("✅ Contractul de vânzare-cumpărare auto a fost generat și injectat cu succes!");
    } catch(e) { 
        arataNotificare("Eroare generare PDF Auto: " + e.message, true); 
    }
}

// 2. GENERATOR CONTRACT IMOBILIAR CU INVENTAR
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
            y -= 15;
        };

        const deseneazaParagraf = (text) => {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 7.5, font, maxWidth: 505 });
            y -= 14;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const titluText = "CONTRACT DE INCHIRIERE LOCUINTA";
        const textWidth = fontBold.widthOfTextAtSize(titluText, 12);
        const centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 12, font: fontBold });
        y -= 25;

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Locator (Proprietar): ${getVal('proprietarNume') || '....................................'}, CNP: ${getVal('proprietarCnp') || '................'}, CI seria: ${getVal('proprietarAct') || '........'}.`);
        deseneazaParagraf(`1.2. Locatar (Chirias): ${getVal('chiriasNume') || '....................................'}, CNP: ${getVal('chiriasCnp') || '................'}, CI seria: ${getVal('chiriasAct') || '........'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI SI DESTINATIA");
        deseneazaParagraf(`2.1. Locatorul inchiriaza Locatarului imobilul cu destinatia exclusiva de locuinta, situat in: ${getVal('imobilAdresa') || '..................................................................................................................'}.`);
        
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

        page.drawText(curataDiacritice(`Incheiat astazi, ${new Date().toLocaleDateString('ro-RO')}, in 2 exemplare originale, conform Codului Civil.`), { x: 45, y, size: 8, font: fontBold });
        y -= 25;
        
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

        page.drawText(curataDiacritice("Semnatura Proprietar (Locator)"), { x: 45, y: y - 62, size: 7.5, font: fontBold });
        page.drawText(curataDiacritice("Semnatura Chirias (Locatar)"), { x: 310, y: y - 62, size: 7.5, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_INCHIRIERE_ACTPELOC.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'IMOB-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('chiriasNume') || 'Chiriaș') });
        }
        arataNotificare("✅ Contract imobiliar generat cu succes cu tot cu inventar!");
    } catch(e) { arataNotificare("Eroare PDF Imobiliar: " + e.message, true); }
}

// 3. GENERATOR CONTRACT PRESTĂRI SERVICII
async function genereazaContractPrestariServiciiPDF() {
    arataNotificare("Se generează contractul de prestări servicii irefutabil...");
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
            y -= 15;
        };

        const deseneazaParagraf = (text) => {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 7.5, font, maxWidth: 505 });
            y -= 14;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const titluText = "CONTRACT DE PRESTARI SERVICII";
        const textWidth = fontBold.widthOfTextAtSize(titluText, 12);
        const centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 12, font: fontBold });
        y -= 25;

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Prestator: ${getVal('prestatorNume') || '....................................'}, CUI/CIF: ${getVal('prestatorCui') || '........'}, Nr. Reg. Com: ${getVal('prestatorReg') || '........'}, cu sediul in ${getVal('prestatorAdresa') || '....................................'}, reprezentata prin ${getVal('prestatorReprezentant') || '....................'}, avand contul bancar ${getVal('prestatorBanca') || '....................'}.`);
        deseneazaParagraf(`1.2. Beneficiar: ${getVal('beneficiarNume') || '....................................'}, CUI/CIF: ${getVal('beneficiarCui') || '........'}, Nr. Reg. Com: ${getVal('beneficiarReg') || '........'}, cu sediul in ${getVal('beneficiarAdresa') || '....................................'}, reprezentata prin ${getVal('beneficiarReprezentant') || '....................'}, contact: ${getVal('beneficiarContact') || '....................'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI (INDEPENDENTA SI FARA SUBORDONARE)");
        deseneazaParagraf(`2.1. Obiectul prezentului contract consta in prestarea de catre Prestator a urmatoarelor servicii specializate: ${getVal('serviciiDescriere') || '..................................................................................................................'}.`);
        deseneazaParagraf(`2.2. Prestatorul isi desfasoara activitatea in mod independent, pe cont propriu si pe riscul sau, fara a exista o subordonare ierarhica sau program fix de lucru specific contractelor individuale de munca, evitand astfel orice risc de reclasificare fiscala (ANAF).`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract intra in vigoare la data semnarii si este valabil pana la finalizarea serviciilor si achitarea integrala a pretului.`);
        deseneazaParagraf(`3.2. Termenul estimat pentru executarea serviciilor este de ${getVal('serviciiTermen') || '30 ZILE CALENDARISTICE'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 4: PRETUL SI MODALITATEA DE PLATA");
        deseneazaParagraf(`4.1. Pretul total convenit pentru prestarea serviciilor este in cuantum de ${getVal('serviciiPret') || '0 RON'}.`);
        deseneazaParagraf(`4.2. Plata se va efectua pe baza facturii fiscale emise de Prestator, in termen de maximum 5 zile de la emitere.`);
        deseneazaParagraf(`4.3. In caz de intârziere a platii, Beneficiarul datoreaza penalitati de 0.1% pe zi de intarziere din suma datorata.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 5: RECEPTIA SERVICIILOR");
        deseneazaParagraf(`5.1. La finalizarea serviciilor, partile vor semna un Proces-Verbal de Predare-Primire.`);
        deseneazaParagraf(`5.2. Daca Beneficiarul nu formuleaza obiectii scrise in termen de 3 zile calendaristice de la predare, serviciile se considera acceptate tacit.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 6: PROPRIETATEA INTELECTUALA (IP)");
        deseneazaParagraf(`6.1. Drepturile de proprietate intelectuala asupra rezultatelor muncii revin Beneficiarului NUMAI DUPA achitarea integrala a pretului prevazut la Art. 4.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 7: CONFIDENTIALITATEA (NDA) SI GDPR");
        deseneazaParagraf(`7.1. Partile se obliga sa pastreze confidentialitatea tuturor informatiilor comerciale sau tehnice luate la cunostinta.`);
        deseneazaParagraf(`7.2. Prelucrarea datelor cu caracter personal se face in conformitate cu Regulamentul (UE) 2016/679 (GDPR), strict in scopul executarii prezentului contract.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 8: PACTUL COMISORIU EXPRES (REZILIERE)");
        deseneazaParagraf(`8.1. Prezentul contract poate inceta prin acordul scris al partilor sau prin reziliere unilaterala cu un preaviz de 15 zile.`);
        deseneazaParagraf(`8.2. In cazul incalcarii grave a obligatiilor (ex: neplata la termen), contractul se considera reziliat de plin drept (pact comisoriu de gradul IV), fara interventia instantei.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 9: LITIGII SI FORTA MAJORA");
        deseneazaParagraf(`9.1. Forta majora exonereaza de raspundere in conditiile legii.`);
        deseneazaParagraf(`9.2. Litigiile nerezolvate pe cale amiabila vor fi inaintate spre solutionare instantelor judecatoresti competente.`);
        y -= 15;

        if (y < 160) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }

        page.drawText(curataDiacritice(`Incheiat astazi, ${new Date().toLocaleDateString('ro-RO')}, in 2 exemplare originale.`), { x: 45, y, size: 8, font: fontBold });
        y -= 25;
        
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

        page.drawText(curataDiacritice("Semnatura Prestator"), { x: 45, y: y - 62, size: 7.5, font: fontBold });
        page.drawText(curataDiacritice("Semnatura Beneficiar"), { x: 310, y: y - 62, size: 7.5, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_PRESTARI_SERVICII_ACTPELOC.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'PS-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('beneficiarNume') || 'Beneficiar') });
        }
        arataNotificare("✅ Contract de prestări servicii generat cu succes și salvat în arhivă!");
    } catch(e) { arataNotificare("Eroare PDF Prestări: " + e.message, true); }
}

// 4. GENERATOR CERERE DEMISIE
async function genereazaCerereDemisiePDF() {
    arataNotificare("Se generează cererea de demisie oficială...");
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

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

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

        const p1 = `Subsemnatul/a ${nume}, având funcția de ${functie} în cadrul departamentului ${departament}, domiciliat/ă în ${adresa}, posesor/posesoare al/a CI seria și numărul ${act}, CNP ${cnp}, angajat/ă în baza Contractului Individual de Muncă nr. ${cimNr} din data de ${cimData}.`;
        page.drawText(curataDiacritice(p1), { x: 45, y, size: 8.5, font, maxWidth: 505 });
        y -= 60;

        const p2 = `Prin prezenta, în conformitate cu prevederile art. 81 din Legea nr. 53/2003 (Codul Muncii), vă aduc la cunoștință încetarea contractului individual de muncă prin demisie.`;
        page.drawText(curataDiacritice(p2), { x: 45, y, size: 8.5, font, maxWidth: 505 });
        y -= 45;

        const p3 = `Termenul de preaviz de ${zilePreaviz}, conform prevederilor legale, va începe să curgă începând cu data de ${dataStart}, ultima zi de activitate și de prezență la locul de muncă urmând să fie la data de ${dataSfarsit}.`;
        page.drawText(curataDiacritice(p3), { x: 45, y, size: 8.5, font, maxWidth: 505 });
        y -= 55;

        const p4 = `Solicit conducerii societății ca la data încetării contractului să îmi fie achitate drepturile salariale cuvenite la zi, inclusiv compensarea în bani a zilelor de concediu de odihnă efectuate sau neefectuate, și să mi se elibereze adeverința de vechime / extrasul REVISAL și nota de lichidare.`;
        page.drawText(curataDiacritice(p4), { x: 45, y, size: 8.5, font, maxWidth: 505 });
        y -= 65;

        page.drawText(curataDiacritice("Vă rog să luați act de prezenta cerere și să o înregistrați la registratura societății."), { x: 45, y, size: 9, font: fontBold });
        y -= 50;

        page.drawText(curataDiacritice(`Data formulării: ${new Date().toLocaleDateString('ro-RO')}`), { x: 45, y, size: 8.5, font });
        y -= 40;

        const sigDemCanvas = document.getElementById('sigDemisieCanvas');
        if (sigDemCanvas && sigDemCanvas.offsetParent !== null) {
            const sigBytes = await pdfDoc.embedPng(sigDemCanvas.toDataURL('image/png'));
            page.drawImage(sigBytes, { x: 45, y: y - 55, width: 140, height: 45 });
        }

        page.drawText(curataDiacritice("Semnătura Salariatului"), { x: 45, y: y - 68, size: 8, font: fontBold });

        page.drawRectangle({ x: 310, y: y - 85, width: 240, height: 80, borderColor: PDFLib.rgb(0.3, 0.3, 0.3), borderWidth: 1 });
        page.drawText(curataDiacritice("REZERVAT PENTRU ANGAJATOR (HR)"), { x: 320, y: y - 15, size: 7.5, font: fontBold });
        page.drawText(curataDiacritice("Luat la cunoștință, Data: ........................"), { x: 320, y: y - 35, size: 7, font });
        page.drawText(curataDiacritice("Nr. înregistrare: ...................................."), { x: 320, y: y - 50, size: 7, font });
        page.drawText(curataDiacritice("Semnătura și ștampila: ........................"), { x: 320, y: y - 65, size: 7, font });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CERERE_DEMISIE_OFICIALA.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'DEM-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('demisNume') || 'Salariat') });
        }
        arataNotificare("✅ Cererea de demisie oficială a fost generată și salvată cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Demisie: " + e.message, true); }
}

// 5. NOU: GENERATOR CONTRACT DE COMODAT (IMOBIL SAU AUTO)
async function genereazaContractComodatPDF() {
    arataNotificare("Se generează contractul de comodat oficial...");
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
            y -= 15;
        };

        const deseneazaParagraf = (text) => {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 7.5, font, maxWidth: 505 });
            y -= 14;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const titluText = "CONTRACT DE COMODAT (FOLOSINTA GRATUITA)";
        const textWidth = fontBold.widthOfTextAtSize(titluText, 12);
        const centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 12, font: fontBold });
        y -= 25;

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Comodant (Proprietar): ${getVal('comodantNume') || '....................................'}, identificat prin CNP/CUI: ${getVal('comodantCnp') || '................'}, CI/Reg.Com: ${getVal('comodantAct') || '........'}, cu domiciliul/sediul in ${getVal('comodantAdresa') || '....................................'}.`);
        deseneazaParagraf(`1.2. Comodatar (Beneficiar): ${getVal('comodatarNume') || '....................................'}, identificat prin CNP/CUI: ${getVal('comodatarCnp') || '................'}, CI/Reg.Com: ${getVal('comodatarAct') || '........'}, cu domiciliul/sediul in ${getVal('comodatarAdresa') || '....................................'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI SI DESTINATIA");
        deseneazaParagraf(`2.1. Comodantul da spre folosința gratuita Comodatarului următorul bun: ${getVal('comodatDescriereBun') || '..................................................................................................................'}.`);
        deseneazaParagraf(`2.2. Destinația bunului este: ${getVal('comodatScop') || 'Locuinta / Stabilire Sediu Social conform Legii nr. 31/1990'}. Comodantul in calitate de proprietar acorda acordul expres pentru aceasta destinatie.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract se încheie pe o perioadă de ${getVal('comodatDurata') || '3 ANI'}, începând cu data de ${new Date().toLocaleDateString('ro-RO')}.`);
        deseneazaParagraf(`3.2. La expirarea termenului, contractul poate fi prelungit prin acordul scris al ambelor părți.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 4: OBLIGAȚIILE COMODATARULUI");
        deseneazaParagraf(`4.1. Comodatarul se obligă să îngrijească și să conserve bunul ca un bun proprietar, suportând toate cheltuielile curente de întreținere.`);
        deseneazaParagraf(`4.2. Este strict interzisă subcomodarea, închirierea sau schimbarea destinației bunului fără acordul prealabil scris al Comodantului.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 5: DISPOZIȚII FINALE");
        deseneazaParagraf(`5.1. Prezentul contract constituie titlu executoriu în condițiile legii și s-a încheiat astăzi în 2 exemplare originale.`);
        y -= 25;

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

        page.drawText(curataDiacritice("Semnatura Comodant"), { x: 45, y: y - 62, size: 7.5, font: fontBold });
        page.drawText(curataDiacritice("Semnatura Comodatar"), { x: 310, y: y - 62, size: 7.5, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_COMODAT_ACTPELOC.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'COM-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('comodatarNume') || 'Comodatar') });
        }
        arataNotificare("✅ Contractul de comodat a fost generat și descărcat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Comodat: " + e.message, true); }
}

// Inițializare canvas la încărcarea paginii pentru semnături
window.addEventListener('DOMContentLoaded', () => {
    initCanvasSemnatura('sigProprietarCanvas');
    initCanvasSemnatura('sigChiriasCanvas');
    initCanvasSemnatura('sigDemisieCanvas');
});