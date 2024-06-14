import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bip39 from 'bip39';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const trackerUrl = process.env.TRACKER_URL || 'ws://localhost:8106';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { trackerUrl });
});

app.get('/generate-mnemonic/:infoHash', (req, res) => {
    const infoHash = req.params.infoHash;
    const mnemonic = bip39.entropyToMnemonic(infoHash);
    res.json({ mnemonic });
});

app.get('/get-infohash/:mnemonic', (req, res) => {
    const mnemonic = req.params.mnemonic;
    const infoHash = bip39.mnemonicToEntropy(mnemonic);
    res.json({ infoHash });
});

const PORT = process.env.PORT || 8105;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});