const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const supabaseUrl = 'https://bwpvggvpcwhfqunpprcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHZnZ3ZwY3doZnF1bnBwcmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjgwMTMsImV4cCI6MjEwMzE0NDAxM30.35xH1V2ZJ3w07HKLQGNUiLQnIVHisqD2QYSsjiq8Guo';
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Creare sesiune nouă (Pasul vânzătorului)
app.post('/api/creeaza-tranzactie', async (req, res) => {
    try {
        const sessionId = 'TR_' + Math.random().toString(36).substring(2, 9).toUpperCase();
        const tranzactieData = {
            ...req.body,
            status: 'ASTEAPTA_CUMPARATOR', // Stare High-Tech
            createdAt: new Date().toISOString()
        };

        const { error } = await supabase
            .from('tranzactii')
            .insert([{ id: sessionId, data: tranzactieData }]);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, sessionId });
    } catch (err) {
        res.status(500).json({ success: false, message: "Eroare internă de server." });
    }
});

// 2. Actualizare sesiune (Când cumpărătorul își completează datele)
app.post('/api/actualizeaza-tranzactie/:id', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const buyerData = req.body;

        // Preluăm datele existente ale vânzătorului
        const { data: existing, error: fetchErr } = await supabase
            .from('tranzactii')
            .select('data')
            .eq('id', sessionId)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ success: false, message: "Sesiunea nu a fost găsită." });
        }

        // Combinăm datele vechi (vânzător/mașină) cu datele noi ale cumpărătorului și schimbăm starea
        const updatedData = {
            ...existing.data,
            ...buyerData,
            status: 'COMPLETAT_GATA_CONTRACT'
        };

        const { error: updateErr } = await supabase
            .from('tranzactii')
            .update({ data: updatedData })
            .eq('id', sessionId);

        if (updateErr) {
            return res.status(500).json({ success: false, message: updateErr.message });
        }

        res.json({ success: true, message: "Datele cumpărătorului au fost salvate cu succes!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Eroare internă de server." });
    }
});

// 3. Preluare tranzacție
app.get('/api/obtine-tranzactie/:id', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { data, error } = await supabase
            .from('tranzactii')
            .select('data')
            .eq('id', sessionId)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: "Tranzacția nu a fost găsită." });
        }

        res.json({ success: true, data: data.data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Eroare internă de server." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serverul rulează pe portul ${PORT}`);
});