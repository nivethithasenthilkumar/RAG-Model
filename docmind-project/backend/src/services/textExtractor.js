/**
 * Text Extractor Service
 * Extracts plain text from PDF, DOCX, and TXT files
 * Then chunks the text for vector storage
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract text from a file based on its mime type / extension
 */
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  // ── TXT ─────────────────────────────────────────────────────────────────────
  if (ext === '.txt' || mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.warn('PDF parse warning:', err.message);
      return `[PDF content could not be parsed: ${err.message}]`;
    }
  }

  // ── DOCX ─────────────────────────────────────────────────────────────────────
  if (
    ext === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (err) {
      console.warn('DOCX parse warning:', err.message);
      return `[DOCX content could not be parsed: ${err.message}]`;
    }
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '[Could not read file content]';
  }
}

/**
 * Split text into overlapping chunks for better RAG coverage
 * @param {string} text
 * @param {number} chunkSize - characters per chunk
 * @param {number} overlap - overlap chars between chunks
 */
function chunkText(text, chunkSize = 800, overlap = 150) {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;

    // Try to break at a sentence boundary
    if (end < cleaned.length) {
      const breakPoints = ['. ', '.\n', '\n\n', '! ', '? '];
      for (const bp of breakPoints) {
        const idx = cleaned.lastIndexOf(bp, end);
        if (idx > start + chunkSize / 2) {
          end = idx + bp.length;
          break;
        }
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk); // skip tiny fragments
    start = end - overlap;
  }

  return chunks;
}

/**
 * Count approximate tokens (1 token ≈ 4 chars)
 */
function countTokens(text) {
  return Math.ceil(text.length / 4);
}

module.exports = { extractText, chunkText, countTokens };
