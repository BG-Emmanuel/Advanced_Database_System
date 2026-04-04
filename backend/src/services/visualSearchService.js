/**
 * BUY237 VISUAL SEARCH SERVICE
 * 
 * Multi-strategy image analysis:
 * 1. Google Cloud Vision API  (most accurate, requires API key)
 * 2. Hugging Face API         (free tier available)
 * 3. Tags-only fallback       (works without any API key)
 * 
 * How it works:
 * - When a vendor uploads a product image, we analyze it and extract:
 *   labels (what's in the image), colors, category hints
 * - When a buyer uploads a search image, we analyze it the same way
 * - We match the buyer's image against stored product embeddings
 *   using cosine similarity (pgvector) or tag overlap scoring
 */

const axios  = require('axios');
const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');
const db     = require('../db');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resize and compress image for API submission
 * Reduces bandwidth usage and speeds up API calls
 */
const prepareImage = async (imagePath) => {
  const resized = await sharp(imagePath)
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return resized.toString('base64');
};

/**
 * Extract color name from hex
 */
const colorNames = {
  'FF': 'red', 'F0': 'orange', 'E0': 'yellow',
  '00': 'black', 'FF,FF,FF': 'white', '80': 'gray',
};

// ─── Strategy 1: Google Cloud Vision API ─────────────────────────────────────

const analyzeWithGoogle = async (imageBase64) => {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('Google Vision API key not configured');

  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      requests: [{
        image: { content: imageBase64 },
        features: [
          { type: 'LABEL_DETECTION',      maxResults: 15 },
          { type: 'IMAGE_PROPERTIES',     maxResults: 5  },
          { type: 'OBJECT_LOCALIZATION',  maxResults: 10 },
          { type: 'WEB_DETECTION',        maxResults: 5  },
        ],
      }],
    },
    { timeout: 10000 }
  );

  const result = response.data.responses[0];

  // Extract labels (e.g., "smartphone", "Samsung", "electronics")
  const labels = [
    ...(result.labelAnnotations || []).map(l => l.description.toLowerCase()),
    ...(result.localizedObjectAnnotations || []).map(o => o.name.toLowerCase()),
    ...(result.webDetection?.bestGuessLabels || []).map(l => l.label.toLowerCase()),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  // Extract dominant colors
  const colors = (result.imagePropertiesAnnotation?.dominantColors?.colors || [])
    .slice(0, 3)
    .map(c => {
      const r = Math.round(c.color.red || 0);
      const g = Math.round(c.color.green || 0);
      const b = Math.round(c.color.blue || 0);
      // Simple color bucketing
      if (r > 200 && g < 100 && b < 100) return 'red';
      if (r > 200 && g > 150 && b < 100) return 'orange';
      if (r > 200 && g > 200 && b < 100) return 'yellow';
      if (r < 50 && g > 150 && b < 100)  return 'green';
      if (r < 100 && g < 100 && b > 200) return 'blue';
      if (r > 200 && g < 100 && b > 200) return 'purple';
      if (r > 180 && g > 180 && b > 180) return 'white';
      if (r < 70 && g < 70 && b < 70)    return 'black';
      return 'gray';
    })
    .filter((v, i, a) => a.indexOf(v) === i);

  // Infer category from labels
  const categoryMap = {
    phone: 'phones-tablets', smartphone: 'phones-tablets', mobile: 'phones-tablets',
    laptop: 'computers', computer: 'computers', notebook: 'computers',
    television: 'electronics', tv: 'electronics', camera: 'electronics',
    shirt: 'fashion', dress: 'fashion', shoe: 'fashion', clothing: 'fashion',
    food: 'food-groceries', fruit: 'food-groceries', vegetable: 'food-groceries',
    furniture: 'home-living', chair: 'home-living', table: 'home-living',
    car: 'automotive', vehicle: 'automotive',
    cosmetics: 'health-beauty', skin: 'health-beauty',
    plant: 'agriculture', crop: 'agriculture', farm: 'agriculture',
  };
  const category_hint = labels.reduce((found, label) => {
    if (found) return found;
    for (const [key, cat] of Object.entries(categoryMap)) {
      if (label.includes(key)) return cat;
    }
    return null;
  }, null);

  return { labels, colors, category_hint, confidence: 0.9, source: 'google' };
};

// ─── Strategy 2: Hugging Face API (free) ─────────────────────────────────────

const analyzeWithHuggingFace = async (imageBase64) => {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error('Hugging Face token not configured');

  // Use CLIP zero-shot image classification
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  const candidateLabels = [
    'smartphone', 'laptop', 'television', 'earphones', 'camera',
    'shirt', 'dress', 'shoes', 'bag', 'watch', 'jewelry',
    'food', 'vegetables', 'fruits', 'cooking oil', 'rice',
    'furniture', 'sofa', 'bed', 'kitchen appliance', 'fan',
    'car', 'motorcycle', 'car parts',
    'cosmetics', 'skincare', 'perfume',
    'farming tools', 'seeds', 'fertilizer',
    'books', 'toys', 'sports equipment',
  ];

  const response = await axios.post(
    'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32',
    {
      inputs: { image: imageBase64 },
      parameters: { candidate_labels: candidateLabels },
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const results = Array.isArray(response.data) ? response.data : response.data.outputs || [];

  // Take top 5 labels with score > 0.05
  const labels = results
    .filter(r => r.score > 0.05)
    .slice(0, 8)
    .map(r => r.label.toLowerCase());

  const topLabel = labels[0] || '';
  const categoryMap = {
    'smartphone': 'phones-tablets', 'laptop': 'computers', 'television': 'electronics',
    'shirt': 'fashion', 'dress': 'fashion', 'shoes': 'fashion',
    'food': 'food-groceries', 'vegetables': 'food-groceries', 'rice': 'food-groceries',
    'furniture': 'home-living', 'fan': 'home-living',
    'car': 'automotive', 'motorcycle': 'automotive',
    'cosmetics': 'health-beauty', 'skincare': 'health-beauty',
    'farming tools': 'agriculture', 'seeds': 'agriculture',
  };

  const category_hint = Object.entries(categoryMap)
    .find(([key]) => labels.some(l => l.includes(key)))?.[1] || null;

  const confidence = results[0]?.score || 0.5;

  return { labels, colors: [], category_hint, confidence, source: 'huggingface' };
};

// ─── Strategy 3: Local tag-based fallback ────────────────────────────────────

const analyzeWithTags = async (imagePath) => {
  // Extract info from filename and path as fallback
  const filename = path.basename(imagePath).toLowerCase();
  const keywords = filename.replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
  return { labels: keywords, colors: [], category_hint: null, confidence: 0.1, source: 'tags_fallback' };
};

// ─── Main analysis function ───────────────────────────────────────────────────

const analyzeImage = async (imagePath) => {
  const mode = process.env.VISUAL_SEARCH_MODE || 'auto';

  let base64;
  try {
    base64 = await prepareImage(imagePath);
  } catch (e) {
    // If image processing fails, read raw
    base64 = fs.readFileSync(imagePath).toString('base64');
  }

  // Try each strategy in order of preference
  const strategies = [];
  if (mode === 'auto' || mode === 'google')      strategies.push(analyzeWithGoogle);
  if (mode === 'auto' || mode === 'huggingface') strategies.push(analyzeWithHuggingFace);
  strategies.push(analyzeWithTags); // always as final fallback

  for (const strategy of strategies) {
    try {
      const result = await strategy(strategy === analyzeWithTags ? imagePath : base64);
      console.log(`✅ Visual analysis via ${result.source}: ${result.labels.slice(0,5).join(', ')}`);
      return result;
    } catch (e) {
      console.warn(`⚠️  Visual analysis strategy failed: ${e.message}`);
    }
  }

  return { labels: [], colors: [], category_hint: null, confidence: 0, source: 'none' };
};

// ─── Save product image analysis to DB ───────────────────────────────────────

exports.indexProductImage = async (productId, imageUrl, imagePath) => {
  try {
    const analysis = await analyzeImage(imagePath);
    const { v4: uuid } = require('uuid');

    await db.query(
      `INSERT INTO product_image_embeddings
         (embedding_id, product_id, image_url, labels, colors, category_hint, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [uuid(), productId, imageUrl, analysis.labels, analysis.colors, analysis.category_hint, analysis.confidence]
    );

    console.log(`🖼️  Indexed image for product ${productId}: ${analysis.labels.slice(0,5).join(', ')}`);
    return analysis;
  } catch (err) {
    console.error('indexProductImage error:', err.message);
    return null;
  }
};

// ─── Search products by image ─────────────────────────────────────────────────

exports.searchByImage = async (imagePath, limit = 20) => {
  try {
    // Analyze the query image
    const analysis = await analyzeImage(imagePath);

    if (!analysis.labels.length && !analysis.category_hint) {
      return { products: [], analysis, message: 'Could not extract features from image' };
    }

    // Build search query using label overlap scoring
    // Score = number of matching labels between query and indexed product images
    const { rows } = await db.query(
      `SELECT
         p.product_id, p.product_name, p.slug, p.base_price, p.discount_price,
         p.rating, p.review_count, p.total_sold,
         c.name as category_name, c.slug as category_slug,
         vp.shop_name as vendor_name, vp.is_verified as vendor_verified,
         pi_primary.image_url as primary_image,
         COALESCE(inv.quantity_on_hand, 0) as stock,
         -- Score: count how many query labels match this product's indexed labels
         (
           SELECT COUNT(*)
           FROM unnest(pie.labels) AS lbl
           WHERE lbl = ANY($1::text[])
         ) AS label_match_score,
         -- Bonus score if categories match
         CASE WHEN c.slug = $2 THEN 3 ELSE 0 END AS category_bonus,
         -- Bonus for color match
         CASE WHEN pie.colors && $3::text[] THEN 1 ELSE 0 END AS color_bonus
       FROM product_image_embeddings pie
       JOIN products p ON pie.product_id = p.product_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.vendor_id
       LEFT JOIN product_images pi_primary ON p.product_id = pi_primary.product_id AND pi_primary.is_primary = true
       LEFT JOIN inventory inv ON p.product_id = inv.product_id
       WHERE p.is_available = true
         AND (
           -- At least one label matches OR category matches
           (SELECT COUNT(*) FROM unnest(pie.labels) AS lbl WHERE lbl = ANY($1::text[])) > 0
           OR c.slug = $2
           OR pie.labels && $1::text[]
         )
       ORDER BY
         (label_match_score + category_bonus + color_bonus) DESC,
         p.rating DESC,
         p.total_sold DESC
       LIMIT $4`,
      [
        analysis.labels,
        analysis.category_hint || '',
        analysis.colors,
        limit,
      ]
    );

    // Deduplicate by product_id (a product may have multiple indexed images)
    const seen = new Set();
    const products = rows.filter(r => {
      if (seen.has(r.product_id)) return false;
      seen.add(r.product_id);
      return true;
    });

    // If no matches found via embeddings, fall back to text search using labels
    if (!products.length && analysis.labels.length > 0) {
      const topLabels = analysis.labels.slice(0, 3).join(' ');
      const textResults = await db.query(
        `SELECT p.product_id, p.product_name, p.slug, p.base_price, p.discount_price,
                p.rating, p.review_count, p.total_sold,
                c.name as category_name, c.slug as category_slug,
                vp.shop_name as vendor_name, vp.is_verified as vendor_verified,
                pi.image_url as primary_image, COALESCE(inv.quantity_on_hand, 0) as stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.category_id
         LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.vendor_id
         LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
         LEFT JOIN inventory inv ON p.product_id = inv.product_id
         WHERE p.is_available = true
           AND (p.product_name ILIKE $1 OR p.description ILIKE $1)
         ORDER BY p.rating DESC LIMIT $2`,
        [`%${analysis.labels[0] || ''}%`, limit]
      );
      return { products: textResults.rows, analysis, fallback: true };
    }

    return { products, analysis, fallback: false };
  } catch (err) {
    console.error('searchByImage error:', err);
    throw err;
  }
};

exports.analyzeImage = analyzeImage;
