const path  = require('path');
const fs    = require('fs');
const db    = require('../db');
const { searchByImage, indexProductImage } = require('../services/visualSearchService');

/**
 * POST /api/search/visual
 * Upload an image → get matching products
 * Accepts multipart/form-data with field "image"
 */
exports.visualSearch = async (req, res) => {
  let uploadedPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    uploadedPath = req.file.path;
    const limit = parseInt(req.query.limit) || 20;

    console.log(`🔍 Visual search request: ${req.file.originalname} (${req.file.size} bytes)`);

    // Search for matching products
    const result = await searchByImage(uploadedPath, limit);

    // Log analytics (non-blocking)
    if (req.user) {
      db.query(
        `INSERT INTO search_analytics (user_id, query, search_type, result_count, language)
         VALUES ($1, $2, 'visual', $3, $4)`,
        [req.user.user_id, `[image:${req.file.originalname}]`, result.products.length, req.user.preferred_language || 'en']
      ).catch(() => {});
    }

    return res.json({
      success: true,
      products: result.products,
      analysis: {
        detected_labels: result.analysis.labels.slice(0, 10),
        detected_colors: result.analysis.colors,
        category_hint:   result.analysis.category_hint,
        confidence:      result.analysis.confidence,
        source:          result.analysis.source,
      },
      result_count: result.products.length,
      fallback: result.fallback || false,
      message: result.products.length > 0
        ? `Found ${result.products.length} matching products`
        : 'No matching products found. Try a clearer image.',
    });

  } catch (err) {
    console.error('visualSearch error:', err);
    return res.status(500).json({ success: false, message: 'Visual search failed. Please try again.' });
  } finally {
    // Always clean up uploaded temp file
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      fs.unlink(uploadedPath, () => {});
    }
  }
};

/**
 * POST /api/search/index-product/:productId
 * Re-index a product's images for visual search
 * Called automatically when vendor uploads product with images
 * Can also be triggered manually by admin
 */
exports.indexProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product images from DB
    const imagesResult = await db.query(
      'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order LIMIT 3',
      [productId]
    );

    if (!imagesResult.rows.length) {
      return res.json({ success: true, message: 'No images to index', indexed: 0 });
    }

    let indexed = 0;
    const uploadDir = path.join(__dirname, '../../uploads');

    for (const img of imagesResult.rows) {
      const imageUrl = img.image_url;
      // Try to get local file path
      const filename = imageUrl.split('/uploads/').pop();
      const localPath = path.join(uploadDir, filename);

      if (fs.existsSync(localPath)) {
        // Local file — index it directly
        await indexProductImage(productId, imageUrl, localPath);
        indexed++;
      } else if (imageUrl.startsWith('http')) {
        // Remote URL — download to temp, index, delete
        const tempPath = path.join(uploadDir, `temp_${Date.now()}.jpg`);
        try {
          const axios = require('axios');
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
          fs.writeFileSync(tempPath, response.data);
          await indexProductImage(productId, imageUrl, tempPath);
          indexed++;
        } catch (e) {
          console.warn(`Could not fetch remote image ${imageUrl}:`, e.message);
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      }
    }

    return res.json({ success: true, message: `Indexed ${indexed} image(s) for product`, indexed });
  } catch (err) {
    console.error('indexProduct error:', err);
    return res.status(500).json({ success: false, message: 'Indexing failed' });
  }
};

/**
 * POST /api/search/index-all
 * Admin: re-index all products (run once after setup or when adding visual search to existing products)
 */
exports.indexAllProducts = async (req, res) => {
  try {
    // Start indexing in background — return immediately
    res.json({ success: true, message: 'Indexing started in background. Check server logs.' });

    // Background indexing
    const products = await db.query(
      `SELECT DISTINCT p.product_id FROM products p
       JOIN product_images pi ON p.product_id = pi.product_id
       WHERE p.is_available = true
       LIMIT 500`
    );

    console.log(`🔄 Starting bulk visual indexing of ${products.rows.length} products...`);
    let done = 0;

    for (const product of products.rows) {
      try {
        const images = await db.query(
          'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order LIMIT 1',
          [product.product_id]
        );
        if (images.rows.length) {
          const imageUrl = images.rows[0].image_url;
          const filename = imageUrl.split('/uploads/').pop();
          const localPath = path.join(__dirname, '../../uploads', filename);
          if (fs.existsSync(localPath)) {
            await indexProductImage(product.product_id, imageUrl, localPath);
            done++;
          }
        }
        // Small delay to avoid API rate limits
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.warn(`Skipped product ${product.product_id}:`, e.message);
      }
    }
    console.log(`✅ Bulk indexing complete: ${done}/${products.rows.length} products indexed`);
  } catch (err) {
    console.error('indexAllProducts error:', err);
  }
};

/**
 * GET /api/search/stats
 * Search analytics for admin
 */
exports.getSearchStats = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        search_type,
        COUNT(*) as total_searches,
        AVG(result_count) as avg_results,
        COUNT(DISTINCT user_id) as unique_users
      FROM search_analytics
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY search_type
    `);
    const topQueries = await db.query(`
      SELECT query, COUNT(*) as count
      FROM search_analytics
      WHERE search_type IN ('text','voice')
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `);
    return res.json({ success: true, stats: stats.rows, top_queries: topQueries.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};
