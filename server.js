// Minimalist Visitor Pass QR Generator
// Modern Glass Ticket Design

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
                    🎫 New: Modern Glass Pass Ticket Design!
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
                    Modern Ticket Design - Professional & Sleek
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

        // Store pass using requestId as key
        activePasses.set(requestId, {
            requestId: requestId,
            createdAt: new Date().toISOString(),
            expiresAt: expiryTime.toISOString()
        });

        // Generate SHORT pass URL
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

        // Get pass data
        const passData = activePasses.get(requestId);

        if (!passData) {
            return res.send(errorPage('Pass not found or has expired'));
        }

        // Generate QR code
        const qrCodeImage = await QRCode.toDataURL(passData.requestId, {
            width: 350,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });

        // Display modern pass page
        res.send(modernPassPage(passData, qrCodeImage));

    } catch (error) {
        console.error('❌ Error displaying pass:', error);
        res.send(errorPage('Unable to load visitor pass'));
    }
});

// ============================================
// MODERN GLASS PASS TICKET DESIGN
// ============================================
function modernPassPage(pass, qrCode) {
    const createdDate = new Date(pass.createdAt);
    const formattedDate = createdDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const formattedTime = createdDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        
        /* Animated background elements */
        body::before {
            content: '';
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            top: -250px;
            right: -250px;
            animation: float 15s infinite ease-in-out;
        }
        
        body::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
            bottom: -200px;
            left: -200px;
            animation: float 20s infinite ease-in-out reverse;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(30px, 30px) rotate(180deg); }
        }
        
        .ticket {
            background: white;
            border-radius: 24px;
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            max-width: 420px;
            width: 100%;
            overflow: hidden;
            position: relative;
            z-index: 1;
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        /* Glass morphism header */
        .ticket-header {
            background: 
                linear-gradient(135deg, 
                    rgba(102, 126, 234, 0.95) 0%, 
                    rgba(118, 75, 162, 0.95) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Glass shine effect */
        .ticket-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                45deg,
                transparent 30%,
                rgba(255, 255, 255, 0.15) 50%,
                transparent 70%
            );
            animation: shine 3s infinite;
        }
        
        @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%); }
            100% { transform: translateX(100%) translateY(100%); }
        }
        
        .ticket-header h1 {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.5px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .ticket-icon {
            font-size: 32px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        
        /* Perforation effect */
        .perforation {
            height: 20px;
            background: 
                radial-gradient(circle at 10px 0px, transparent 10px, white 10px) repeat-x,
                linear-gradient(white, white);
            background-size: 20px 20px, 100% 100%;
            background-position: 0 10px, 0 0;
        }
        
        .ticket-body {
            padding: 40px 30px;
            background: white;
        }
        
        /* Reference number section */
        .reference-box {
            text-align: center;
            margin-bottom: 35px;
        }
        
        .reference-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #9ca3af;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .reference-number {
            font-size: 36px;
            font-weight: 800;
            color: #1f2937;
            letter-spacing: 2px;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            padding: 10px 0;
        }
        
        /* QR code section */
        .qr-section {
            background: 
                linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 
                0 4px 15px rgba(0, 0, 0, 0.05),
                0 0 0 1px rgba(0, 0, 0, 0.02) inset;
        }
        
        .qr-code {
            width: 100%;
            max-width: 280px;
            height: auto;
            display: block;
            margin: 0 auto;
            border-radius: 12px;
            background: white;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }
        
        /* Instructions */
        .instructions {
            background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
            border-radius: 16px;
            padding: 20px;
            margin-top: 30px;
            text-align: center;
            border: 1px solid rgba(102, 126, 234, 0.2);
        }
        
        .instructions-icon {
            font-size: 28px;
            margin-bottom: 10px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        .instructions-text {
            font-size: 15px;
            color: #4c1d95;
            line-height: 1.6;
            font-weight: 500;
        }
        
        /* Ticket footer */
        .ticket-footer {
            padding: 25px 30px;
            background: linear-gradient(to bottom, #fafafa, #f5f5f5);
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px dashed #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .footer-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .footer-icon {
            font-size: 14px;
        }
        
        /* Mobile responsive */
        @media (max-width: 480px) {
            body {
                padding: 0;
            }
            
            .ticket {
                border-radius: 0;
                min-height: 100vh;
                max-width: 100%;
            }
            
            .reference-number {
                font-size: 30px;
            }
            
            .qr-code {
                max-width: 240px;
            }
            
            .ticket-footer {
                flex-direction: column;
                gap: 8px;
            }
        }
        
        /* Print styles */
        @media print {
            body {
                background: white;
            }
            
            body::before,
            body::after {
                display: none;
            }
            
            .ticket {
                box-shadow: none;
                max-width: 100%;
            }
            
            .instructions {
                display: none;
            }
        }
        
        /* Scan animation hint */
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        .qr-section:hover .qr-code {
            animation: pulse 2s ease-in-out infinite;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Glass Header -->
        <div class="ticket-header">
            <h1>
                <span class="ticket-icon">🎫</span>
                <span>Visitor Pass</span>
            </h1>
        </div>
        
        <!-- Perforation -->
        <div class="perforation"></div>
        
        <!-- Ticket Body -->
        <div class="ticket-body">
            <!-- Reference Number -->
            <div class="reference-box">
                <div class="reference-label">Pass Reference</div>
                <div class="reference-number">${pass.requestId}</div>
            </div>
            
            <!-- QR Code -->
            <div class="qr-section">
                <img src="${qrCode}" class="qr-code" alt="Visitor Pass QR Code">
            </div>
            
            <!-- Instructions -->
            <div class="instructions">
                <div class="instructions-icon">📱</div>
                <div class="instructions-text">
                    Present this QR code to security at the reception desk
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="ticket-footer">
            <div class="footer-item">
                <span class="footer-icon">📅</span>
                <span>${formattedDate}</span>
            </div>
            <div class="footer-item">
                <span class="footer-icon">🕐</span>
                <span>${formattedTime}</span>
            </div>
            <div class="footer-item">
                <span class="footer-icon">🔒</span>
                <span>Secure Pass</span>
            </div>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .error-container {
            background: white;
            padding: 50px 40px;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .error-icon {
            font-size: 72px;
            margin-bottom: 20px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }
        h1 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 15px;
            font-weight: 700;
        }
        p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>Pass Not Available</h1>
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
}, 60 * 60 * 1000);

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
    console.log(`🎫  Design: Modern Glass Ticket`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});
