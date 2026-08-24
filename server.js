const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Configurare Supabase cu datele proiectului tău
const supabaseUrl = 'https://bwpvggvpcwhfqunpprcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHZnZ3ZwY3doZnF1bnBwcmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjgwMTMsImV4cCI6MjEwMzE0NDAxM30.35xH1V2ZJ3w07HKLQGNUiLQnIVHisqD2QYSsjiq8Guo';
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Salvare tranzacție direct în baza de date Supabase
app.post('/api/creeaza-tranzactie', async (req, res) => {
    try {
        const sessionId = 'TR_' + Math.random().toString(36).substring(2, 9).toUpperCase();
        const tranzactieData = req.body;

        // Inserare în tabelul 'tranzactii' din Supabase
        const { error } = await supabase
            .from('tranzactii')
            .insert([{ id: sessionId, data: tranzactieData }]);

        if (error) {
            console.error("Eroare Supabase la inserare:", error);
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ 
            success: true, 
            sessionId, 
            url: `/?sessionId=${sessionId}` 
        });
    } catch (err) {
        console.error("Eroare server:", err);
        res.status(500).json({ success: false, message: "Eroare internă de server." });
    }
});

// 2. Preluare tranzacție din baza de date Supabase după codul de sesiune
app.get('/api/obtine-tranzactie/:id', async (req, res) => {
    try {
        const sessionId = req.params.id;

        // Căutare în tabelul 'tranzactii' după id
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
        console.error("Eroare server:", err);
        res.status(500).json({ success: false, message: "Eroare internă de server." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serverul rulează cu succes pe portul ${PORT}`);
});