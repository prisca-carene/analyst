const express = require('express');
const path = require('path');
const multer = require('multer');
const bencode = require('bencode');

const app = express();
const port = process.env.PORT || 3000;

// Configuration de multer pour les fichiers torrent
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.torrent')) {
      return cb(new Error('Seuls les fichiers .torrent sont acceptés'));
    }
    cb(null, true);
  }
});

app.use(express.json());
app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API pour analyser un lien magnet
app.post('/api/analyze-magnet', (req, res) => {
  try {
    const { magnetLink } = req.body;

    if (!magnetLink) {
      throw new Error('Aucun lien magnet fourni');
    }

    if (!magnetLink.startsWith('magnet:?')) {
      throw new Error('Le lien doit commencer par "magnet:?"');
    }

    const url = new URL(magnetLink);
    const xtParam = url.searchParams.get('xt');

    if (!xtParam || !xtParam.startsWith('urn:btih:')) {
      throw new Error('Le hash BitTorrent (xt=urn:btih:) est manquant ou invalide');
    }

    const hash = xtParam.split(':').pop();

    const isHexHash = /^[a-fA-F0-9]{40}$/.test(hash);
    const isBase32Hash = /^[A-Z2-7]{32}$/.test(hash);

    if (!isHexHash && !isBase32Hash) {
      throw new Error('Le hash doit être en format hexadécimal (40 caractères) ou base32 (32 caractères)');
    }

    const name = url.searchParams.get('dn') ? decodeURIComponent(url.searchParams.get('dn')) : '';
    const trackers = url.searchParams.getAll('tr').map(tracker => {
      try {
        return decodeURIComponent(tracker);
      } catch (e) {
        return tracker;
      }
    });

    res.json({
      isValid: true,
      hash,
      name,
      trackers
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse du lien magnet:', error);
    res.status(400).json({
      isValid: false,
      errorMessage: error.message || 'Erreur lors de l\'analyse du lien magnet'
    });
  }
});

// API pour analyser un fichier torrent
app.post('/api/analyze-torrent', upload.single('torrent'), (req, res) => {
  try {
    if (!req.file) {
      throw new Error('Aucun fichier n\'a été fourni');
    }

    const torrentData = bencode.decode(req.file.buffer);

    if (!torrentData.info) {
      throw new Error('Le fichier torrent est invalide (champ "info" manquant)');
    }

    const result = {
      isValid: true,
      name: torrentData.info.name?.toString(),
      announce: torrentData.announce?.toString(),
      announceList: Array.isArray(torrentData['announce-list'])
        ? torrentData['announce-list'].map(tracker => tracker.toString())
        : undefined,
      comment: torrentData.comment?.toString(),
      createdBy: torrentData['created by']?.toString(),
      creationDate: torrentData['creation date']
        ? new Date(torrentData['creation date'] * 1000)
        : undefined,
      isPrivate: !!torrentData.info.private,
      totalSize: 0
    };

    if (torrentData.info.files) {
      result.files = torrentData.info.files.map(file => ({
        path: file.path.map(p => p.toString()),
        length: file.length
      }));
      result.totalSize = result.files.reduce((total, file) => total + file.length, 0);
    } else if (torrentData.info.length) {
      result.totalSize = torrentData.info.length;
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de l\'analyse du fichier torrent:', error);
    res.status(400).json({
      isValid: false,
      errorMessage: error.message || 'Erreur lors de l\'analyse du fichier torrent'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});