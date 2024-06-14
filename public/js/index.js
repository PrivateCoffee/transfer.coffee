const client = new WebTorrent();

function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const uploadProgressBar = document.getElementById("uploadProgressBar");

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  const opts = {
    announce: [trackerUrl],
  };

  client.seed(file, opts, (torrent) => {
    fetch(`/generate-mnemonic/${torrent.infoHash}`)
      .then((response) => response.json())
      .then((data) => {
        const uploadResult = document.getElementById("uploadResult");
        uploadResult.innerHTML = `Started sharing file. Share this mnemonic: <strong>${data.mnemonic}</strong>
        <br>Note that the file will be available for download as long as this page is open.
        `;
      });

    torrent.on("upload", () => {
      const progress = Math.round((torrent.uploaded / torrent.length) * 100);
      uploadProgressBar.style.width = `${progress}%`;
      uploadProgressBar.textContent = `${progress}%`;
    });
  });
}

function downloadFile() {
  const mnemonicInput = document.getElementById("mnemonicInput").value;
  const downloadProgressBar = document.getElementById("downloadProgressBar");

  if (!mnemonicInput) {
    alert("Please enter a mnemonic.");
    return;
  }

  fetch(`/get-infohash/${mnemonicInput}`)
    .then((response) => response.json())
    .then((data) => {
      const torrentId = data.infoHash;

      const opts = {
        announce: [trackerUrl],
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
    });
}
