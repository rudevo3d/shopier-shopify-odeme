const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// ============================================
// CORS - CRITICAL FIX FOR SHOPIFY
// ============================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Alternative CORS middleware as backup
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================
// HTML TEMPLATES
// ============================================

const successPage = (orderId, paymentId) => `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Thank You!</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideUp 0.6s ease;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .success-icon {
            width: 100px;
            height: 100px;
            background: #48bb78;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease 0.3s both;
        }
        @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }
        .success-icon::after {
            content: "✓";
            color: white;
            font-size: 50px;
            font-weight: bold;
        }
        h1 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 28px;
        }
        p {
            color: #718096;
            margin-bottom: 10px;
            line-height: 1.6;
        }
        .order-info {
            background: #f7fafc;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            text-align: left;
        }
        .order-info p {
            margin: 8px 0;
            font-size: 14px;
        }
        .order-info strong {
            color: #2d3748;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            margin-top: 20px;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon"></div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your order.</p>
        <div class="order-info">
            <p><strong>Order Number:</strong> #${orderId}</p>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString('tr-TR')}</p>
        </div>
        <a href="https://3dstlmodel.com" class="btn">Return to Store</a>
    </div>
</body>
</html>`;

const failPage = (orderId, reason) => `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .error-icon {
            width: 100px;
            height: 100px;
            background: #fc8181;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
        }
        .error-icon::after {
            content: "✕";
            color: white;
            font-size: 50px;
            font-weight: bold;
        }
        h1 {
            color: #c53030;
            margin-bottom: 15px;
            font-size: 28px;
        }
        p {
            color: #718096;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background: #fc8181;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #f56565;
            transform: translateY(-3px);
        }
        .btn-secondary {
            background: #a0aec0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"></div>
        <h1>Payment Failed</h1>
        <p>An error occurred during the transaction.</p>
        <p style="font-size: 12px; color: #a0aec0;">${reason || ''}</p>
        <div>
            <a href="https://3dstlmodel.com/cart" class="btn">Try Again</a>
            <a href="https://3dstlmodel.com" class="btn btn-secondary">Home</a>
        </div>
    </div>
</body>
</html>`;

// ============================================
// SHOPIER PAYMENT INITIATION
// ============================================
app.post('/api/odeme-baslat', (req, res) => {
    try {
        const { order_id, amount, buyer, product_name } = req.body;
        
        const API_KEY = process.env.SHOPIER_API_KEY;
        const API_SECRET = process.env.SHOPIER_API_SECRET;
        
        if (!API_KEY || !API_SECRET) {
            return res.status(500).json({ error: 'API configuration missing' });
        }

        const platformOrderId = order_id || 'ORD-' + Date.now();
        const randomNr = Math.floor(Math.random() * 1000000);
        const currency = 'TRY';
        const callbackUrl = process.env.CALLBACK_URL || 'https://shopier-shopify-odeme-j33kvhbl0-rudevo.vercel.app/api/callback';
        
        // Generate signature
        const signatureString = `${randomNr}${platformOrderId}${amount}${currency}`;
        const signature = crypto
            .createHmac('sha256', API_SECRET)
            .update(signatureString)
            .digest('base64');

        // Shopier form data
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
            product_name: product_name || 'Product Purchase',
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

        // Create HTML form
        const formHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Shopier Payment</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #f0f2f5;
                    }
                    .loading-box {
                        text-align: center;
                        background: white;
                        padding: 40px;
                        border-radius: 15px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    }
                    .spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid #e2e8f0;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    p {
                        color: #4a5568;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="loading-box">
                    <div class="spinner"></div>
                    <p>Redirecting to Shopier payment page...</p>
                    <p style="font-size: 12px; color: #a0aec0; margin-top: 10px;">Please wait</p>
                </div>
                <form id="shopierForm" action="https://www.shopier.com/api/v1/payment" method="POST" style="display:none;">
                    ${Object.entries(formData).map(([key, value]) => 
                        `<input type="hidden" name="${key}" value="${value}">`
                    ).join('')}
                </form>
                <script>
                    setTimeout(() => {
                        document.getElementById('shopierForm').submit();
                    }, 1500);
                </script>
            </body>
            </html>
        `;

        const base64Html = Buffer.from(formHtml).toString('base64');
        res.json({
            success: true,
            payment_url: `data:text/html;base64,${base64Html}`
        });

    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Payment initiation failed: ' + error.message 
        });
    }
});

// ============================================
// SHOPIER CALLBACK HANDLER
// ============================================
app.post('/api/callback', (req, res) => {
    try {
        console.log('Shopier callback received:', req.body);
        
        const {
            random_nr,
            platform_order_id,
            total_order_value,
            currency,
            signature,
            status,
            payment_id
        } = req.body;

        // Verify signature
        const API_SECRET = process.env.SHOPIER_API_SECRET;
        const expectedSignature = crypto
            .createHmac('sha256', API_SECRET)
            .update(`${random_nr}${platform_order_id}${total_order_value}${currency}`)
            .digest('base64');

        const isValid = Buffer.from(signature, 'base64').equals(Buffer.from(expectedSignature, 'base64'));

        if (!isValid) {
            console.error('Invalid signature!');
            return res.redirect('/api/payment-fail?reason=invalid_signature');
        }

        if (status && status.toLowerCase() === 'success') {
            console.log('Payment successful:', platform_order_id);
            return res.redirect(`/api/payment-success?order_id=${platform_order_id}&payment_id=${payment_id}`);
        } else {
            console.log('Payment failed:', status);
            return res.redirect(`/api/payment-fail?order_id=${platform_order_id}&reason=${status}`);
        }

    } catch (error) {
        console.error('Callback processing error:', error);
        res.redirect('/api/payment-fail?reason=server_error');
    }
});

// ============================================
// PAYMENT STATUS PAGES
// ============================================
app.get('/api/payment-success', (req, res) => {
    const { order_id, payment_id } = req.query;
    res.send(successPage(order_id, payment_id));
});

app.get('/api/payment-fail', (req, res) => {
    const { order_id, reason } = req.query;
    res.send(failPage(order_id, reason));
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📋 Callback URL: ${process.env.CALLBACK_URL || 'Not set'}`);
});
