// Visitor Pass QR Generator Service
// Copy this entire file to GitHub

const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Store passes in memory (temporary storage)
const passes = new Map();

// Home page - Check if service is running
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Visitor Pass Service</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .card {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #667eea; }
                .status { 
                    color: #28a745; 
                    font-size: 24px;
                    margin: 20px 0;
                }
                code {
                    background: #f4f4f4;
                    padding: 10px;
                    border-radius: 5px;
                    display: block;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>✅ Visitor Pass Service</h1>
                <p class="status">Service is running!</p>
                <p><strong>API Endpoint:</strong></p>
                <code>POST ${req.protocol}://${req.get('host')}/api/pass/create</code>
                <p style="margin-top: 20px;"><strong>Test Request:</strong></p>
                <code>
curl -X POST ${req.protocol}://${req.get('host')}/api/pass/create \\
  -H "Content-Type: application/json" \\
  -d '{"requestId":"TEST-001","visitorName":"John Doe"}'
                </code>
            </div>
        </body>
        </html>
    `);
});

// API: Create Visitor Pass
app.post('/api/pass/create', async (req, res) => {
    try {
        const {
            requestId,
            visitorName,
            visitorEmail,
            visitorPhone,
            hostName,
            location,
            purpose,
            validFrom,
            validTo
        } = req.body;

        // Check required fields
        if (!requestId) {
            return res.status(400).json({
                success: false,
                error: 'requestId is required'
            });
        }

        // Use provided name or default
        const name = visitorName || 'Guest Visitor';

        // Generate unique token
        const token = Buffer.from(
            `${requestId}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`
        ).toString('base64url');

        // Store pass data
        passes.set(token, {
            requestId,
            visitorName: name,
            visitorEmail: visitorEmail || '',
            visitorPhone: visitorPhone || '',
            hostName: hostName || '',
            location: location || '',
            purpose: purpose || '',
            validFrom: validFrom || new Date().toISOString(),
            validTo: validTo || new Date(Date.now() + 24*60*60*1000).toISOString(),
            status: 'active',
            createdAt: new Date().toISOString()
        });

        // Generate pass URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const passUrl = `${baseUrl}/pass/${token}`;

        console.log(`✅ Pass created: ${requestId} → ${token.substring(0, 20)}...`);

        // Return URL to WorkHub24
        res.json({
            success: true,
            requestId: requestId,
            passUrl: passUrl,
            token: token,
            message: 'Visitor pass created successfully'
        });

    } catch (error) {
        console.error('❌ Error creating pass:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Display Pass Page (when visitor clicks SMS link)
app.get('/pass/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Get pass data
        const passData = passes.get(token);

        if (!passData) {
            return res.send(errorPage('Pass not found or expired'));
        }

        // Check if expired
        const now = new Date();
        const validTo = new Date(passData.validTo);
        const isExpired = now > validTo;

        if (isExpired) {
            passData.status = 'expired';
        }

        // Generate QR code - just the request ID
        const qrData = passData.requestId;

        const qrCodeImage = await QRCode.toDataURL(qrData, {
            width: 400,
            margin: 2
        });

        // Show pass page
        res.send(passPage(passData, qrCodeImage, isExpired));

    } catch (error) {
        console.error('❌ Error displaying pass:', error);
        res.send(errorPage('Unable to load pass'));
    }
});

// Pass Display HTML
function passPage(pass, qrCode, isExpired) {
    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visitor Pass</title>
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
        .card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .content { padding: 30px 20px; }
        .qr-box {
            text-align: center;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 15px;
            margin-bottom: 25px;
        }
        .qr-code {
            max-width: 300px;
            width: 100%;
            border: 5px solid white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .info-row {
            display: flex;
            padding: 14px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child { border-bottom: none; }
        .label {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
            font-size: 15px;
        }
        .value {
            color: #212529;
            font-size: 15px;
            flex: 1;
        }
        .badge {
            display: inline-block;
            padding: 8px 18px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-active { background: #d4edda; color: #155724; }
        .badge-expired { background: #f8d7da; color: #721c24; }
        .alert {
            padding: 16px;
            border-radius: 10px;
            margin-top: 25px;
            font-size: 15px;
            line-height: 1.6;
        }
        .alert-success {
            background: #d4edda;
            border-left: 4px solid #28a745;
            color: #155724;
        }
        .alert-warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            color: #856404;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            font-size: 13px;
            color: #6c757d;
        }
        @media print {
            body { background: white; }
            .footer { display: none; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>🏢 Visitor Pass</h1>
            <p>Welcome to BitSlize Concept</p>
        </div>
        <div class="content">
            <div class="qr-box">
                <img src="${qrCode}" class="qr-code" alt="QR Code">
            </div>
            <div class="info">
                <div class="info-row">
                    <span class="label">Visitor Name:</span>
                    <span class="value"><strong>${pass.visitorName}</strong></span>
                </div>
                ${pass.visitorEmail ? `
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${pass.visitorEmail}</span>
                </div>` : ''}
                ${pass.hostName ? `
                <div class="info-row">
                    <span class="label">Host:</span>
                    <span class="value">${pass.hostName}</span>
                </div>` : ''}
                ${pass.location ? `
                <div class="info-row">
                    <span class="label">Location:</span>
                    <span class="value">${pass.location}</span>
                </div>` : ''}
                ${pass.purpose ? `
                <div class="info-row">
                    <span class="label">Purpose:</span>
                    <span class="value">${pass.purpose}</span>
                </div>` : ''}
                <div class="info-row">
                    <span class="label">Valid From:</span>
                    <span class="value">${formatDate(pass.validFrom)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Valid Until:</span>
                    <span class="value">${formatDate(pass.validTo)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="badge ${isExpired ? 'badge-expired' : 'badge-active'}">
                            ${isExpired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                    </span>
                </div>
            </div>
            ${isExpired ? `
            <div class="alert alert-warning">
                ⚠️ <strong>This pass has expired.</strong><br>
                Please contact your host to request a new pass.
            </div>` : `
            <div class="alert alert-success">
                ✅ <strong>Your pass is active!</strong><br>
                Please show this QR code to the security personnel at reception.
            </div>`}
        </div>
        <div class="footer">
            Pass ID: ${pass.requestId}<br>
            Generated: ${formatDate(pass.createdAt)}
        </div>
    </div>
</body>
</html>`;
}

// Error Page HTML
function errorPage(message) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .error {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        h1 { color: #dc3545; font-size: 48px; margin-bottom: 20px; }
        p { color: #666; font-size: 18px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="error">
        <h1>⚠️</h1>
        <h2>Error</h2>
        <p>${message}</p>
    </div>
</body>
</html>`;
}

// Auto-cleanup old passes (runs every hour)
setInterval(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [token, pass] of passes.entries()) {
        const created = new Date(pass.createdAt).getTime();
        if (now - created > oneDay) {
            passes.delete(token);
            console.log(`🗑️ Cleaned up old pass: ${pass.requestId}`);
        }
    }
}, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log('✅ Visitor Pass Service is RUNNING!');
    console.log(`🌐 Port: ${PORT}`);
    console.log('🚀 ========================================');
    console.log('');
});
