export function initUploadZone(zoneId, allowedExts = []) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  const input = zone.querySelector("input[type=file]");
  const instructions = zone.querySelector(".upload-instructions"); // <--- grab instructions
  const preview = document.createElement("div");
  preview.className = "upload-preview";
  zone.appendChild(preview);

  // clicking anywhere triggers file dialog
  zone.addEventListener("click", () => input.click());

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("dragover");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (allowedExts.length && !allowedExts.includes(ext)) {
      alert(`Invalid file type. Allowed: ${allowedExts.join(", ")}`);
      input.value = "";
      return;
    }

    // hide instructions
    if (instructions) instructions.style.display = "none";

    preview.innerHTML = ""; // clear old preview

    const wrapper = document.createElement("div");
    wrapper.className = "preview-wrapper";

    const fileName = document.createElement("div");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    let filePreview;
    if (ext.match(/\.(png|jpe?g)$/)) {
      filePreview = document.createElement("img");
      filePreview.src = URL.createObjectURL(file);
      filePreview.className = "preview-img";
    } else if (ext.match(/\.(mp3|wav)$/)) {
      filePreview = document.createElement("div");
      filePreview.className = "audio-icon";
      filePreview.textContent = "🎵";
    } else if (ext.match(/\.(txt|pdf)$/)) {
      filePreview = document.createElement("div");
      filePreview.className = "paper-snippet";
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result
          .toString()
          .split(/\s+/)
          .slice(0, 30)
          .join(" ");
        filePreview.innerHTML = `<p>${text}...</p>`;
      };
      reader.readAsText(file);
    } else {
      filePreview = document.createElement("div");
      filePreview.className = "generic-icon";
      filePreview.textContent = "📄";
    }

    wrapper.appendChild(filePreview);
    wrapper.appendChild(fileName);

    const changeLink = document.createElement("a");
    changeLink.href = "#";
    changeLink.className = "choose-different";
    changeLink.textContent = "Choose a Different File";
    changeLink.addEventListener("click", (e) => {
      e.preventDefault();
      input.click();
    });

    preview.appendChild(wrapper);
    preview.appendChild(changeLink);
  }
}
