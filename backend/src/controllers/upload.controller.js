const path = require('path');
const multer = require('multer');
const { poolPromise } = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const uploadHandler = upload.single('file'); // รับไฟล์เดียว

const uploadFile = async (req, res) => {
  const { PartNo, Spec, DocNo } = req.body;
  const fileName = req.file.filename;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('PartNo', PartNo)
      .input('Spec', Spec)
      .input('DocNo', DocNo)
      .input('FileName', fileName)
      .query(`
        UPDATE CartTable
        SET AttachedFile = @FileName
        WHERE PartNo = @PartNo AND Spec = @Spec AND DocNo = @DocNo
      `);

    res.json({ success: true, filename: fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports = { uploadHandler, uploadFile };