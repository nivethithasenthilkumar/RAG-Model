/**
 * Embeddings Service
 * Uses a local lightweight embedding via TF-IDF-style approach
 * OR calls HuggingFace Inference API for sentence-transformers
 *
 * For production: replace with OpenAI text-embedding-3-small or HuggingFace
 */

const crypto = require('crypto');

const DIMENSIONS = parseInt(process.env.ENDEE_DIMENSIONS || '384', 10);

// ── Simple deterministic embedding (works offline, no API key needed) ─────────
// Uses a combination of character n-grams hashed into a fixed-dim vector
// Not semantically rich, but functional for demo RAG — replace with real model

function hashEmbed(text, dims = DIMENSIONS) {
  const normalized = text.toLowerCase().trim().slice(0, 1000);
  const vector = new Array(dims).fill(0);

  // Sliding window n-grams (trigrams + word hashes)
  const words = normalized.split(/\s+/);
  const features = [];

  // Word unigrams
  for (const w of words) features.push(w);

  // Character trigrams from first 500 chars
  const chars = normalized.slice(0, 500);
  for (let i = 0; i < chars.length - 2; i++) {
    features.push(chars.slice(i, i + 3));
  }

  for (const feat of features) {
    const hash = crypto.createHash('sha256').update(feat).digest();
    for (let d = 0; d < dims; d++) {
      const byte = hash[d % 32];
      const sign = byte > 127 ? 1 : -1;
      vector[d] += sign * (byte / 255.0);
    }
  }

  // L2 normalize
  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => parseFloat((v / magnitude).toFixed(6)));
}

/**
 * Generate embedding for a single text.
 * Uses HuggingFace API if HUGGINGFACE_API_KEY is set, else falls back to hashEmbed.
 */
async function embedText(text) {
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const axios = require('axios');
      const res = await axios.post(
        'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text.slice(0, 512) },
        {
          headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
          timeout: 15000,
        }
      );
      const embedding = res.data?.[0];
      if (Array.isArray(embedding)) return embedding;
    } catch (err) {
      console.warn('⚠️  HuggingFace embedding failed, using fallback:', err.message);
    }
  }
  return hashEmbed(text, DIMENSIONS);
}

/**
 * Batch embed multiple texts
 */
async function embedBatch(texts) {
  const results = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}

module.exports = { embedText, embedBatch };
