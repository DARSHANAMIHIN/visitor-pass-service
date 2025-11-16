// Minimalist Visitor Pass QR Generator
// Short URLs - Just Request ID

const express = require('express');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Store active passes (in-memory)
const activePasses = new Map();

// ============================================
// HOME PAGE - Service Status
// ============================================
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Visitor Pass Service</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    max-width: 600px;
                }
                h1 { color: #667eea; margin-bottom: 10px; }
                .status { 
                    color: #28a745; 
                    font-size: 20px;
                    font-weight: 600;
                    margin: 20px 0;
                }
                .info { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 20px 0;
                }
                code {
                    background: #2d2d2d;
                    color: #f8f8f2;
                    padding: 15px;
                    border-radius: 5px;
                    display: block;
                    margin: 10px 0;
                    overflow-x: auto;
                    font-size: 13px;
                }
                .endpoint {
                    color: #667eea;
                    font-weight: 600;
                    font-size: 14px;
                    margin-top: 15px;
                }
                .feature {
                    background: #d4edda;
                    padding: 10px 15px;
                    border-radius: 5px;
                    margin: 10px 0;
                    color: #155724;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ Visitor Pass Service</h1>
                <p class="status">Service is running!</p>
                
                <div class="feature">
                    ⚡ New: Shorter URLs for easier scanning!
                </div>
                
                <div class="info">
                    <strong>API Endpoint:</strong>
                    <p class="endpoint">POST ${req.protocol}://${req.get('host')}/api/pass/create</p>
                </div>
                
                <strong>Test Request:</strong>
                <code>curl -X POST ${req.protocol}://${req.get('host')}/api/pass/create \\
  -H "Content-Type: application/json" \\
  -d '{"requestId":"TEST-001"}'</code>
                
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    Minimalist & Secure - Short QR Codes
                </p>
            </div>
        </body>
        </html>
    `);
});

// ============================================
// API: CREATE VISITOR PASS
// ============================================
app.post('/api/pass/create', async (req, res) => {
    try {
        const { requestId } = req.body;

        // Validate request ID
        if (!requestId) {
            return res.status(400).json({
                success: false,
                error: 'requestId is required'
            });
        }

        // Calculate expiry (24 hours from now)
        const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Store pass using requestId as key (simple!)
        activePasses.set(requestId, {
            requestId: requestId,
            createdAt: new Date().toISOString(),
            expiresAt: expiryTime.toISOString(),
            status: 'active'
        });

        // Generate SHORT pass URL (just /pass/requestId)
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const passUrl = `${baseUrl}/pass/${requestId}`;

        console.log(`✅ Pass created: ${requestId}`);

        // Return response
        res.json({
            success: true,
            requestId: requestId,
            passUrl: passUrl,
            expiresAt: expiryTime.toISOString()
        });

    } catch (error) {
        console.error('❌ Error creating pass:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// DISPLAY VISITOR PASS (When User Clicks Link)
// ============================================
app.get('/pass/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // Get pass data using requestId directly
        const passData = activePasses.get(requestId);

        if (!passData) {
            return res.send(errorPage('Pass not found or has expired'));
        }

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(passData.expiresAt);
        const isExpired = now > expiresAt;

        if (isExpired) {
            passData.status = 'expired';
        }

        // Generate QR code (JUST request ID - very short!)
        const qrCodeImage = await QRCode.toDataURL(passData.requestId, {
            width: 350,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M' // Medium is fine for short text
        });

        // Display pass page
        res.send(passPage(passData, qrCodeImage, isExpired));

    } catch (error) {
        console.error('❌ Error displaying pass:', error);
        res.send(errorPage('Unable to load visitor pass'));
    }
});

// ============================================
// PASS PAGE HTML (Minimalist Design)
// ============================================
function passPage(pass, qrCode, isExpired) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#667eea">
    <title>Visitor Pass - ${pass.requestId}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            max-width: 420px;
            width: 100%;
            overflow: hidden;
            animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 35px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .reference-section {
            margin-bottom: 35px;
        }
        
        .reference-label {
            font-size: 15px;
            color: #6c757d;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .reference-number {
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
        }
        
        .qr-container {
            background: #f8f9fa;
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            display: inline-block;
        }
        
        .qr-code {
            width: 100%;
            max-width: 280px;
            height: auto;
            display: block;
            border-radius: 8px;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 600;
            margin: 25px 0 15px 0;
            letter-spacing: 0.5px;
        }
        
        .status-active {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            color: #155724;
        }
        
        .status-expired {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            color: #721c24;
        }
        
        .status-icon {
            font-size: 18px;
        }
        
        .instructions {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            font-size: 14px;
            color: #495057;
            line-height: 1.6;
        }
        
        .instructions-expired {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
        }
        
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            text-align: center;
            font-size: 12px;
            color: #adb5bd;
            border-top: 1px solid #e9ecef;
        }
        
        @media (max-width: 480px) {
            .card {
                border-radius: 0;
                min-height: 100vh;
            }
            
            .reference-number {
                font-size: 28px;
            }
            
            .qr-code {
                max-width: 250px;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .card {
                box-shadow: none;
                max-width: 100%;
            }
            
            .instructions,
            .footer {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>🎫 Visitor Pass</h1>
        </div>
        
        <div class="content">
            <div class="reference-section">
                <div class="reference-label">Your reference number</div>
                <div class="reference-number">${pass.requestId}</div>
            </div>
            
            <div class="qr-container">
                <img src="${qrCode}" class="qr-code" alt="QR Code for ${pass.requestId}">
            </div>
            
            <div class="status-badge ${isExpired ? 'status-expired' : 'status-active'}">
                <span class="status-icon">${isExpired ? '⏰' : '✓'}</span>
                <span>${isExpired ? 'EXPIRED' : 'ACTIVE'}</span>
            </div>
            
            <div class="instructions ${isExpired ? 'instructions-expired' : ''}">
                ${isExpired 
                    ? '⚠️ This pass has expired. Please contact your host to request a new pass.'
                    : '📱 Show this QR code to security personnel at the reception desk.'
                }
            </div>
        </div>
        
        <div class="footer">
            Pass ID: ${pass.requestId} • Generated: ${new Date(pass.createdAt).toLocaleDateString()}
        </div>
    </div>
</body>
</html>`;
}

// ============================================
// ERROR PAGE HTML
// ============================================
function errorPage(message) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .error-container {
            background: white;
            padding: 50px 40px;
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
            text-align: center;
            max-width: 400px;
        }
        .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 24px;
            color: #2d3748;
            margin-bottom: 15px;
        }
        p {
            color: #718096;
            font-size: 16px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>Unable to Load Pass</h1>
        <p>${message}</p>
    </div>
</body>
</html>`;
}

// ============================================
// CLEANUP OLD PASSES (Every Hour)
// ============================================
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [requestId, pass] of activePasses.entries()) {
        const expiresAt = new Date(pass.expiresAt).getTime();
        
        // Remove if expired more than 1 hour ago
        if (now - expiresAt > 60 * 60 * 1000) {
            activePasses.delete(requestId);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🗑️  Cleaned up ${cleanedCount} expired pass(es)`);
    }
}, 60 * 60 * 1000); // Run every hour

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀  VISITOR PASS SERVICE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅  Status: Running`);
    console.log(`🌐  Port: ${PORT}`);
    console.log(`🔒  Mode: Minimalist & Secure`);
    console.log(`⚡  Feature: Short URLs`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});
