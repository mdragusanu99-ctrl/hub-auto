// ==========================================
// PDF-GENERATOR.JS - Generare Fișiere PDF Oficiale
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

// 1. Contract Vânzare-Cumpărare Auto
async function genereazaContractOficialPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("CONTRACT DE VANZARE-CUMPARARE AUTO (ITL 054)"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;

        page.drawText(curataDiacritice(`Vanzator: ${d.sellerName} | CNP: ${d.sellerCnp} | Adresa: ${d.sellerAddress}, ${d.sellerCity}`), { x: 45, y, size: 8.5, font });
        y -= 20;
        page.drawText(curataDiacritice(`Cumparator: ${d.buyerName} | CNP: ${d.buyerCnp} | Adresa: ${d.buyerAddress}, ${d.buyerCity}`), { x: 45, y, size: 8.5, font });
        y -= 25;
        page.drawText(curataDiacritice(`Autovehicul: ${d.vehicleMake} ${d.vehicleModel} | VIN: ${d.chassisSeries} | Pret: ${d.contractPrice}`), { x: 45, y, size: 8.5, fontBold });

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

        page.drawText(curataDiacritice("CONTRACT DE INCHIRIERE LOCUINTA"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Locator: ${d.proprietarNume} | Chirias: ${d.chiriasNume}`), { x: 45, y, size: 9, font });
        y -= 20;
        page.drawText(curataDiacritice(`Imobil: ${d.imobilAdresa} | Chirie: ${d.imobilChirie} | Garantie: ${d.imobilGarantie}`), { x: 45, y, size: 9, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "CONTRACT_INCHIRIERE_LOCUINTA.pdf";
        a.click();
        arataNotificare("✅ Contract închiriere generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Imobiliar: " + e.message, true); }
}

// 3. Declarație Fiscală ITL-016
async function genereazaItl016PDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("DECLARATIE SCOATERE DIN EVIDENTA AUTO (ITL-016)"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Contribuabil: ${d.itlContribuabilNume} | CNP: ${d.itlContribuabilCnp}`), { x: 45, y, size: 9, font });
        y -= 20;
        page.drawText(curataDiacritice(`Auto VIN: ${d.itlAutoVin} | Marca: ${d.itlAutoMarca}`), { x: 45, y, size: 9, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "DECLARATIE_ITL_016.pdf";
        a.click();
        arataNotificare("✅ Declarația ITL-016 generată cu succes!");
    } catch(e) { arataNotificare("Eroare PDF ITL-016: " + e.message, true); }
}

// 4. Declarație Fiscală ITL-005
async function genereazaItl005PDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("DECLARATIE FISCALA IMPUNERE AUTO (ITL-005)"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Contribuabil: ${d.itl005Nume} | CNP/CUI: ${d.itl005Cnp}`), { x: 45, y, size: 9, font });
        y -= 20;
        page.drawText(curataDiacritice(`Vehicul: ${d.itl005Marca} | VIN: ${d.itl005Vin}`), { x: 45, y, size: 9, font });

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

        page.drawText(curataDiacritice("CONTRACT DE COMODAT AUTO"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Comodant: ${d.comodantAutoNume} | Comodatar: ${d.comodatarAutoNume}`), { x: 45, y, size: 9, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "CONTRACT_COMODAT_AUTO.pdf";
        a.click();
        arataNotificare("✅ Contract comodat auto generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF Comodat Auto: " + e.message, true); }
}

// 6. Contract Comodat Imobil
async function genereazaContractComodatImobilPDF() {
    try {
        const { PDFDocument, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595.28, 841.89]);
        let y = 780;
        const d = colecteazaDate();

        page.drawText(curataDiacritice("CONTRACT DE COMODAT IMOBIL / SEDIU SOCIAL"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Comodant: ${d.comodantImobilNume} | Comodatar: ${d.comodatarImobilNume}`), { x: 45, y, size: 9, font });

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

        page.drawText(curataDiacritice("PROCES-VERBAL PREDARE-PRIMIRE LOCUINTA"), { x: 45, y, size: 12, font: fontBold });
        y -= 30;
        page.drawText(curataDiacritice(`Locator: ${d.pvProprietarNume} | Locatar: ${d.pvChiriasNume}`), { x: 45, y, size: 9, font });
        y -= 20;
        page.drawText(curataDiacritice(`Inventar bunuri: ${d.pvInventarBunuri}`), { x: 45, y, size: 9, font });

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "PROCES_VERBAL_LOCUINTA.pdf";
        a.click();
        arataNotificare("✅ Proces-verbal locuință generat cu succes!");
    } catch(e) { arataNotificare("Eroare PDF PV Locuință: " + e.message, true); }
}