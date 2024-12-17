const client = new WebTorrent();

async function getRTCIceServers() {
  try {
    const response = await fetch("/turn-credentials");
    if (!response.ok) throw new Error("Failed to fetch TURN credentials");
    const data = await response.json();
    return data.iceServers;
  } catch (error) {
    console.error("Error getting ICE servers:", error);
  }
}

async function uploadFile(trackerUrl) {
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

  try {
    const rtcConfig = {
      iceServers: await getRTCIceServers(),
    };

    const opts = {
      announce: [trackerUrl],
      rtcConfig: rtcConfig,
    };

    client.seed(file, opts, async (torrent) => {
      try {
        const response = await fetch(`/generate-mnemonic/${torrent.infoHash}`);
        if (!response.ok) throw new Error("Failed to generate mnemonic");
        const data = await response.json();
        const uploadResult = document.getElementById("uploadResult");
        const downloadUrl = `${window.location.origin
          }/${data.mnemonic.replaceAll(" ", ".")}`;
        history.pushState({}, "", `/${data.mnemonic.replaceAll(" ", ".")}`);
        uploadResult.innerHTML = `Seeding file. Share this mnemonic: <strong>${data.mnemonic}</strong>
        <br>Note that the file will be available for download only as long as you keep this page open.`;
        copyButton.style.display = "inline-block";
        copyButton.setAttribute("data-url", downloadUrl);
      } catch (error) {
        console.error("Error generating mnemonic:", error);
        alert("Failed to generate mnemonic. Please try again.");
      }

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
  } catch (error) {
    console.error("Error sharing file:", error);
  }
}

function copyToClipboard() {
  const copyButton = document.getElementById("copyButton");
  const url = copyButton.getAttribute("data-url");
  navigator.clipboard.writeText(url).catch((err) => {
    console.error("Failed to copy: ", err);
    alert("Failed to copy URL to clipboard. Please try again.");
  });
}

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function downloadFile(trackerUrl) {
  const mnemonicInput = document.getElementById("mnemonicInput").value;
  const downloadProgressBar = document.getElementById("downloadProgressBar");
  const downloadButton = document.getElementById("downloadButton");
  const downloadResult = document.getElementById("downloadResult");

  if (!mnemonicInput) {
    alert("Please enter a mnemonic.");
    return;
  }

  downloadSection.style.display = "block";
  uploadSection.style.display = "none";
  downloadButton.disabled = true;

  downloadResult.innerHTML = "Preparing incoming file transfer, please wait...";

  try {
    const rtcConfig = {
      iceServers: await getRTCIceServers(),
    };

    const response = await fetch(`/get-infohash/${mnemonicInput}`);
    if (!response.ok) throw new Error("Failed to get infoHash");
    const data = await response.json();
    const torrentId = data.infoHash;

    const opts = {
      announce: [trackerUrl],
      rtcConfig: rtcConfig,
    };

    client.add(torrentId, opts, (torrent) => {
      torrent.files[0].getBlob((err, blob) => {
        if (err) {
          downloadResult.innerHTML = `Error: ${err.message}`;
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = torrent.files[0].name;
        a.click();

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
      if (client.get(torrentId)) {
        const torrent = client.get(torrentId);
        const progress = Math.round(
          (torrent.downloaded / torrent.length) * 100
        );
        downloadResult.innerHTML = `Downloading:
        <strong>${torrent.files[0].name}</strong>
        <br>
        <br><strong>Status:</strong> ${torrent.done ? "Completed, seeding" : "Downloading"
          }
        <br><strong>Peers:</strong> ${torrent.numPeers}
        <br>
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
        <br><strong>ETA:</strong> ${(torrent.timeRemaining / 1000).toFixed(0)} seconds
        <br>
        <br><strong>Uploaded:</strong> ${(
            torrent.uploaded /
            (1024 * 1024)
          ).toFixed(2)} MB
        <br><strong>Ratio:</strong> ${torrent.ratio.toFixed(2)}`;
        return;
      }

      downloadResult.innerHTML = "File not found. Please check the mnemonic.";
    }, 1000);
  } catch (error) {
    console.error("Error downloading file:", error);
    alert("Failed to download file. Please check the mnemonic and try again.");
  } finally {
    downloadButton.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const configElement = document.getElementById("config");
  const trackerUrl = configElement.getAttribute("data-tracker-url");
  const mnemonic = configElement.getAttribute("data-mnemonic");

  document
    .getElementById("uploadButton")
    .addEventListener("click", () => uploadFile(trackerUrl));
  document
    .getElementById("copyButton")
    .addEventListener("click", copyToClipboard);
  document
    .getElementById("downloadButton")
    .addEventListener("click", () => downloadFile(trackerUrl));

  if (mnemonic) {
    const mnemonicInput = document.getElementById("mnemonicInput");
    const downloadButton = document.getElementById("downloadButton");
    mnemonicInput.value = mnemonic;
    downloadButton.click();
  }
});
