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
  const uploadSection = document.getElementById("uploadSection");
  const downloadSection = document.getElementById("downloadSection");
  const copyButton = document.getElementById("copyButton");
  const uploadButton = document.getElementById("uploadButton");

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  downloadSection.style.display = "none";
  uploadSection.style.display = "block";
  uploadButton.disabled = true;

  const rtcConfig = {
    iceServers: await getRTCIceServers(),
  };

  const opts = {
    announce: [trackerUrl],
    rtcConfig: rtcConfig,
  };

  client.seed(file, opts, async (torrent) => {
    fetch(`/generate-mnemonic/${torrent.infoHash}`)
      .then((response) => response.json())
      .then((data) => {
        const uploadResult = document.getElementById("uploadResult");
        const downloadUrl = `${
          window.location.origin
        }/${data.mnemonic.replaceAll(" ", ".")}`;
        history.pushState({}, "", `/${data.mnemonic.replaceAll(" ", ".")}`);
        uploadResult.innerHTML = `Seeding file. Share this mnemonic: <strong>${data.mnemonic}</strong>
        <br>Note that the file will be available for download only as long as you keep this page open.`;
        copyButton.style.display = "inline-block";
        copyButton.setAttribute("data-url", downloadUrl);
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

function copyToClipboard() {
  const copyButton = document.getElementById("copyButton");
  const url = copyButton.getAttribute("data-url");
  navigator.clipboard
    .writeText(url)
    .then(() => {
      alert("URL copied to clipboard");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
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
  const downloadButton = document.getElementById("downloadButton");

  if (!mnemonicInput) {
    alert("Please enter a mnemonic.");
    return;
  }

  downloadSection.style.display = "block";
  uploadSection.style.display = "none";
  downloadButton.disabled = true;

  downloadResult.innerHTML = "Preparing incoming file transfer, please wait...";

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

      setInterval(() => {
        const downloadResult = document.getElementById("downloadResult");

        if (client.get(torrentId)) {
          const torrent = client.get(torrentId);
          const progress = Math.round(
            (torrent.downloaded / torrent.length) * 100
          );
          downloadResult.innerHTML = `Downloading:
          <strong>${torrent.files[0].name}</strong>
          <br>
          <br><strong>Status:</strong> ${
            torrent.done ? "Completed, seeding" : "Downloading"
          }
          <br><strong>Peers:</strong> ${torrent.numPeers}
          <br><strong>Downloaded:</strong> ${(
            torrent.downloaded /
            (1024 * 1024)
          ).toFixed(2)} MB / ${(torrent.length / (1024 * 1024)).toFixed(
            2
          )} MB (${progress}%)
          <br><strong>Speed:</strong> ${(
            torrent.downloadSpeed /
            (1024 * 1024)
          ).toFixed(2)} MB/s
          <br><strong>ETA:</strong> ${torrent.timeRemaining} seconds
          <br><strong>Uploaded:</strong> ${(
            torrent.uploaded /
            (1024 * 1024)
          ).toFixed(2)} MB
          <br><strong>Ratio:</strong> ${torrent.ratio.toFixed(2)}`;
          return;
        }

        downloadResult.innerHTML = "File not found. Please check the mnemonic.";
      }, 1000);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  if (mnemonic) {
    const mnemonicInput = document.getElementById("mnemonicInput");
    const downloadButton = document.getElementById("downloadButton");
    mnemonicInput.value = mnemonic;
    downloadButton.click();
  }
});
