import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bip39 from 'bip39';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const trackerUrl = process.env.TRACKER_URL || 'ws://localhost:8106';
const stunServerUrl = process.env.STUN_SERVER_URL;
const turnServerUrl = process.env.TURN_SERVER_URL;
const turnSecret = process.env.TURN_SECRET;
const turnTTL = 86400;

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

app.get('/turn-credentials', (req, res) => {
    const iceServers = [];

    if (stunServerUrl) {
        iceServers.push({ urls: stunServerUrl });
    }

    if (turnServerUrl && turnSecret) {
        const unixTimeStamp = Math.floor(Date.now() / 1000) + turnTTL;
        const username = `${unixTimeStamp}:transfercoffee`;
        const hmac = crypto.createHmac('sha1', turnSecret);
        hmac.update(username);
        const credential = hmac.digest('base64');

        iceServers.push({
            urls: turnServerUrl,
            username: username,
            credential: credential
        });
    }

    res.json({ iceServers });
});

const PORT = process.env.PORT || 8105;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});