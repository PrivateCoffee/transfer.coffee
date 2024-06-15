const client = new WebTorrent();

async function getRTCIceServers() {
  const response = await fetch("/turn-credentials");
  const data = await response.json();
  return data.iceServers;
}

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const uploadStats = document.getElementById("uploadStats");

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  const rtcConfig = {
    iceServers: await getRTCIceServers(),
  };

  const opts = {
    announce: [trackerUrl],
    rtcConfig: rtcConfig,
  };

  client.seed(file, opts, async (torrent) => {
    downloadSection.style.display = 'none';
    uploadSection.style.display = 'block';

    fetch(`/generate-mnemonic/${torrent.infoHash}`)
      .then((response) => response.json())
      .then((data) => {
        const uploadResult = document.getElementById("uploadResult");
        uploadResult.innerHTML = `File uploaded. Share this mnemonic: <strong>${data.mnemonic}</strong>`;
      });

    let totalPeers = 0;
    const seenPeers = new Set();

    setInterval(async () => {
      for (const wire of torrent.wires) {
        let peerIdHash;
        try {
          peerIdHash = await sha256(wire.peerId);
        } catch (e) {
          peerIdHash = wire.peerId;
        }

        if (!seenPeers.has(peerIdHash)) {
          seenPeers.add(peerIdHash);
          totalPeers += 1;
        }
      }

      const uploaded = (torrent.uploaded / (1024 * 1024)).toFixed(2);
      uploadStats.innerHTML = `Uploaded: ${uploaded} MB to ${totalPeers} peer(s)`;
    }, 1000);
  });
}

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function downloadFile() {
  const mnemonicInput = document.getElementById("mnemonicInput").value;
  const downloadProgressBar = document.getElementById("downloadProgressBar");

  if (!mnemonicInput) {
    alert("Please enter a mnemonic.");
    return;
  }

  const rtcConfig = {
    iceServers: await getRTCIceServers(),
  };

  fetch(`/get-infohash/${mnemonicInput}`)
    .then((response) => response.json())
    .then((data) => {
      const torrentId = data.infoHash;

      const opts = {
        announce: [trackerUrl],
        rtcConfig: rtcConfig,
      };

      client.add(torrentId, opts, (torrent) => {
        downloadSection.style.display = 'block';
        uploadSection.style.display = 'none';

        torrent.files[0].getBlob((err, blob) => {
          if (err) {
            const downloadResult = document.getElementById("downloadResult");
            downloadResult.innerHTML = `Error: ${err.message}`;
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = torrent.files[0].name;
          a.click();

          const downloadResult = document.getElementById("downloadResult");
          downloadResult.innerHTML = `File downloaded: <strong>${torrent.files[0].name}</strong>`;
        });

        torrent.on("download", () => {
          const progress = Math.round(
            (torrent.downloaded / torrent.length) * 100
          );
          downloadProgressBar.style.width = `${progress}%`;
          downloadProgressBar.textContent = `${progress}%`;
        });
      });
    });
}
