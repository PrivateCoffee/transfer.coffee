import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bip39 from "bip39";
import crypto from "crypto";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const trackerUrl = process.env.TRACKER_URL || "ws://localhost:8106";
const stunServerUrl = process.env.STUN_SERVER_URL;
const turnServerUrl = process.env.TURN_SERVER_URL;
const turnSecret = process.env.TURN_SECRET;
const turnTTL = 86400;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", trackerUrl],
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isValidInfoHash = (infoHash) => /^[0-9a-fA-F]{40}$/.test(infoHash);

app.get("/generate-mnemonic/:infoHash", (req, res) => {
  const infoHash = req.params.infoHash;

  if (!isValidInfoHash(infoHash)) {
    return res.status(400).json({ error: "Invalid infoHash" });
  }

  try {
    const mnemonic = bip39.entropyToMnemonic(infoHash);
    res.json({ mnemonic });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate mnemonic" });
  }
});

app.get("/get-infohash/:mnemonic", (req, res) => {
  const mnemonic = req.params.mnemonic;

  if (!bip39.validateMnemonic(mnemonic)) {
    return res.status(400).json({ error: "Invalid mnemonic" });
  }

  try {
    const infoHash = bip39.mnemonicToEntropy(mnemonic);
    res.json({ infoHash });
  } catch (error) {
    res.status(500).json({ error: "Failed to get infoHash" });
  }
});

app.get("/turn-credentials", (req, res) => {
  const iceServers = [];

  if (stunServerUrl) {
    iceServers.push({ urls: stunServerUrl });
  }

  if (turnServerUrl && turnSecret) {
    try {
      const unixTimeStamp = Math.floor(Date.now() / 1000) + turnTTL;
      const username = `${unixTimeStamp}:transfercoffee`;
      const hmac = crypto.createHmac("sha1", turnSecret);
      hmac.update(username);
      const credential = hmac.digest("base64");

      iceServers.push({
        urls: turnServerUrl,
        username: username,
        credential: credential,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to generate TURN credentials" });
    }
  }

  res.json({ iceServers });
});

app.get("/:mnemonic?", (req, res) => {
  let mnemonic = req.params.mnemonic || "";

  if (mnemonic) {
    mnemonic = mnemonic.replaceAll(".", " ").trim();

    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).send("Invalid mnemonic");
    }
  }

  res.render("index", { trackerUrl, mnemonic });
});

const PORT = process.env.PORT || 8105;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
