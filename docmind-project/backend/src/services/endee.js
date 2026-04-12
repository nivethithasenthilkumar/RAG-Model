/**
 * Endee Vector DB Service
 * HTTP client for the Endee vector database (runs at localhost:8080)
 * API docs: http://localhost:8080 once Endee is running
 */

const axios = require('axios');

const ENDEE_BASE = process.env.ENDEE_BASE_URL || 'http://localhost:8080';
const ENDEE_TOKEN = process.env.ENDEE_AUTH_TOKEN || '';
const INDEX_NAME = process.env.ENDEE_INDEX_NAME || 'documind_index';
const DIMENSIONS = parseInt(process.env.ENDEE_DIMENSIONS || '384', 10);

// Axios client for Endee
const endeeClient = axios.create({
  baseURL: `${ENDEE_BASE}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(ENDEE_TOKEN ? { Authorization: ENDEE_TOKEN } : {}),
  },
});

// ── Health Check ──────────────────────────────────────────────────────────────
async function checkHealth() {
  const res = await endeeClient.get('/health');
  return res.data;
}

// ── Create Index (if not exists) ──────────────────────────────────────────────
async function ensureIndex() {
  try {
    // List existing indexes
    const res = await endeeClient.get('/index/list');
    const indexes = res.data?.indexes || res.data || [];
    const exists = Array.isArray(indexes)
      ? indexes.some((idx) => (typeof idx === 'string' ? idx : idx.name) === INDEX_NAME)
      : false;

    if (!exists) {
      await endeeClient.post('/index/create', {
        name: INDEX_NAME,
        dimensions: DIMENSIONS,
        metric: 'cosine',        // cosine similarity for text embeddings
        hnsw: {
          M: 16,
          ef_construction: 200,
        },
      });
      console.log(`✅ Endee index "${INDEX_NAME}" created (dim=${DIMENSIONS})`);
    } else {
      console.log(`📦 Endee index "${INDEX_NAME}" already exists`);
    }
  } catch (err) {
    console.warn('⚠️  Could not ensure Endee index:', err.message);
  }
}

// ── Upsert Vectors ────────────────────────────────────────────────────────────
/**
 * @param {Array<{id, vector, metadata}>} vectors
 */
async function upsertVectors(vectors) {
  const res = await endeeClient.post(`/index/${INDEX_NAME}/upsert`, {
    vectors: vectors.map((v) => ({
      id: v.id,
      vector: v.vector,
      metadata: v.metadata || {},
    })),
  });
  return res.data;
}

// ── Search / Query ────────────────────────────────────────────────────────────
/**
 * @param {number[]} queryVector - embedding of the search query
 * @param {number} topK - max results to return
 * @param {object} filter - optional metadata filter
 */
async function searchVectors(queryVector, topK = 10, filter = null) {
  const body = {
    vector: queryVector,
    top_k: topK,
    include_metadata: true,
  };
  if (filter) body.filter = filter;

  const res = await endeeClient.post(`/index/${INDEX_NAME}/search`, body);
  return res.data?.results || res.data || [];
}

// ── Delete Vectors by metadata filter ────────────────────────────────────────
/**
 * Delete all vectors where metadata.documentId === docId
 */
async function deleteByDocumentId(docId) {
  try {
    await endeeClient.post(`/index/${INDEX_NAME}/delete`, {
      filter: { documentId: docId },
    });
  } catch (err) {
    // Some Endee versions use different delete API
    console.warn('⚠️  Vector delete by filter failed:', err.message);
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function getIndexStats() {
  try {
    const res = await endeeClient.get(`/index/${INDEX_NAME}/stats`);
    return res.data;
  } catch {
    return null;
  }
}

// ── Init on startup ───────────────────────────────────────────────────────────
(async () => {
  try {
    await checkHealth();
    console.log(`✅ Endee Vector DB reachable at ${ENDEE_BASE}`);
    await ensureIndex();
  } catch (err) {
    console.warn(`⚠️  Endee Vector DB not reachable at ${ENDEE_BASE}: ${err.message}`);
    console.warn('   Start Endee with: docker run -p 8080:8080 endeeio/endee-server:latest');
  }
})();

module.exports = { checkHealth, ensureIndex, upsertVectors, searchVectors, deleteByDocumentId, getIndexStats, INDEX_NAME };
