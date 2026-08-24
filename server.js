const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());

// Permite serverului să afișeze fișierele HTML/CSS din folderul curent
app.use(express.static(__dirname));

// Bază de date temporară în memoria serverului
const tranzactiiDB = {};

// 1. Ruta prin care se creează o tranzacție nouă
app.post('/api/creeaza-tranzactie', (req, res) => {
    const sessionId = 'TR_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    tranzactiiDB[sessionId] = req.body;
    
    res.json({ 
        success: true, 
        sessionId, 
        url: `http://localhost:3000/?sessionId=${sessionId}` 
    });
});

// 2. Ruta prin care se preiau datele după codul de sesiune
app.get('/api/obtine-tranzactie/:id', (req, res) => {
    const data = tranzactiiDB[req.params.id];
    if (data) {
        res.json({ success: true, data });
    } else {
        res.status(404).json({ success: false, message: "Tranzacția nu a fost găsită." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serverul rulează cu succes pe portul ${PORT}`);
});