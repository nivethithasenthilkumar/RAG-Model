/**
 * Documents Routes
 * POST /api/documents/upload  — Upload & index a document
 * GET  /api/documents         — List user's documents
 * GET  /api/documents/:id     — Get single document
 * DELETE /api/documents/:id   — Delete document & its vectors
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { extractText, chunkText, countTokens } = require('../services/textExtractor');
const { embedText } = require('../services/embeddings');
const endee = require('../services/endee');

// ── Multer config ──────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, req.user.id);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(file.mimetype) || ['.pdf', '.docx', '.txt'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and TXT files are supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '50')) * 1024 * 1024 },
});

// ── Upload & Index ─────────────────────────────────────────────────────────────
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const docId = uuidv4();
  const { originalname, mimetype, size, path: filePath } = req.file;

  // Insert document record (status = processing)
  db.prepare(`
    INSERT INTO documents (id, user_id, file_name, file_type, file_size, file_path, status)
    VALUES (?, ?, ?, ?, ?, ?, 'processing')
  `).run(docId, req.user.id, originalname, mimetype, size, filePath);

  // Process asynchronously
  processDocument(docId, filePath, mimetype, originalname, req.user.id)
    .catch((err) => {
      console.error(`❌ Failed to process doc ${docId}:`, err.message);
      db.prepare("UPDATE documents SET status = 'failed' WHERE id = ?").run(docId);
    });

  res.status(202).json({
    message: 'Document uploaded. Indexing in progress...',
    data: { id: docId, fileName: originalname, status: 'processing' },
  });
});

async function processDocument(docId, filePath, mimeType, fileName, userId) {
  console.log(`📄 Processing: ${fileName}`);

  // 1. Extract text
  const text = await extractText(filePath, mimeType);
  if (!text || text.trim().length < 10) throw new Error('No text could be extracted');

  // 2. Chunk text
  const chunks = chunkText(text, 800, 150);
  const totalTokens = countTokens(text);

  console.log(`   ✂️  ${chunks.length} chunks, ~${totalTokens} tokens`);

  // 3. Embed each chunk & build vector batch
  const vectors = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i]);
    vectors.push({
      id: `${docId}_chunk_${i}`,
      vector: embedding,
      metadata: {
        documentId: docId,
        userId,
        fileName,
        chunkNumber: i,
        text: chunks[i].slice(0, 500), // store first 500 chars in metadata
        totalChunks: chunks.length,
      },
    });
  }

  // 4. Upsert to Endee
  try {
    await endee.upsertVectors(vectors);
    console.log(`   ✅ ${vectors.length} vectors upserted to Endee`);
  } catch (err) {
    console.warn(`   ⚠️  Endee upsert failed (vectors not stored): ${err.message}`);
    // Continue so document record still gets updated
  }

  // 5. Update document record
  db.prepare(`
    UPDATE documents
    SET total_chunks = ?, total_tokens = ?, status = 'ready', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(chunks.length, totalTokens, docId);

  console.log(`   🎉 Done: ${fileName}`);
}

// ── List Documents ────────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const docs = db.prepare(
    'SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ data: docs });
});

// ── Get Single Document ───────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  const doc = db.prepare(
    'SELECT * FROM documents WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ data: doc });
});

// ── Delete Document ───────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const doc = db.prepare(
    'SELECT * FROM documents WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // Delete physical file
  if (doc.file_path && fs.existsSync(doc.file_path)) {
    fs.unlinkSync(doc.file_path);
  }

  // Delete vectors from Endee
  try {
    await endee.deleteByDocumentId(doc.id);
  } catch (err) {
    console.warn('⚠️  Could not remove vectors from Endee:', err.message);
  }

  // Delete from DB
  db.prepare('DELETE FROM documents WHERE id = ?').run(doc.id);

  res.json({ message: 'Document deleted successfully' });
});

module.exports = router;
