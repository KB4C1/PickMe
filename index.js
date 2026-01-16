import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';

const app = express();
const PORT = 3000;
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png") cb(null, true);
    else cb(new Error("Only PNG allowed"));
  }
});

async function loadProfiles() {
  try {
    return JSON.parse(await fs.readFile('profiles.json', 'utf-8'));
  } catch {
    return {};
  }
}
async function saveProfiles(data) {
  await fs.writeFile('profiles.json', JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/images', async (req, res) => {
  try {
    const user_id = req.headers["x-user-id"];
    if (!user_id) return res.status(401).send("No user");

    const profiles = await loadProfiles();
    if (!profiles[user_id]) {
      profiles[user_id] = { images: [] };
      await saveProfiles(profiles);
    }

    const images = profiles[user_id].images.map(img => ({
      img_id: img.img_id,
      url: `/uploads/${img.img_id}.png`
    }));

    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.post('/api/delete', express.json(), async (req, res) => {
  try {
    const user_id = req.headers["x-user-id"];

    if (!user_id) return res.status(401).send("No user");

    const { img_id } = req.body;

    if (!img_id) return res.status(400).send("No img_id");

    const profiles = await loadProfiles();

    if (!profiles[user_id]) return res.status(404).send("No profile");

    profiles[user_id].images = profiles[user_id].images.filter(img => img.img_id !== img_id);
    
    await saveProfiles(profiles);
    await fs.unlink(path.join(__dirname, 'uploads', img_id + '.png'));
    res.json({ ok: true });

  } catch (err) {

    console.error(err);
    res.status(500).send("Delete error");
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const user_id = req.headers["x-user-id"];
    if (!user_id) return res.status(401).send("No user");

    if (!req.file) return res.status(400).send("No file");

    const profiles = await loadProfiles();
    if (!profiles[user_id]) profiles[user_id] = { images: [] };

    const img_id = crypto.randomUUID();
    profiles[user_id].images.push({ img_id });
    await saveProfiles(profiles);

    await fs.writeFile(path.join(__dirname, 'uploads', img_id + '.png'), req.file.buffer);

    res.json({ ok: true, img_id, url: `/uploads/${img_id}.png` });
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload error");
  }
});


app.listen(PORT, () => {
  console.log(`http://127.0.0.1:${PORT}`);
});
