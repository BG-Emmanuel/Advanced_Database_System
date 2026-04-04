/**
 * BUY237 DATABASE SEED SCRIPT
 * Run: npm run seed
 * 
 * Creates sample vendors, products, and an admin user.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { query } = require('../db');

const ADMIN_EMAIL    = 'admin@buy237.cm';
const ADMIN_PASSWORD = 'Admin@237';
const VENDOR1_EMAIL  = 'techcm@buy237.cm';
const VENDOR2_EMAIL  = 'modecm@buy237.cm';

const seedProducts = [
  // Electronics
  { name: 'Samsung Galaxy A54 5G',        price: 85000,  sale: 72000, cat: 1,  desc: 'Powerful mid-range 5G smartphone with 50MP camera, 6.4" AMOLED display, 5000mAh battery. Perfect for Cameroon.' },
  { name: 'iPhone 15 (128GB)',            price: 320000, sale: 295000,cat: 1,  desc: 'Latest iPhone with Dynamic Island, 48MP camera, USB-C. Available in all colors.' },
  { name: 'Laptop HP 15 Intel Core i5',  price: 180000, sale: null,  cat: 12, desc: 'HP laptop with Intel Core i5, 8GB RAM, 256GB SSD. Ideal for students and professionals.' },
  { name: 'Écouteurs Bluetooth TWS',      price: 8500,   sale: 6500,  cat: 1,  desc: 'Écouteurs sans fil avec réduction de bruit, autonomie 24h, boîtier de charge.' },
  { name: 'Chargeur Rapide 65W USB-C',   price: 5000,   sale: null,  cat: 1,  desc: 'Chargeur rapide universel compatible tous smartphones. GaN technology.' },
  // Fashion
  { name: 'Nike Air Force 1 Low',         price: 45000,  sale: null,  cat: 2,  desc: 'Classic Nike Air Force 1, available in all sizes. Authentic product.' },
  { name: 'Robe Africaine Wax Premium',   price: 22000,  sale: 18000, cat: 2,  desc: 'Robe en tissu wax 100% coton, motifs africains traditionnels. Tailles S à XXL.' },
  { name: 'Costume Homme 2 Pièces',       price: 65000,  sale: null,  cat: 2,  desc: 'Costume élégant pour homme, tissu polyester premium. Disponible en bleu marine et noir.' },
  // Home
  { name: 'Casserole Inox 5L',           price: 12500,  sale: null,  cat: 3,  desc: 'Casserole en acier inoxydable 18/10, fond épais diffuseur. Compatibles tous feux.' },
  { name: 'Ventilateur USB Bureau',       price: 8500,   sale: null,  cat: 3,  desc: 'Mini ventilateur USB silencieux 3 vitesses. Idéal pour le bureau pendant les coupures.' },
  { name: 'Matelas Mousse 140x190',       price: 55000,  sale: 48000, cat: 3,  desc: 'Matelas mousse haute densité, confort optimal. Livraison à domicile.' },
  // Food
  { name: 'Huile de Palme Rouge 5L',      price: 4500,   sale: null,  cat: 4,  desc: 'Huile de palme rouge naturelle, non raffinée. Produit local du Cameroun.' },
  { name: 'Riz Long Grain 25kg',          price: 18000,  sale: null,  cat: 4,  desc: 'Riz long grain de qualité premium. Idéal pour les familles.' },
  // Health & Beauty
  { name: 'Crème Visage Karité 200ml',    price: 4500,   sale: null,  cat: 5,  desc: 'Crème hydratante au beurre de karité pur, enrichie en vitamine E.' },
  { name: 'Parfum Homme Boss 100ml',      price: 28000,  sale: 22000, cat: 5,  desc: 'Parfum pour homme Boss, note boisée et fraîche. Authentique.' },
];

async function seed() {
  console.log('\n🌱 Starting Buy237 Database Seed...\n');

  try {
    // ── Admin User ────────────────────────────────────────────────────────────
    console.log('👤 Creating admin user...');
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const adminId = uuid();
    await query(
      `INSERT INTO users (user_id, email, phone, password_hash, full_name, role, tier_id, is_verified)
       VALUES ($1,$2,'+237600000000',$3,'Buy237 Admin','admin',4,true)
       ON CONFLICT (email) DO UPDATE SET role='admin', is_verified=true`,
      [adminId, ADMIN_EMAIL, adminHash]
    );
    console.log(`   ✅ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

    // ── Vendor 1: TechCM ─────────────────────────────────────────────────────
    console.log('\n🏪 Creating vendors...');
    const v1Hash  = await bcrypt.hash('Vendor@237', 10);
    const v1UserId = uuid();
    const v1Id     = uuid();
    await query(
      `INSERT INTO users (user_id,email,phone,password_hash,full_name,role,tier_id,is_verified)
       VALUES ($1,$2,'+237699111111',$3,'TechCM Manager','vendor',3,true)
       ON CONFLICT (email) DO NOTHING`,
      [v1UserId, VENDOR1_EMAIL, v1Hash]
    );
    const v1User = await query('SELECT user_id FROM users WHERE email=$1', [VENDOR1_EMAIL]);
    await query(
      `INSERT INTO vendor_profiles (vendor_id,user_id,shop_name,shop_description,city,phone,whatsapp,is_verified,rating,review_count)
       VALUES ($1,$2,'TechCM Store','Your trusted source for electronics in Cameroon. Official dealer for Samsung, HP, and more.','Douala','+237699111111','+237699111111',true,4.7,234)
       ON CONFLICT (user_id) DO NOTHING`,
      [v1Id, v1User.rows[0]?.user_id || v1UserId]
    );
    const vendor1 = await query('SELECT vendor_id FROM vendor_profiles WHERE shop_name=$1', ['TechCM Store']);
    const vendor1Id = vendor1.rows[0]?.vendor_id || v1Id;
    console.log('   ✅ TechCM Store created');

    // ── Vendor 2: ModeCM ─────────────────────────────────────────────────────
    const v2Hash  = await bcrypt.hash('Vendor@237', 10);
    const v2UserId = uuid();
    const v2Id     = uuid();
    await query(
      `INSERT INTO users (user_id,email,phone,password_hash,full_name,role,tier_id,is_verified)
       VALUES ($1,$2,'+237699222222',$3,'ModeCM Manager','vendor',2,true)
       ON CONFLICT (email) DO NOTHING`,
      [v2UserId, VENDOR2_EMAIL, v2Hash]
    );
    const v2User = await query('SELECT user_id FROM users WHERE email=$1', [VENDOR2_EMAIL]);
    await query(
      `INSERT INTO vendor_profiles (vendor_id,user_id,shop_name,shop_description,city,phone,whatsapp,is_verified,rating,review_count)
       VALUES ($1,$2,'ModeCM Fashion','Mode africaine et internationale au meilleur prix. Vêtements, chaussures et accessoires.','Yaoundé','+237699222222','+237699222222',true,4.4,156)
       ON CONFLICT (user_id) DO NOTHING`,
      [v2Id, v2User.rows[0]?.user_id || v2UserId]
    );
    const vendor2 = await query('SELECT vendor_id FROM vendor_profiles WHERE shop_name=$1', ['ModeCM Fashion']);
    const vendor2Id = vendor2.rows[0]?.vendor_id || v2Id;
    console.log('   ✅ ModeCM Fashion created');

    // ── Products ──────────────────────────────────────────────────────────────
    console.log('\n📦 Creating products...');
    for (let i = 0; i < seedProducts.length; i++) {
      const p = seedProducts[i];
      const productId = uuid();
      const isElec = p.cat === 1 || p.cat === 12;
      const vendorId = isElec ? vendor1Id : vendor2Id;
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-') + '-' + Date.now() + i;
      const isFeatured = i < 6;
      const isDeal     = i < 3;

      await query(
        `INSERT INTO products (product_id,vendor_id,category_id,product_name,slug,description,base_price,discount_price,is_featured,is_deal_of_day,rating,review_count,total_sold)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (slug) DO NOTHING`,
        [productId, vendorId, p.cat, p.name, slug, p.desc, p.price, p.sale || null,
         isFeatured, isDeal,
         (3.8 + Math.random()*1.2).toFixed(1),
         Math.floor(20 + Math.random()*300),
         Math.floor(5 + Math.random()*200)]
      );

      // Add inventory (warehouse 1)
      await query(
        `INSERT INTO inventory (product_id, warehouse_id, quantity_on_hand, reorder_threshold)
         VALUES ($1, 1, $2, 10) ON CONFLICT (product_id, warehouse_id) DO NOTHING`,
        [productId, Math.floor(10 + Math.random()*100)]
      );

      // Add placeholder image
      const imgSeed = ['phone','fashion','laptop','earphones','charger','shoe','dress','suit','pot','fan','mattress','oil','rice','cream','perfume'][i] || 'product';
      await query(
        'INSERT INTO product_images (image_id,product_id,image_url,is_primary,sort_order) VALUES ($1,$2,$3,true,0) ON CONFLICT DO NOTHING',
        [uuid(), productId, `https://picsum.photos/seed/${imgSeed}${i}/600/600`]
      );

      process.stdout.write(`   ✅ ${p.name}\n`);
    }

    // ── Sample Customer ───────────────────────────────────────────────────────
    console.log('\n👤 Creating sample customer...');
    const custHash = await bcrypt.hash('Customer@237', 10);
    await query(
      `INSERT INTO users (user_id,email,phone,password_hash,full_name,role,tier_id,is_verified)
       VALUES ($1,'customer@buy237.cm','+237699333333',$2,'Jean Paul Atangana','customer',2,true)
       ON CONFLICT (email) DO NOTHING`,
      [uuid(), custHash]
    );
    console.log('   ✅ customer@buy237.cm / Customer@237');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log('📋 Test Accounts:');
    console.log(`   Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`   Vendor 1: ${VENDOR1_EMAIL} / Vendor@237`);
    console.log(`   Vendor 2: ${VENDOR2_EMAIL} / Vendor@237`);
    console.log(`   Customer: customer@buy237.cm / Customer@237`);
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
