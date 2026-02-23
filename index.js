const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ULTRA SIMPLE CORS - NO MIDDLEWARE
app.all('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Payment initiation
app.post('/api/odeme-baslat', (req, res) => {
  try {
    const { order_id, amount, buyer, product_name } = req.body;
    
    const API_KEY = process.env.SHOPIER_API_KEY;
    const API_SECRET = process.env.SHOPIER_API_SECRET;
    
    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({ error: 'API keys missing' });
    }

    const platformOrderId = order_id || 'ORD-' + Date.now();
    const randomNr = Math.floor(Math.random() * 1000000);
    const currency = 'TRY';
    const callbackUrl = process.env.CALLBACK_URL;

    const signatureString = `${randomNr}${platformOrderId}${amount}${currency}`;
    const signature = crypto.createHmac('sha256', API_SECRET).update(signatureString).digest('base64');

    const formData = {
      API_key: API_KEY,
      platform_order_id: platformOrderId,
      amount: amount,
      currency: currency,
      buyer_name: buyer.first_name,
      buyer_surname: buyer.last_name,
      buyer_email: buyer.email,
      buyer_phone: buyer.phone,
      buyer_id_nr: buyer.id || Date.now().toString(),
      product_name: product_name || 'Product',
      billing_address: buyer.address || 'Turkey',
      billing_city: buyer.city || 'Istanbul',
      billing_country: 'Turkey',
      billing_postcode: buyer.postcode || '34000',
      shipping_address: buyer.address || 'Turkey',
      shipping_city: buyer.city || 'Istanbul',
      shipping_country: 'Turkey',
      shipping_postcode: buyer.postcode || '34000',
      callback_url: callbackUrl,
      random_nr: randomNr,
      signature: signature
    };

    const formHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <style>
          body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
          .box { text-align: center; background: white; padding: 40px; border-radius: 10px; }
          .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="spinner"></div>
          <p>Redirecting to payment...</p>
        </div>
        <form id="shopierForm" action="https://www.shopier.com/api/v1/payment" method="POST" style="display:none;">
          ${Object.entries(formData).map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`).join('')}
        </form>
        <script>setTimeout(() => document.getElementById('shopierForm').submit(), 1500);</script>
      </body>
      </html>
    `;

    const base64Html = Buffer.from(formHtml).toString('base64');
    res.json({ success: true, payment_url: `data:text/html;base64,${base64Html}` });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Callback
app.post('/api/callback', (req, res) => {
  try {
    const { random_nr, platform_order_id, total_order_value, currency, signature, status, payment_id } = req.body;
    
    const API_SECRET = process.env.SHOPIER_API_SECRET;
    const expectedSignature = crypto.createHmac('sha256', API_SECRET)
      .update(`${random_nr}${platform_order_id}${total_order_value}${currency}`)
      .digest('base64');

    const isValid = Buffer.from(signature, 'base64').equals(Buffer.from(expectedSignature, 'base64'));
    
    if (!isValid) return res.redirect('/api/payment-fail?reason=invalid');

    if (status?.toLowerCase() === 'success') {
      return res.redirect(`/api/payment-success?order_id=${platform_order_id}&payment_id=${payment_id}`);
    } else {
      return res.redirect(`/api/payment-fail?order_id=${platform_order_id}&reason=${status}`);
    }
  } catch (error) {
    res.redirect('/api/payment-fail?reason=error');
  }
});

// Status pages
app.get('/api/payment-success', (req, res) => {
  const { order_id, payment_id } = req.query;
  res.send(`<!DOCTYPE html><html><head><style>body{font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea,#764ba2);}.container{background:white;padding:50px;border-radius:20px;text-align:center;max-width:500px;}.success-icon{width:100px;height:100px;background:#48bb78;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 30px;}.success-icon::after{content:"✓";color:white;font-size:50px;font-weight:bold;}</style></head><body><div class="container"><div class="success-icon"></div><h1>Payment Successful!</h1><p>Order: #${order_id}</p><p>Payment ID: ${payment_id}</p><a href="https://3dstlmodel.com" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:15px 40px;text-decoration:none;border-radius:30px;font-weight:bold;">Return to Store</a></div></body></html>`);
});

app.get('/api/payment-fail', (req, res) => {
  const { order_id, reason } = req.query;
  res.send(`<!DOCTYPE html><html><head><style>body{font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#ff6b6b,#ee5a5a);}.container{background:white;padding:50px;border-radius:20px;text-align:center;max-width:500px;}.error-icon{width:100px;height:100px;background:#fc8181;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 30px;}.error-icon::after{content:"✕";color:white;font-size:50px;}</style></head><body><div class="container"><div class="error-icon"></div><h1>Payment Failed</h1><p>Error: ${reason || 'Unknown'}</p><a href="https://3dstlmodel.com/cart" style="display:inline-block;background:#fc8181;color:white;padding:15px 40px;text-decoration:none;border-radius:30px;font-weight:bold;">Try Again</a></div></body></html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
