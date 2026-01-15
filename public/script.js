let userId = localStorage.getItem("user_id");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("user_id", userId);
}

const dropArea = document.getElementById("drop-area");
const fileElem = document.getElementById("fileElem");
const fileSelect = document.getElementById("fileSelect");
const gallery = document.getElementById("gallery");

fileSelect.addEventListener("click", () => fileElem.click());
fileElem.addEventListener("change", () => handleFiles(fileElem.files));

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});
dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragover"));
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

async function handleFiles(files) {
  if (!files.length) return;
  const file = files[0];
  if (file.type !== "image/png") {
    alert("Only .png files allowed");
    return;
  }

  const form = new FormData();
  form.append("image", file);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
      headers: { "x-user-id": userId }
    });
    const data = await res.json();
    console.log("Uploaded:", data);

    loadImages();
  } catch (err) {
    console.error("Upload error:", err);
  }
}

async function loadImages() {
  try {
    const res = await fetch("/api/images", {
      headers: { "x-user-id": userId }
    });
    const images = await res.json();

    gallery.innerHTML = "";

    if (images.length === 0) {
      gallery.innerHTML = "<p>No images uploaded yet.</p>";
      return;
    }

    images.forEach(img => {
      const imgCard = document.createElement("div");
      imgCard.className = "img-card";

      const el = document.createElement("img");
      el.src = img.url;
      el.className = "gallery-img";

      const input = document.createElement("input");
      input.type = "text";
      input.value = window.location.origin + img.url;
      input.readOnly = true;
      input.className = "img-url";

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "Copy URL";
      copyBtn.className = "copy-btn";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(input.value);
          copyBtn.textContent = "Copied";
          setTimeout(() => copyBtn.textContent = "Copy URL", 2000);
        } catch (err) {
          console.error(err);
        }
      });

      imgCard.appendChild(el);
      imgCard.appendChild(input);
      imgCard.appendChild(copyBtn);
      gallery.appendChild(imgCard);
    });

  } catch (err) {
    console.error(err);
  }
}

loadImages();
