// ==========================================
// MODULUL DE GENERARE PDF ȘI SEMNĂTURI
// ==========================================
// Funcție utilitară globală pentru curățarea diacriticelor românești
// Funcție unică și sigură pentru curățarea diacriticelor
function curataDiacritice(text) {
    if (!text) return '';
    return String(text).toUpperCase()
        .replace(/Ă/g, 'A').replace(/ă/g, 'a')
        .replace(/Â/g, 'A').replace(/â/g, 'a')
        .replace(/Î/g, 'I').replace(/î/g, 'i')
        .replace(/Ș/g, 'S').replace(/Ş/g, 'S').replace(/ș/g, 's').replace(/ş/g, 's')
        .replace(/Ț/g, 'T').replace(/Ţ/g, 'T').replace(/ț/g, 't').replace(/ţ/g, 't');
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
            y -= 20;
        };

       const deseneazaParagraf = (text, customFont = font, size = 7.5, maxWidth = 505) => {
        if (!text) return;
        const words = curataDiacritice(text).split(' ');
        let line = '';
        const lineHeight = 11;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testWidth = customFont.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && i > 0) {
                if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                y -= lineHeight;
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        if (line.trim().length > 0) {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(line.trim(), { x: 45, y, size, font: customFont });
            y -= lineHeight;
        }
        y -= 4;
    };

       const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? curataDiacritice(el.value) : '';
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
            y -= 20;
        };

       const deseneazaParagraf = (text, customFont = font, size = 7.5, maxWidth = 505) => {
        if (!text) return;
        const words = curataDiacritice(text).split(' ');
        let line = '';
        const lineHeight = 11;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testWidth = customFont.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && i > 0) {
                if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                y -= lineHeight;
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        if (line.trim().length > 0) {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(line.trim(), { x: 45, y, size, font: customFont });
            y -= lineHeight;
        }
        y -= 4;
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

    const sigPrestatorCanvas = document.getElementById('sigProprietarCanvas');
    const sigBeneficiarCanvas = document.getElementById('sigChiriasCanvas');
        if (sigPrestatorCanvas) {
            try {
                const sigPImageBytes = await pdfDoc.embedPng(sigPrestatorCanvas.toDataURL('image/png'));
                page.drawImage(sigPImageBytes, { x: 45, y: y - 50, width: 120, height: 40 });
            } catch (err) {
                console.log("Canvas prestator gol sau neinițializat");
            }
        }
        if (sigBeneficiarCanvas) {
            try {
                const sigCImageBytes = await pdfDoc.embedPng(sigBeneficiarCanvas.toDataURL('image/png'));
                page.drawImage(sigCImageBytes, { x: 310, y: y - 50, width: 120, height: 40 });
            } catch (err) {
                console.log("Canvas beneficiar gol sau neinițializat");
            }
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

// 5.1. GENERATOR CONTRACT DE COMODAT AUTO (COMPLET SI BLINDAT JURIDIC)
async function genereazaContractComodatAutoPDF() {
    const chassisEl = document.getElementById('comodatAutoVin');
    if (chassisEl) {
        const vin = chassisEl.value.trim();
        if (vin.length !== 17) {
            arataNotificare("⚠️ Seria de șasiu (VIN) trebuie să aibă exact 17 caractere!", true);
            chassisEl.focus();
            return;
        }
    }

    arataNotificare("Se generează contractul de comodat auto oficial...");
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
            y -= 6;
            page.drawText(curataDiacritice(text), { x: 45, y, size: 8.5, font: fontBold });
            y -= 18;
        };

        const deseneazaParagraf = (text, customFont = font, size = 7.5, maxWidth = 505) => {
            if (!text) return;
            const words = curataDiacritice(text).split(' ');
            let line = '';
            const lineHeight = 11;

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const testWidth = customFont.widthOfTextAtSize(testLine, size);
                if (testWidth > maxWidth && i > 0) {
                    if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                    page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                    y -= lineHeight;
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim().length > 0) {
                if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                y -= lineHeight;
            }
            y -= 4;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const titluText = "CONTRACT DE COMODAT (IMPRUMUT DE FOLOSINTA AUTO)";
        const subTitluText = "In temeiul art. 2146 – 2157 din Legea nr. 287/2009 privind Codul Civil";
        
        let textWidth = fontBold.widthOfTextAtSize(titluText, 11);
        let centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 11, font: fontBold });
        y -= 15;

        textWidth = font.widthOfTextAtSize(subTitluText, 8);
        centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(subTitluText), { x: centerX, y, size: 8, font });
        y -= 25;

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Comodant (Proprietar): ${getVal('comodantAutoNume') || '....................................'}, CNP/CUI: ${getVal('comodantAutoCnp') || '................'}, CI seria: ${getVal('comodantAutoAct') || '........'}, domiciliat in ${getVal('comodantAutoAdresa') || '....................................'}.`);
        deseneazaParagraf(`1.2. Comodatar (Utilizator): ${getVal('comodatarAutoNume') || '....................................'}, CNP/CUI: ${getVal('comodatarAutoCnp') || '................'}, CI seria: ${getVal('comodatarAutoAct') || '........'}, domiciliat in ${getVal('comodatarAutoAdresa') || '....................................'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI");
        deseneazaParagraf(`2.1. Comodantul dă spre folosință gratuită Comodatarului autoturismul marca ${getVal('comodatAutoMarca') || '....................'}, model ${getVal('comodatAutoModel') || '....................'}, seria de sasiu (VIN) ${getVal('comodatAutoVin') || '................................'}, număr de înmatriculare ${getVal('comodatAutoNr') || '........'}, serie motor ${getVal('comodatAutoMotor') || '................'}, cilindree ${getVal('comodatAutoCmc') || '........'} cmc.`);
        deseneazaParagraf(`2.2. Predarea-primirea autovehiculului se face pe baza stării tehnice actuale, cunoscute și acceptate de ambele părți, bunul fiind apt pentru utilizare în siguranță pe drumurile publice.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract se încheie pe o perioadă de ${getVal('comodatAutoDurata') || '1 AN'}, începând cu data de ${new Date().toLocaleDateString('ro-RO')}.`);
        deseneazaParagraf(`3.2. La expirarea termenului, contractul poate fi prelungit prin acordul scris al ambelor părți sau încetează de drept prin restituirea bunului.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 4: DESTINATIA SI FOLOSINTA BUNULUI");
        deseneazaParagraf(`4.1. Autovehiculul va fi utilizat exclusiv în scop personal sau profesional. Este strict interzisă subcomodarea, închirierea sau transmiterea folosinței către terți fără acordul scris al Comodantului.`);
        deseneazaParagraf(`4.2. Comodatarul are obligația de a folosi bunul conform destinației sale economice și tehnice.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 5: OBLIGATIILE SI RESPUNDEREA PARTILOR");
        deseneazaParagraf(`5.1. Comodatarul se obligă să îngrijească și să conserve bunul ca un bun proprietar, conform art. 2148 din Codul Civil, suportând toate cheltuielile curente de funcționare (combustibil, ITP, RCA, rovinietă, întreținere tehnică periodică).`);
        deseneazaParagraf(`5.2. Comodatarul răspunde pentru pierderea sau deteriorarea bunului, exceptând uzura normală cauzată de o folosință normală și forța majoră, conform art. 2150 din Codul Civil.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 6: INCETAREA SI REZILIEREA CONTRACTULUI");
        deseneazaParagraf(`6.1. Prezentul contract încetează la expirarea termenului sau prin restituirea bunului de către Comodatar.`);
        deseneazaParagraf(`6.2. Nerespectarea obligațiilor contractuale dă dreptul Comodantului să considere contractul reziliat de plin drept, fără intervenția instanței (pact comisoriu).`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 7: LITIGII SI DISPOZITII FINALE");
        deseneazaParagraf(`7.1. Litigiile decurgând din acest contract se vor soluționa pe cale amiabilă sau, în caz de eșec, de către instanțele judecătorești competente.`);
        deseneazaParagraf(`7.2. Prezentul contract constituie titlu executoriu în condițiile legii și s-a încheiat astăzi în 2 exemplare originale.`);
        y -= 20;

        if (y < 160) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }

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
        a.href = url; a.download = "CONTRACT_COMODAT_AUTO_ACTPELOC.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'COMAUTO-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('comodatarAutoNume') || 'Comodatar Auto') });
        }
        arataNotificare("✅ Contractul de comodat auto a fost generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Comodat Auto: " + e.message, true); }
}


// 5.2. GENERATOR CONTRACT DE COMODAT IMOBIL (COMPLET SI BLINDAT JURIDIC - ONRC / ANAF)
async function genereazaContractComodatImobilPDF() {
    arataNotificare("Se generează contractul de comodat imobil (sediu/locuință)...");
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
            y -= 6;
            page.drawText(curataDiacritice(text), { x: 45, y, size: 8.5, font: fontBold });
            y -= 18;
        };

        const deseneazaParagraf = (text, customFont = font, size = 7.5, maxWidth = 505) => {
            if (!text) return;
            const words = curataDiacritice(text).split(' ');
            let line = '';
            const lineHeight = 11;

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const testWidth = customFont.widthOfTextAtSize(testLine, size);
                if (testWidth > maxWidth && i > 0) {
                    if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                    page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                    y -= lineHeight;
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim().length > 0) {
                if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                y -= lineHeight;
            }
            y -= 4;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const titluText = "CONTRACT DE COMODAT (IMPRUMUT FOLOSINTA IMOBIL)";
        const subTitluText = "Conform art. 2146-2157 C.Civ. si Legii nr. 31/1990 (pentru sediu social)";
        
        let textWidth = fontBold.widthOfTextAtSize(titluText, 11);
        let centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 11, font: fontBold });
        y -= 15;

        textWidth = font.widthOfTextAtSize(subTitluText, 8);
        centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(subTitluText), { x: centerX, y, size: 8, font });
        y -= 25;

        deseneazaTitluSectiune("ARTICOLUL 1: PARTILE CONTRACTANTE");
        deseneazaParagraf(`1.1. Comodant (Proprietar): ${getVal('comodantImobilNume') || '....................................'}, CNP/CUI: ${getVal('comodantImobilCnp') || '................'}, CI/Reg.Com: ${getVal('comodantImobilAct') || '........'}, domiciliat/sediu în ${getVal('comodantImobilAdresa') || '....................................'}.`);
        deseneazaParagraf(`1.2. Comodatar (Beneficiar): ${getVal('comodatarImobilNume') || '....................................'}, CNP/CUI: ${getVal('comodatarImobilCnp') || '................'}, CI/Reg.Com: ${getVal('comodatarImobilAct') || '........'}, domiciliat/sediu în ${getVal('comodatarImobilAdresa') || '....................................'}.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 2: OBIECTUL CONTRACTULUI SI SITUAȚIA JURIDICĂ");
        deseneazaParagraf(`2.1. Comodantul dă în folosință gratuită Comodatarului imobilul situat în ${getVal('comodatImobilAdresaBun') || '..................................................................................................................'}.`);
        deseneazaParagraf(`2.2. Imobilul este înscris în Cartea Funciară (CF) nr. ${getVal('comodatImobilCf') || '................'} a localității și număr cadastral ${getVal('comodatCadastru') || '................'}.`);
        deseneazaParagraf(`2.3. Destinația aprobată a imobilului este: ${getVal('comodatImobilScop') || 'Stabilire Sediu Social și/sau Locuință'}. Comodantul în calitate de proprietar exclusiv acordă acordul său expres pentru această destinație în relația cu ONRC, ANAF și autoritățile competente.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 3: DURATA CONTRACTULUI");
        deseneazaParagraf(`3.1. Prezentul contract se încheie pe o perioadă de ${getVal('comodatImobilDurata') || '3 ANI'}, începând cu data de ${new Date().toLocaleDateString('ro-RO')}.`);
        deseneazaParagraf(`3.2. La expirarea termenului, contractul poate fi prelungit prin act adițional scris încheiat între părți.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 4: OBLIGAȚIILE ȘI DREPTURILE PĂRȚILOR");
        deseneazaParagraf(`4.1. Comodantul garantează folosința pașnică, lipsită de evicțiune și că deține dreptul legal de proprietate asupra imobilului ce face obiectul prezentului contract.`);
        deseneazaParagraf(`4.2. Comodatarul se obligă să îngrijească imobilul ca un bun proprietar, să achite la termen utilitățile consumate (energie electrică, gaze, apă, salubritate) și să nu schimbe destinația fără acordul scris al Comodantului.`);
        deseneazaParagraf(`4.3. Subcomodarea sau închirierea totală ori parțială a imobilului către terți este strict interzisă.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 5: INCETAREA SI REZILIEREA");
        deseneazaParagraf(`5.1. Contractul încetează la termen sau prin acordul scris al părților.`);
        deseneazaParagraf(`5.2. Nerespectarea clauzelor dă dreptul Comodantului să declare contractul reziliat de plin drept, fără intervenția instanței.`);
        y -= 4;

        deseneazaTitluSectiune("ARTICOLUL 6: DISPOZIȚII FINALE ȘI ADMINISTRATIVE");
        deseneazaParagraf(`6.1. Prezentul contract servește la Oficiul Registrului Comerțului (ONRC), ANAF sau evidența populației și s-a încheiat astăzi în 2 exemplare originale.`);
        y -= 20;

        if (y < 160) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }

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
        a.href = url; a.download = "CONTRACT_COMODAT_IMOBIL_ACTPELOC.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'COMIMOB-' + Math.floor(1000 + Math.random()*9000), numeClient: curataDiacritice(getVal('comodatarImobilNume') || 'Comodatar Imobil') });
        }
        arataNotificare("✅ Contractul de comodat imobil a fost generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Comodat Imobil: " + e.message, true); }
}

// GENERATOR CONTRACT INDIVIDUAL DE MUNCĂ (CIM) - VERSIUNEA JURIDICĂ COMPLETĂ 2026
async function genereazaContractCimPDF() {
    arataNotificare("Se generează Contractul Individual de Muncă (versiunea juridică completă)...");
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;

        const deseneazaFooter = () => {
            page.drawText(curataDiacritice("Generat prin ActPeLoc.ro — Document oficial conform Legii nr. 53/2003 (Codul Muncii) și H.G. 905/2017"), { 
                x: 45, y: 25, size: 7, font, color: PDFLib.rgb(0.5, 0.5, 0.5) 
            });
        };

        const deseneazaTitluSectiune = (text) => {
            if (y < 75) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            page.drawText(curataDiacritice(text), { x: 45, y, size: 8, font: fontBold });
            y -= 14;
        };

        const deseneazaParagraf = (text, customFont = font, size = 7, maxWidth = 505) => {
            if (!text) return;
            const words = curataDiacritice(text).split(' ');
            let line = '';
            const lineHeight = 10;

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const testWidth = customFont.widthOfTextAtSize(testLine, size);
                if (testWidth > maxWidth && i > 0) {
                    if (y < 75) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                    page.drawText(curataDiacritice(line.trim()), { x: 45, y, size, font: customFont });
                    y -= lineHeight;
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim().length > 0) {
                if (y < 75) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                page.drawText(curataDiacritice(line.trim()), { x: 45, y, size, font: customFont });
                y -= lineHeight;
            }
            y -= 2;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? curataDiacritice(el.value.trim()) : '';
        };

        // Preluarea variabilelor noi pentru CI și IBAN
        const serieCI = getVal('cimSalariatSerie') || '....';
        const numarCI = getVal('cimSalariatNumar') || '........';
        const emitentCI = getVal('cimSalariatEmitent') || 'SPCLEP';
        const ibanSalariat = getVal('cimSalariatIban') || '....................................';

        // Antet Oficial
        const titluText = "CONTRACT INDIVIDUAL DE MUNCĂ";
        const subTitluText = "încheiat și înregistrat în Registrul General de Evidență a Salariaților sub nr. _____ / ____________";
        
        let textWidth = fontBold.widthOfTextAtSize(curataDiacritice(titluText), 10);
        let centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 10, font: fontBold });
        y -= 12;

        textWidth = font.widthOfTextAtSize(curataDiacritice(subTitluText), 7);
        centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(subTitluText), { x: centerX, y, size: 7, font });
        y -= 18;

        // Părțile Contractante
        deseneazaTitluSectiune("A. PĂRȚILE CONTRACTANTE");
        deseneazaParagraf(`A.1. Angajator: ${getVal('cimAngajatorNume') || '...................................................'}, cu sediul social în ${getVal('cimAngajatorAdresa') || '...................................................'}, înregistrată la Oficiul Registrului Comerțului sub nr. ${getVal('cimAngajatorReg') || '........'}, cod unic de înregistrare CUI ${getVal('cimAngajatorCui') || '........'}, reprezentată legal prin ${getVal('cimAngajatorReprezentant') || '....................................'}, în calitatea de administrator.`);
        deseneazaParagraf(`A.2. Salariatul/a: ${getVal('cimSalariatNume') || '...................................................'}, domiciliat/ă în ${getVal('cimSalariatAdresa') || '...................................................'}, posesor/oare al actului de identitate CI seria ${serieCI} nr. ${numarCI}, eliberat de ${emitentCI}, CNP: ${getVal('cimSalariatCnp') || '................'}.`);
        y -= 2;

        // Obiectul și locul muncii
        deseneazaTitluSectiune("B. OBIECTUL CONTRACTULUI ȘI LOCUL MUNCII");
        deseneazaParagraf(`B.1. Obiectul contractului îl constituie prestarea muncii de către salariat în conformitate cu funcția / meseria prevăzută în Clasificarea Ocupațiilor din România (COR): ${getVal('cimFunctie') || '...................................................'}. Atribuțiile postului sunt stabilite în fișa postului, anexă integrantă la prezentul contract.`);
        deseneazaParagraf(`B.2. Locul muncii este: ${getVal('cimLocMunca') || 'La sediul / punctul de lucru al angajatorului'}, activitatea putând fi desfășurată și în regim de telemuncă sau muncă la domiciliu, cu acordul scris al părților, dacă specificul o cere.`);
        deseneazaParagraf(`B.3. Salariatul poate fi delegat sau detașat în alt loc de muncă în condițiile prevăzute de Codul Muncii.`);
        y -= 2;

        // Durata contractului
        deseneazaTitluSectiune("C. DURATA CONTRACTULUI");
        deseneazaParagraf(`C.1. Prezentul contract individual de muncă se încheie pe durată ${getVal('cimTipDurata') || 'NEDETERMINATĂ'}, începând cu data de ${getVal('cimDataStart') || new Date().toLocaleDateString('ro-RO')}.`);
        deseneazaParagraf(`C.2. Perioada de probă este de 90 de zile calendaristice pentru funcții de execuție / 120 de zile calendaristice pentru funcții de conducere, timp în care contractul poate înceta printr-o simplă notificare scrisă, fără preaviz, la inițiativa oricăreia dintre părți.`);
        y -= 2;

        // Timpul de muncă
        deseneazaTitluSectiune("D. TIMPUL DE MUNCĂ ȘI REPAUSUL");
        deseneazaParagraf(`D.1. Durata timpului de muncă este de ${getVal('cimTimpMunca') || '8 ore/zi, 40 ore/săptămână'}. Repartizarea timpului de muncă se face uniform: 8 ore/zi, de luni până vineri.`);
        deseneazaParagraf(`D.2. Munca suplimentară se compensează prin ore libere plătite în următoarele 90 de zile calendaristice după efectuarea acesteia sau prin spor la salariu conform legii.`);
        deseneazaParagraf(`D.3. Salariatul beneficiază de repaus zilnic, repaus săptămânal și de un concediu de odihnă anual în durată de minimum 20 de zile lucrătoare.`);
        y -= 2;

        // Salarizarea
        deseneazaTitluSectiune("E. SALARIUL DE BAZĂ LUNAR BRUT ȘI ALTE ELEMENTE SALARIALE");
        deseneazaParagraf(`E.1. Salariul de bază lunar brut este în cuantum de ${getVal('cimSalariuBrut') || '0'} lei. La acesta se adaugă, după caz, sporurile, indemnizațiile și adaosurile prevăzute de lege sau de regulamentul intern.`);
        deseneazaParagraf(`E.2. Data la care se plătește salariul este 10 ale lunii următoare celei pentru care s-a prestat munca. Plata se efectuează prin virament bancar în contul salariatului nr. ${ibanSalariat}.`);
        deseneazaParagraf(`E.3. Reținerea și virarea impozitului pe venit și a contribuțiilor sociale obligatorii se realizează de către angajator în conformitate cu legislația fiscală în vigoare.`);
        y -= 2;

        // Drepturi și obligații fundamentale
        deseneazaTitluSectiune("F. DREPTURI ȘI OBLIGAȚII PRINCIPALE ALE PĂRȚILOR");
        deseneazaParagraf(`F.1. Salariatul are dreptul la: salarizare pentru munca depusă, repaus zilnic și săptămânal, securitate și sănătate în muncă, acces la formare profesională, protecție în caz de concediere nelegală.`);
        deseneazaParagraf(`F.2. Angajatorul are dreptul să dea dispoziții cu caracter obligatoriu pentru salariat (sub rezerva legalității lor), să exercite controlul asupra modului de îndeplinire a sarcinilor de serviciu și să constate abaterile disciplinare.`);
        deseneazaParagraf(`F.3. Salariatul are obligația de a respecta disciplina muncii, de a îndeplini atribuțiile conform fișei postului, de a respecta normele de SSM (Legea 319/2006) și de a păstra confidențialitatea informațiilor de serviciu.`);
        y -= 2;

        // Condiții de muncă
        deseneazaTitluSectiune("G. SECURITATEA ȘI SĂNĂTATEA ÎN MUNCĂ");
        deseneazaParagraf(`G.1. Angajatorul are obligația să asigure securitatea și sănătatea salariatului în toate aspectele legate de muncă. Salariatul are o strictă obligație să respecte instructiunile de SSM primite la instruirea periodică.`);
        y -= 2;

        // Dispoziții finale
        deseneazaTitluSectiune("H. DISPOZIȚII FINALE");
        deseneazaParagraf(`H.1. Prezentul contract se completează cu prevederile Codului Muncii (Legea 53/2003) și ale legislației muncii aplicabile în România.`);
        deseneazaParagraf(`H.2. Orice modificare a clauzelor contractuale impune încheierea unui act adițional în formă scrisă, acceptat și semnat de ambele părți, sub sancțiunea nulității.`);
        y -= 12;

        if (y < 130) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }

        page.drawText(curataDiacritice(`Încheiat astăzi, ${new Date().toLocaleDateString('ro-RO')}, în 2 exemplare originale, câte unul pentru fiecare parte.`), { x: 45, y, size: 7, font: fontBold });
        y -= 20;
        
        deseneazaTitluSectiune("SEMNĂTURILE PĂRȚILOR:");
        y -= 4;

        // Preluare semnături canvas
        const sigAngajatorCanvas = document.getElementById('sigProprietarCanvas');
        const sigSalariatCanvas = document.getElementById('sigChiriasCanvas');
        
        if (sigAngajatorCanvas) {
            try {
                const sigABytes = await pdfDoc.embedPng(sigAngajatorCanvas.toDataURL('image/png'));
                page.drawImage(sigABytes, { x: 45, y: y - 40, width: 100, height: 32 });
            } catch (err) {
                console.log("Canvas angajator gol");
            }
        }
        if (sigSalariatCanvas) {
            try {
                const sigSBytes = await pdfDoc.embedPng(sigSalariatCanvas.toDataURL('image/png'));
                page.drawImage(sigSBytes, { x: 310, y: y - 40, width: 100, height: 32 });
            } catch (err) {
                console.log("Canvas salariat gol");
            }
        }

        page.drawText(curataDiacritice("ANGAJATOR,"), { x: 45, y: y - 50, size: 7, font: fontBold });
        page.drawText(curataDiacritice("SALARIAT,"), { x: 310, y: y - 50, size: 7, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "CONTRACT_INDIVIDUAL_MUNCA_CIM_OFICIAL.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ 
                idAct: 'CIM-' + Math.floor(1000 + Math.random()*9000), 
                numeClient: curataDiacritice(getVal('cimSalariatNume') || 'Salariat'),
                tip: 'CIM',
                data: new Date().toLocaleDateString('ro-RO')
            });
        }
        arataNotificare("✅ Contractul Individual de Muncă (CIM) rigorizat și complet a fost generat!");
    } catch(e) { 
        arataNotificare("Eroare PDF CIM: " + e.message, true); 
    }
}
// 7. GENERATOR FIȘA POSTULUI OFICIALĂ EXTINSĂ
async function genereazaFisaPostuluiPDF() {
    try {
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let width = 595.28;
        let height = 841.89;
        let margin = 40;
        let contentWidth = width - (margin * 2);
        let y = height - 40;

        function verificaSpatiu(necesar) {
            if (y < necesar) {
                page = pdfDoc.addPage([595.28, 841.89]);
                y = height - 40;
            }
            
        }

        function imparteTextInLinii(text, maxWidth, fontSize) {
            if (!text) return [];
            const words = text.split(' ');
            let lines = [];
            let currentLine = words[0] || '';

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const widthTest = fontRegular.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
                if (widthTest < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        }

        const d = colecteazaDate();
        const angajator = curataDiacritice(d.fisaAngajator || 'SC FIRMA SRL');
        const salariat = curataDiacritice(d.fisaSalariat || 'SALARIAT');
        const functie = curataDiacritice(d.fisaFunctie || 'FUNCTIE');
        const cor = curataDiacritice(d.fisaCor || '0000');
        const departament = curataDiacritice(d.fisaDepartament || 'GENERAL');
        const subordonare = curataDiacritice(d.fisaSubordonare || 'ADMINISTRATOR');
        const atributii = curataDiacritice(d.fisaAtributii || 'Atributii specifice postului.');
        const responsabilitati = curataDiacritice(d.fisaResponsabilitati || 'Respectarea normelor de securitate.');
        const studii = curataDiacritice(d.fisaStudii || 'STUDII MEDII');
        const vechime = curataDiacritice(d.fisaVechime || '1 AN');

        page.drawText(curataDiacritice('ANEXA LA CONTRACTUL INDIVIDUAL DE MUNCA'), { x: margin, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        y -= 16;
        page.drawText(curataDiacritice('FISA POSTULUI SI ATRIBUTII DE SERVICIU'), { x: margin, y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 22;

        page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.5, color: rgb(0.2, 0.2, 0.8) });
        y -= 20;

        verificaSpatiu(120);
        page.drawText(curataDiacritice('1. IDENTIFICAREA POSTULUI DE MUNCA'), { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;

        const infoPost = [
            `Denumirea angajatorului: ${angajator}`,
            `Numele si prenumele salariatului: ${salariat}`,
            `Denumirea postului: ${functie} | Cod COR: ${cor}`,
            `Departamentul / Compartimentul: ${departament}`,
            `Relatii ierarhice: ${subordonare}`
        ];

        infoPost.forEach(linie => {
            page.drawText(linie, { x: margin + 10, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
            y -= 13;
        });

        y -= 10;

        verificaSpatiu(100);
        page.drawText(curataDiacritice('2. ATRIBUTII SI SARCINI DE SERVICIU'), { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;

        const splitAtributii = imparteTextInLinii(atributii, contentWidth - 20, 8.5);
        splitAtributii.forEach(linie => {
            verificaSpatiu(30);
            page.drawText(linie, { x: margin + 10, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
            y -= 12;
        });

        y -= 10;

        verificaSpatiu(100);
        page.drawText(curataDiacritice('3. RESPONSABILITATILE POSTULUI SI SSM'), { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;

        const textRespExtins = `${responsabilitati} Salariatul are obligatia de a respecta normele de Securitate si Sanatate in Munca (SSM), PSI si regulamentul intern.`;
        const splitResp = imparteTextInLinii(textRespExtins, contentWidth - 20, 8.5);
        splitResp.forEach(linie => {
            verificaSpatiu(30);
            page.drawText(linie, { x: margin + 10, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
            y -= 12;
        });

        y -= 10;

        verificaSpatiu(80);
        page.drawText(curataDiacritice('4. CERINȚELE POSTULUI'), { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;

        const infoCerinte = [
            `Nivel de studii / Calificare: ${studii}`,
            `Vechime in specialitate solicitata: ${vechime}`,
            `Aptitudini: Disciplina, rezistenta la stres, corectitudine.`
        ];

        infoCerinte.forEach(linie => {
            verificaSpatiu(30);
            page.drawText(linie, { x: margin + 10, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
            y -= 13;
        });

        y -= 10;

        verificaSpatiu(90);
        page.drawText(curataDiacritice('5. CONDITII DE MUNCA SI PROGRAM'), { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;

        const infoConditii = [
            `Program de lucru: Conform Contractului Individual de Munca.`,
            `Conditii materiale: Unelte si echipamente puse la dispozitie de angajator.`,
            `Locul de desfasurare: La sediul / punctele de lucru ale angajatorului.`
        ];

        infoConditii.forEach(linie => {
            verificaSpatiu(30);
            page.drawText(linie, { x: margin + 10, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
            y -= 13;
        });

        y -= 15;

        verificaSpatiu(150);
        page.drawText(curataDiacritice('6. LUARE LA CUNOSTINTA DE CATRE SALARIAT'), { x: margin, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;
        
        const textLuare = `Prezenta fisa face parte integranta din Contractul Individual de Munca. Am luat la cunostinta prevederile si am primit un exemplar original.`;
        const splitLuare = imparteTextInLinii(textLuare, contentWidth - 20, 8.5);
        splitLuare.forEach(linie => {
            page.drawText(linie, { x: margin + 10, y, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
            y -= 12;
        });

        y -= 35;
        verificaSpatiu(80);

        const canvasAngajator = document.getElementById('sigFisaAngajatorCanvas');
        const canvasSalariat = document.getElementById('sigFisaSalariatCanvas');

        if (canvasAngajator) {
            try {
                const dataUrlAngajator = canvasAngajator.toDataURL('image/png');
                if (dataUrlAngajator && dataUrlAngajator.startsWith('data:image')) {
                    const pngBytes = await fetch(dataUrlAngajator).then(res => res.arrayBuffer());
                    const pngImg = await pdfDoc.embedPng(pngBytes);
                    page.drawImage(pngImg, { x: margin, y: y - 45, width: 130, height: 40 });
                }
            } catch (e) {}
        }

        if (canvasSalariat) {
            try {
                const dataUrlSalariat = canvasSalariat.toDataURL('image/png');
                if (dataUrlSalariat && dataUrlSalariat.startsWith('data:image')) {
                    const pngBytes = await fetch(dataUrlSalariat).then(res => res.arrayBuffer());
                    const pngImg = await pdfDoc.embedPng(pngBytes);
                    page.drawImage(pngImg, { x: width - margin - 130, y: y - 45, width: 130, height: 40 });
                }
            } catch (e) {}
        }

        y -= 50;
        page.drawText(curataDiacritice('Reprezentant Angajator,'), { x: margin, y, size: 8.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(curataDiacritice('Salariat,'), { x: width - margin - 110, y, size: 8.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        
        y -= 11;
        page.drawText(angajator, { x: margin, y, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
        page.drawText(salariat, { x: width - margin - 110, y, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

        page.drawText(curataDiacritice("ActPeLoc.ro — Document oficial generat in conditiile legii"), { 
            x: margin, y: 25, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5) 
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Fisa_Postului_${salariat.replace(/\s+/g, '_')}.pdf`;
        link.click();

        arataNotificare("✅ Fișa Postului extinsă și completă a fost descărcată cu succes!");

    } catch (error) {
        console.error("Eroare la generarea fișei:", error);
        arataNotificare("❌ Eroare la generarea PDF-ului.", true);
    }
}

// Funcție globală blindată pentru eliminarea oricărui semn diacritic
function curataDiacritice(text) {
    if (!text) return '';
    return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "") // Elimină toate diacriticele / accentele Unicode
        .replace(/[ăâ]/g, 'a')
        .replace(/[ĂÂ]/g, 'A')
        .replace(/î/g, 'i')
        .replace(/Î/g, 'I')
        .replace(/[șş]/g, 's')
        .replace(/[ȘŞ]/g, 'S')
        .replace(/[țţ]/g, 't')
        .replace(/[ȚŢ]/g, 'T');
}

// 8. GENERATOR PROCES-VERBAL DE PREDARE-PRIMIRE OFICIAL
async function genereazaProcesVerbalPDF() {
    arataNotificare(curataDiacritice("Se generează Procesul-Verbal de Predare-Primire..."));
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;

        const deseneazaFooter = () => {
            page.drawText(curataDiacritice("Generat prin ActPeLoc.ro — Document oficial în conformitate cu legislația din România"), { 
                x: 45, y: 30, size: 8, font, color: PDFLib.rgb(0.5, 0.5, 0.5) 
            });
        };

        const deseneazaTitluSectiune = (text) => {
            if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
            y -= 6;
            page.drawText(curataDiacritice(text), { x: 45, y, size: 8.5, font: fontBold });
            y -= 18;
        };

        const deseneazaParagraf = (text, customFont = font, size = 7.5, maxWidth = 505) => {
            if (!text) return;
            const words = curataDiacritice(text).split(' ');
            let line = '';
            const lineHeight = 11;

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const testWidth = customFont.widthOfTextAtSize(testLine, size);
                if (testWidth > maxWidth && i > 0) {
                    if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                    page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                    y -= lineHeight;
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim().length > 0) {
                if (y < 80) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }
                page.drawText(line.trim(), { x: 45, y, size, font: customFont });
                y -= lineHeight;
            }
            y -= 4;
        };

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? curataDiacritice(el.value.trim()) : '';
        };

        const titluText = "PROCES-VERBAL DE PREDARE-PRIMIRE";
       const subTitluText = "Nr. .......... din ....................";

        let textWidth = fontBold.widthOfTextAtSize(titluText, 12);
        let centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(titluText), { x: centerX, y, size: 12, font: fontBold });
        y -= 15;

        textWidth = font.widthOfTextAtSize(subTitluText, 8.5);
        centerX = (595.28 - textWidth) / 2;
        page.drawText(curataDiacritice(subTitluText), { x: centerX, y, size: 8.5, font });
        y -= 25;

        deseneazaTitluSectiune("1. PARTILE CONTRACTANTE / PREDATOARE");
        deseneazaParagraf(`1.1. PREDATOR: ${getVal('pvPredatorNume') || '....................................'}, CUI/CNP: ${getVal('pvPredatorCuiCnp') || '................'}, Calitate: ${getVal('pvPredatorCalitate') || '................'}, cu sediul/domiciliul in ${getVal('pvPredatorAdresa') || '....................................'}.`);
        deseneazaParagraf(`1.2. PRIMITOR: ${getVal('pvPrimitorNume') || '....................................'}, CNP: ${getVal('pvPrimitorCnp') || '................'}, CI seria si nr: ${getVal('pvPrimitorAct') || '........'}, Functie/Departament: ${getVal('pvPrimitorFunctie') || '................'}, domiciliat in ${getVal('pvPrimitorAdresa') || '....................................'}.`);
        y -= 4;

        deseneazaTitluSectiune("2. TEMEIUL LEGAL SI CONTEXTUL");
        deseneazaParagraf(`Prezentul proces-verbal se incheie in temeiul: ${getVal('pvTemei') || 'In baza raporturilor juridice si a contractului de baza dintre parti'}.`);
        y -= 4;

        deseneazaTitluSectiune("3. OBIECTUL PREDARII-PRIMIRII (INVENTAR ACTIVE / ECHIPAMENTE)");
        deseneazaParagraf(`Predatorul preda, iar Primitorul preia in deplina folosinta / custodie urmatoarele bunuri, active sau echipamente, aflate in stare corespunzatoare de functionare:`);
        y -= 4;

        const inventarText = getVal('pvInventar') || '- Niciun bun specificat -';
        deseneazaParagraf(inventarText);
        y -= 4;

        deseneazaTitluSectiune("4. CONDITII DE UTILIZARE SI RASPUNDERE");
        deseneazaParagraf(`4.1. Primitorul confirma ca a verificat bunurile de mai sus, ca acestea corespund cantitativ si calitativ si ca le preia in buna stare.`);
        deseneazaParagraf(`4.2. Primitorul se obliga sa foloseasca activele conform destinatiei lor, sa le intretina corespunzator si sa suporte eventualele pagube produse din vina sa exclusiva prin neglijenta sau uz abuziv.`);
        deseneazaParagraf(`4.3. La incetarea raporturilor de munca sau la cererea Predatorului, Primitorul se obliga sa restituie bunurile in aceeasi stare in care le-a primit, exceptand uzura normala.`);
        y -= 20;

        if (y < 160) { deseneazaFooter(); page = pdfDoc.addPage([595.28, 841.89]); y = 780; }

        deseneazaTitluSectiune("SEMNATURILE PARTILOR:");
        y -= 4;

        const sigPredatorCanvas = document.getElementById('sigPvPredatorCanvas');
        const sigPrimitorCanvas = document.getElementById('sigPvPrimitorCanvas');
        
        if (sigPredatorCanvas && sigPredatorCanvas.offsetParent !== null) {
            const sigPBytes = await pdfDoc.embedPng(sigPredatorCanvas.toDataURL('image/png'));
            page.drawImage(sigPBytes, { x: 45, y: y - 50, width: 120, height: 40 });
        }
        if (sigPrimitorCanvas && sigPrimitorCanvas.offsetParent !== null) {
            const sigCBytes = await pdfDoc.embedPng(sigPrimitorCanvas.toDataURL('image/png'));
            page.drawImage(sigCBytes, { x: 310, y: y - 50, width: 120, height: 40 });
        }

        page.drawText(curataDiacritice("Semnatura Predator"), { x: 45, y: y - 62, size: 7.5, font: fontBold });
        page.drawText(curataDiacritice("Semnatura Primitor"), { x: 310, y: y - 62, size: 7.5, font: fontBold });

        deseneazaFooter();

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = "PROCES_VERBAL_PREDARE_PRIMIRE.pdf";
        a.click();

        if (typeof salveazaInArhivaprivata === 'function') {
            salveazaInArhivaprivata({ idAct: 'PV-' + Math.floor(1000 + Math.random()*9000), numeClient: getVal('pvPrimitorNume') || 'Primitor' });
        }
        arataNotificare(curataDiacritice("Procesul-Verbal de Predare-Primire a fost generat și descărcat cu succes!"));
    } catch(e) { arataNotificare("Eroare PDF Proces-Verbal: " + e.message, true); }
}

// ==========================================
// GENERATOR PDF: ACT ADIȚIONAL LA CIM (Conform ITM & Codul Muncii)
// ==========================================

async function genereazaActAditionalPDF() {
    try {
        if (typeof PDFLib === 'undefined') {
            arataNotificare("Erore: Librătia PDF-Lib nu este încărcată.", true);
            return;
        }

function deseneazaParagraf(page, text, x, y, maxWidth, fontSize, font, lineHeight) {
    if (!text) return y;
    // Înlocuiește \n cu spații sau împarte paragraful pe rânduri fizice
    const paragrafe = text.toString().split('\n');

    paragrafe.forEach(paragraf => {
        if (paragraf.trim() === "") {
            y -= lineHeight; // Lasă rând gol dacă există linie goală
            return;
        }
        const words = curataDiacritice(paragraf).split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxWidth && i > 0) {
                page.drawText(line.trim(), { x, y, size: fontSize, font, color: PDFLib.rgb(0.1, 0.1, 0.1) });
                y -= lineHeight;
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        if (line.trim().length > 0) {
            page.drawText(line.trim(), { x, y, size: fontSize, font, color: PDFLib.rgb(0.1, 0.1, 0.1) });
            y -= lineHeight;
        }
    });

    return y;
}
        
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595.28, 841.89]); // Format A4
        const { width, height } = page.getSize();

        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Colectare date complete formular
        const d = colecteazaDate();
        const angajator = curataDiacritice(d.actAngajator || 'SC BARBERHUB SRL');
        const salariat = curataDiacritice(d.actSalariat || 'DRAGUSANU MARIO');
        const cimNr = curataDiacritice(d.actCimNr || '45');
        const cimData = curataDiacritice(d.actCimData || '15.05.2025');
        const tipModificare = curataDiacritice(d.actTipModificare || 'SALARIU');
        const dataAplicarii = curataDiacritice(d.actDataAplicarii || '01.09.2026');
        const continutNou = curataDiacritice(d.actContinutNou || 'Modificarea clauzelor contractuale conform acordului părților.');
        const idUnic = 'ACT-' + Math.floor(1000 + Math.random() * 9000);

        let y = height - 40;

        // Antet Oficial & Antet Societate
        page.drawText(angajator, { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;
        page.drawText(curataDiacritice(`Înregistrat în Registrul de Evidență cu ID Unic: ${idUnic}`), { x: 50, y, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
        y -= 25;

        // Titlu Document
        page.drawText(curataDiacritice(`ACT ADIȚIONAL NR. 1`), { x: width / 2 - 70, y, size: 12, font: fontBold, color: rgb(0.05, 0.05, 0.3) });
        y -= 15;
        page.drawText(curataDiacritice(`la Contractul Individual de Muncă Nr. ${cimNr} din data de ${cimData}`), { x: width / 2 - 130, y, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        y -= 30;

        // Preambul Juridic Extins (Obligatoriu ITM)
        const preambulText = curataDiacritice(
            `Încheiat astăzi, ${dataAplicarii}, între:\n\n` +
            `1. Societatea ${angajator}, cu sediul social în România, reprezentată legal prin Administrator/Împuternicit, în calitate de Angajator, pe de o parte, și\n` +
            `2. Subsemnatul/a ${salariat}, posesor/oare al/a actului de identitate, în calitate de Salariat, pe de altă parte,\n\n` +
            `În temeiul prevederilor art. 41 din Legea nr. 53/2003 – Codul Muncii, republicată, cu modificările și completările ulterioare, intervenind acordul de voință al părților contractante, se încheie prezentul act adițional prin care se modifică clauzele contractuale după cum urmează:`
        );

        y = deseneazaParagraf(page, preambulText, 50, y, 495, 9, fontRegular, 13);
        y -= 12;

        // Articole Conținut
        let titluClauza = "MODIFICARE SALARIU DE BAZĂ";
        if (tipModificare === 'FUNCTIE') titluClauza = "MODIFICARE FUNCȚIE / COR";
        else if (tipModificare === 'PROGRAM') titluClauza = "MODIFICARE PROGRAM DE MUNCĂ / TIMP DE MUNCĂ";
        else if (tipModificare === 'LOC') titluClauza = "MODIFICARE LOC DE MUNCĂ";

        page.drawText(curataDiacritice(`Art. 1. Începând cu data de ${dataAplicarii}, clauza referitoare la ${titluClauza} din Contractul Individual de Muncă se modifică în mod expres și va avea următorul conținut:`), { x: 50, y, size: 9, font: fontBold, color: rgb(0, 0, 0) });
        y -= 16;

        y = deseneazaParagraf(page, `"${continutNou}"`, 70, y, 475, 9, fontRegular, 13);
        y -= 16;

        const art2Text = curataDiacritice(`Art. 2. Toate celelalte clauze, drepturi și obligații prevăzute în Contractul Individual de Muncă nr. ${cimNr} din ${cimData} care nu contravin prezentului act adițional rămân neschimbate, continuând să își producă efectele juridice de deplină valabilitate.`);
        y = deseneazaParagraf(page, art2Text, 50, y, 495, 9, fontRegular, 13);
        y -= 16;

        const art3Text = curataDiacritice(`Art. 3. Prezentul act adițional s-a întocmit și semnat în 2 (două) exemplare originale cu valoare juridică egală, câte unul pentru fiecare parte, urmând a fi comunicat Inspectoratului Teritorial de Muncă competent prin intermediul aplicației REGES / Revisal în termenele legale stabilite.`);
        y = deseneazaParagraf(page, art3Text, 50, y, 495, 9, fontRegular, 13);
        y -= 35;

        // Secțiune Semnături Oficiale
        page.drawText(curataDiacritice("ANGAJATOR,"), { x: 70, y, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(curataDiacritice("SALARIAT,"), { x: 350, y, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;

        page.drawText(angajator, { x: 70, y, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(salariat, { x: 350, y, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
        y -= 40;

        // Inserare semnături olografe din canvas dacă există
        const canvasAngajator = document.getElementById('sigActAngajatorCanvas');
        const canvasSalariat = document.getElementById('sigActSalariatCanvas');

        if (canvasAngajator) {
            try {
                const imgAngajatorData = canvasAngajator.toDataURL('image/png');
                const pngImageAngajator = await pdfDoc.embedPng(imgAngajatorData);
                page.drawImage(pngImageAngajator, { x: 70, y: y - 8, width: 110, height: 36 });
            } catch (err) { console.error("Eșec randare semnătură angajator"); }
        }

        if (canvasSalariat) {
            try {
                const imgSalariatData = canvasSalariat.toDataURL('image/png');
                const pngImageSalariat = await pdfDoc.embedPng(imgSalariatData);
                page.drawImage(pngImageSalariat, { x: 350, y: y - 8, width: 110, height: 36 });
            } catch (err) { console.error("Eșec randare semnătură salariat"); }
        }

        y -= 45;
        page.drawText(curataDiacritice("Reprezentant Legal / Administrator"), { x: 70, y, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
        page.drawText(curataDiacritice("Semnătura Olografă Salariat"), { x: 350, y, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

        deseneazaFooter();

        // Salvare și descărcare PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Act_Aditional_CIM_${salariat.replace(/\s+/g, '_')}.pdf`;
        link.click();

        arataNotificare("📥 Actul Adițional complet și conform ITM a fost descărcat cu succes!");
    } catch (e) {
        console.error(e);
        arataNotificare("Erore la generarea PDF-ului: " + e.message, true);
    }
}

// Inițializare canvas la încărcarea paginii pentru semnături
window.addEventListener('DOMContentLoaded', () => {
    initCanvasSemnatura('sigProprietarCanvas');
    initCanvasSemnatura('sigChiriasCanvas');
    initCanvasSemnatura('sigDemisieCanvas');
    initCanvasSemnatura('sigPvPredatorCanvas');
    initCanvasSemnatura('sigPvPrimitorCanvas');
});