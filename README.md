# 🎫 Visitor Pass QR Generator

A minimalist and secure Node.js application for generating temporary visitor passes with QR codes. Perfect for offices, events, or any facility that needs a simple digital visitor management system.

## ✨ Features

- **Simple QR Code Generation** - Creates unique QR codes for each visitor pass
- **Clean, Modern UI** - Minimalist design that works on all devices
- **Single-Page View** - No scrolling required, optimized for quick display
- **Automatic Expiry** - Passes expire after 24 hours
- **Auto Cleanup** - Expired passes are automatically removed from memory
- **RESTful API** - Easy integration with other systems
- **Mobile Responsive** - Works seamlessly on phones, tablets, and desktops

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install express qrcode
```

3. Start the server:
```bash
node server.js
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage

### Creating a Visitor Pass

Send a POST request to create a new pass:

```bash
curl -X POST http://localhost:3000/api/pass/create \
  -H "Content-Type: application/json" \
  -d '{"requestId":"VISITOR-001"}'
```

**Response:**
```json
{
  "success": true,
  "requestId": "VISITOR-001",
  "passUrl": "http://localhost:3000/pass/VISITOR-001",
  "expiresAt": "2025-11-29T10:30:00.000Z"
}
```

### Viewing a Pass

Simply open the `passUrl` in any browser. Visitors can:
- See their reference number
- Display the QR code to security
- Check expiry status

## 🔧 API Reference

### `POST /api/pass/create`

Creates a new visitor pass.

**Request Body:**
```json
{
  "requestId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "string",
  "passUrl": "string",
  "expiresAt": "ISO 8601 datetime"
}
```

### `GET /pass/:requestId`

Displays the visitor pass with QR code.

**Parameters:**
- `requestId` - The unique identifier for the pass

**Returns:** HTML page with QR code and pass details

## ⚙️ Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)

Example:
```bash
PORT=8080 node server.js
```

### Pass Expiry Duration

By default, passes expire after 24 hours. To change this, modify the following line in `server.js`:

```javascript
const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
```

Examples:
- 12 hours: `12 * 60 * 60 * 1000`
- 1 hour: `60 * 60 * 1000`
- 7 days: `7 * 24 * 60 * 60 * 1000`

## 🎨 Customization

### Colors & Branding

The gradient colors can be changed in the inline styles:

```javascript
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### QR Code Settings

Modify QR code properties in the `app.get('/pass/:requestId')` route:

```javascript
const qrCodeImage = await QRCode.toDataURL(passData.requestId, {
    width: 350,        // Size in pixels
    margin: 2,         // Margin around QR code
    color: {
        dark: '#000000',   // QR code color
        light: '#FFFFFF'   // Background color
    },
    errorCorrectionLevel: 'M'  // L, M, Q, H
});
```

## 📱 Mobile Optimization

The application is fully responsive and optimized for:
- iOS Safari
- Android Chrome
- Desktop browsers
- Tablets

Special optimizations for screens under 700px height ensure the pass fits without scrolling.

## 🔒 Security Considerations

**Current Implementation:**
- In-memory storage (data lost on restart)
- No authentication required
- Suitable for internal networks

**For Production Use, Consider:**
- Database storage (MongoDB, PostgreSQL, etc.)
- API authentication (API keys, JWT tokens)
- HTTPS encryption
- Rate limiting
- Input validation and sanitization
- Logging and monitoring

## 📦 Dependencies

- **express** - Web framework
- **qrcode** - QR code generation

## 🗂️ Project Structure

```
.
├── server.js          # Main application file
└── README.md          # This file
```

## 🛠️ Development

### Run in Development Mode

```bash
node server.js
```

### Using nodemon for Auto-Restart

```bash
npm install -g nodemon
nodemon server.js
```

## 📊 Memory Management

The application includes automatic cleanup:
- Runs every hour
- Removes passes expired for more than 1 hour
- Logs cleanup activity to console

## 🐛 Troubleshooting

**Port Already in Use:**
```bash
# Use a different port
PORT=3001 node server.js
```

**QR Code Not Displaying:**
- Check browser console for errors
- Ensure the QRCode package is installed
- Verify the pass hasn't expired

**Pass Not Found:**
- Server may have restarted (in-memory storage)
- Pass may have been cleaned up (expired > 1 hour ago)
- Check the requestId is correct

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💡 Use Cases

- **Corporate Offices** - Visitor check-in system
- **Events & Conferences** - Digital event passes
- **Coworking Spaces** - Guest access management
- **Educational Institutions** - Temporary visitor permits
- **Healthcare Facilities** - Patient visitor tracking

## 🔄 Future Enhancements

Potential features to add:
- Database persistence
- Multi-tenant support
- Email delivery of passes
- SMS notifications
- Admin dashboard
- Visitor check-in logging
- Custom branding per organization
- Photo upload support
- Multiple language support

## 📞 Support

For questions or issues, please create an issue in the repository.

---

Made with ❤️ for simplified visitor management
