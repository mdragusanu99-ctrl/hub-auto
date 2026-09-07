// ==========================================
// PDF-GENERATOR.JS - Generare Oficială Completă pentru Toate cele 7 Documente
// ==========================================

function curataDiacritice(text) {
    if (!text) return '';
    return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[ăâ]/g, 'a').replace(/[ĂÂ]/g, 'A')
        .replace(/î/g, 'i').replace(/Î/g, 'I')
        .replace(/[șş]/g, 's').replace(/[ȘŞ]/g, 'S')
        .replace(/[țţ]/g, 't').replace(/[ȚŢ]/g, 'T');
}

// 1. Contract Vânzare-Cumpărare Auto (ITL 054)
async function genereazaContractOficialPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("CONTRACT DE VANZARE-CUMPARARE PENTRU AUTOVEHICUL (ITL 054)"), { x: 45, y, size: 11, font: fontBold });
        y -= 30;

        page.drawText(curataDiacritice("I. DATE PARTI CONTRACTANTE"), { x: 45, y, size: 9.5, font: fontBold });
        y -= 18;
        page.drawText(curataDiacritice(`Vanzator: ${d.sellerName}, CNP/CUI: ${d.sellerCnp}`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Domiciliu: Jud. ${d.sellerCounty}, Loc. ${d.sellerCity}, ${d.sellerAddress}, CI seria ${d.sellerIdSeries} nr. ${d.sellerIdNumber}`), { x: 45, y, size: 8.5, font });
        y -= 20;
        page.drawText(curataDiacritice(`Cumparator: ${d.buyerName}, CNP/CUI: ${d.buyerCnp}`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Domiciliu: Jud. ${d.buyerCounty}, Loc. ${d.buyerCity}, ${d.buyerAddress}, CI seria ${d.buyerIdSeries} nr. ${d.buyerIdNumber}`), { x: 45, y, size: 8.5, font });
        
        y -= 25;
        page.drawText(curataDiacritice("II. OBIECTUL CONTRACTULUI"), { x: 45, y, size: 9.5, font: fontBold });
        y -= 18;
        page.drawText(curataDiacritice(`Autovehiculul: Marca ${d.vehicleMake}, Model ${d.vehicleModel}`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Serie sasiu (VIN): ${d.chassisSeries} | Serie motor: ${d.engineSeries}`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Capacitate cilindrica: ${d.cylinderCapacity} cmc | Greutate maxima: ${d.maxWeight} kg`), { x: 45, y, size: 8.5, font });
        
        y -= 25;
        page.drawText(curataDiacritice("III. PRETUL SI MODALITATEA DE PLATA"), { x: 45, y, size: 9.5, fontBold });
        y -= 18;
        page.drawText(curataDiacritice(`Pret vanzare: ${d.contractPrice} ${d.contractCurrency} achitat integral la data semnarii.`), { x: 45, y, size: 8.5, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "CONTRACT_VANZARE_CUMPARARE_AUTO_ITL054.pdf";
        a.click();
        arataNotificare("✅ Contract auto generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Auto: " + e.message, true); }
}

// 2. Contract Închiriere Locuință
async function genereazaContractImobiliarPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("CONTRACT DE INCHIRIERE LOCUINTA"), { x: 45, y, size: 11, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Locator (Proprietar): ${d.proprietarNume}, CNP: ${d.proprietarCnp}, CI: ${d.proprietarAct}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Locatar (Chirias): ${d.chiriasNume}, CNP: ${d.chiriasCnp}, CI: ${d.chiriasAct}`), { x: 45, y, size: 8.5, font });
        y -= 22;
        page.drawText(curataDiacritice(`Adresa imobil inchiriat: ${d.imobilAdresa}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Chirie lunara: ${d.imobilChirie} ${d.imobilMoneda}`), { x: 45, y, size: 8.5, fontBold });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "CONTRACT_INCHIRIERE_LOCUINTA.pdf";
        a.click();
        arataNotificare("✅ Contract închiriere generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Imobiliar: " + e.message, true); }
}

// 3. Declarație Scoatere din Evidență Auto (ITL-016)
async function genereazaItl016PDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("DECLARATIE FISCALA PENTRU SCOATEREA DIN EVIDENTA A MIJLOACELOR DE TRANSPORT (ITL-016)"), { x: 45, y, size: 10, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Subsemnatul/a: ${d.itlContribuabilNume}, CNP: ${d.itlContribuabilCnp}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Act identitate: ${d.itlContribuabilAct} | Adresa: ${d.itlContribuabilAdresa}`), { x: 45, y, size: 8.5, font });
        y -= 22;
        page.drawText(curataDiacritice("Solicit scoaterea din evidenta fiscala a autovehiculului:"), { x: 45, y, size: 8.5, fontBold });
        y -= 18;
        page.drawText(curataDiacritice(`Marca: ${d.itlAutoMarca} | Serie motor: ${d.itlAutoMotor}`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Serie sasiu (VIN): ${d.itlAutoVin} | Capacitate: ${d.itlAutoCapacitate} cmc`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Data dobandirii / instrainarii: ${d.itlAutoDataDobandirii}`), { x: 45, y, size: 8.5, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "DECLARATIE_ITL_016.pdf";
        a.click();
        arataNotificare("✅ Declarația ITL-016 generată cu succes!");
    } catch(e) { arataNotificare("Eroare PDF ITL-016: " + e.message, true); }
}

// 4. Declarație Fiscală Impunere Auto (ITL-005)
async function genereazaItl005PDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("DECLARATIE FISCALA PENTRU STABILIREA IMPOZITULUI PE MIJLOACELE DE TRANSPORT (ITL-005)"), { x: 45, y, size: 10, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Contribuabil (${d.itl005TipContribuabil.toUpperCase()}): ${d.itl005Nume}, CNP/CUI: ${d.itl005Cnp}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Adresa sediu/domiciliu: ${d.itl005Adresa}`), { x: 45, y, size: 8.5, font });
        y -= 22;
        page.drawText(curataDiacritice("Date autovehicul supus impunerii:"), { x: 45, y, size: 8.5, fontBold });
        y -= 18;
        page.drawText(curataDiacritice(`Marca/Tip: ${d.itl005Marca} | An fabricatie: ${d.itl005An}`), { x: 45, y, size: 8.5, font });
        y -= 15;
        page.drawText(curataDiacritice(`Serie sasiu (VIN): ${d.itl005Vin} | Capacitate cilindrica: ${d.itl005Capacitate} cmc`), { x: 45, y, size: 8.5, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "DECLARATIE_ITL_005.pdf";
        a.click();
        arataNotificare("✅ Declarația ITL-005 generată cu succes!");
    } catch(e) { arataNotificare("Eroare PDF ITL-005: " + e.message, true); }
}

// 5. Contract Comodat Auto
async function genereazaContractComodatAutoPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("CONTRACT DE COMODAT AUTO (IMPRUMUT DE FOLOSINTA)"), { x: 45, y, size: 11, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Comodant (Proprietar): ${d.comodantAutoNume}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Comodatar (Utilizator): ${d.comodatarAutoNume}`), { x: 45, y, size: 8.5, font });
        y -= 22;
        page.drawText(curataDiacritice("Prin prezentul contract, comodantul imprumuta cu titlu gratuit autovehiculul catre comodatar."), { x: 45, y, size: 8.5, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "CONTRACT_COMODAT_AUTO.pdf";
        a.click();
        arataNotificare("✅ Contract comodat auto generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Comodat Auto: " + e.message, true); }
}

// 6. Contract Comodat Imobil / Sediu Social
async function genereazaContractComodatImobilPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("CONTRACT DE COMODAT IMOBIL / SEDIU SOCIAL"), { x: 45, y, size: 11, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Comodant (Proprietar imobil): ${d.comodantImobilNume}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Comodatar (Beneficiar / Firma): ${d.comodatarImobilNume}`), { x: 45, y, size: 8.5, font });
        y -= 22;
        page.drawText(curataDiacritice("Imobilul face obiectul comodatului cu destinatia de sediu social / locuinta."), { x: 45, y, size: 8.5, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "CONTRACT_COMODAT_IMOBIL.pdf";
        a.click();
        arataNotificare("✅ Contract comodat imobil generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Comodat Imobil: " + e.message, true); }
}

// 7. Proces-Verbal Predare-Primire Locuință
async function genereazaProcesVerbalLocuintaPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("PROCES-VERBAL DE PREDARE-PRIMIRE LOCUINTA"), { x: 45, y, size: 11, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Locator (Proprietar): ${d.pvProprietarNume}`), { x: 45, y, size: 8.5, font });
        y -= 18;
        page.drawText(curataDiacritice(`Locatar (Chirias): ${d.pvChiriasNume}`), { x: 45, y, size: 8.5, font });
        y -= 22;
        page.drawText(curataDiacritice(`Inventar bunuri predate: ${d.pvInventarBunuri}`), { x: 45, y, size: 8.5, fontBold });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "PROCES_VERBAL_LOCUINTA.pdf";
        a.click();
        arataNotificare("✅ Proces-verbal locuință generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF PV Locuință: " + e.message, true); }
}