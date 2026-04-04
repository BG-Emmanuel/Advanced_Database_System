const { v4: uuid } = require('uuid');
const db = require('../db');

exports.getAddresses = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ua.*,dz.zone_name,dz.base_fee,dz.estimated_days_min,dz.estimated_days_max
       FROM user_addresses ua LEFT JOIN delivery_zones dz ON ua.delivery_zone_id=dz.zone_id
       WHERE ua.user_id=$1 ORDER BY ua.is_default DESC,ua.created_at DESC`,
      [req.user.user_id]
    );
    return res.json({ success:true, addresses:rows });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch addresses' });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { label, recipient_name, phone, city, neighborhood, landmark, street_details, delivery_zone_id, is_default } = req.body;
    if (is_default) await db.query('UPDATE user_addresses SET is_default=false WHERE user_id=$1',[req.user.user_id]);
    const { rows } = await db.query(
      `INSERT INTO user_addresses (address_id,user_id,label,recipient_name,phone,city,neighborhood,landmark,street_details,delivery_zone_id,is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [uuid(),req.user.user_id,label||'Home',recipient_name,phone,city,neighborhood,landmark,street_details,delivery_zone_id||null,is_default||false]
    );
    return res.status(201).json({ success:true, address:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to add address' });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { label, recipient_name, phone, city, neighborhood, landmark, street_details, delivery_zone_id, is_default } = req.body;
    if (is_default) await db.query('UPDATE user_addresses SET is_default=false WHERE user_id=$1',[req.user.user_id]);
    const { rows } = await db.query(
      `UPDATE user_addresses SET
         label=COALESCE($1,label), recipient_name=COALESCE($2,recipient_name),
         phone=COALESCE($3,phone), city=COALESCE($4,city),
         neighborhood=COALESCE($5,neighborhood), landmark=COALESCE($6,landmark),
         street_details=COALESCE($7,street_details),
         delivery_zone_id=COALESCE($8,delivery_zone_id), is_default=COALESCE($9,is_default)
       WHERE address_id=$10 AND user_id=$11 RETURNING *`,
      [label,recipient_name,phone,city,neighborhood,landmark,street_details,delivery_zone_id,is_default,req.params.id,req.user.user_id]
    );
    return res.json({ success:true, address:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update address' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    await db.query('DELETE FROM user_addresses WHERE address_id=$1 AND user_id=$2',[req.params.id,req.user.user_id]);
    return res.json({ success:true, message:'Address deleted' });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to delete address' });
  }
};

exports.getDeliveryZones = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM delivery_zones WHERE is_active=true ORDER BY base_fee');
    return res.json({ success:true, zones:rows });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch zones' });
  }
};
