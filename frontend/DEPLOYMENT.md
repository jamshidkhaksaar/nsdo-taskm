# Production Deployment Guide

## Prerequisites
- Your NestJS backend is running at `https://api.nsdo.org.af`
- You have access to cPanel hosting (Namecheap)
- Node.js is available on your hosting environment

## Environment Setup

### Option 1: Automatic Production Configuration (Current Setup) ✅
The app is **already configured** to automatically use `https://api.nsdo.org.af` in production mode. No additional environment files needed!

### Option 2: Explicit Environment Variables (Optional)
If you want explicit control, create a `.env.production` file in your project root:
```
VITE_APP_API_URL=https://api.nsdo.org.af/api/v1
VITE_APP_WS_URL=wss://api.nsdo.org.af
NODE_ENV=production
VITE_APP_DEBUG=false
```

**Note**: Your current setup works without this file, but having it provides clarity and future flexibility.

## Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Production
```bash
npm run build:prod
```
This creates a `dist` folder with optimized production files.

### 3. Test Locally (Optional)
```bash
npm run serve
```
This serves the production build locally on port 4173.

## Deployment to cPanel

### Method 1: Direct Upload
1. Build the project: `npm run build:prod`
2. Compress the `dist` folder contents
3. Upload to your domain's public_html folder via cPanel File Manager
4. Extract the files directly in public_html (not in a subfolder)

### Method 2: Using cPanel Node.js App
1. In cPanel, go to "Node.js Apps"
2. Create a new Node.js application
3. Set the startup file to serve static files
4. Upload your built files to the app directory

## Important Files for Hosting

### `.htaccess` (For Apache servers)
- Handles SPA routing
- Sets security headers
- Enables compression
- Already created in your project root

### `_redirects` (For some hosting providers)
- Alternative routing configuration
- Located in `public/_redirects`

## Post-Deployment Checklist

1. **Test API Connection**: Verify the frontend can connect to `https://api.nsdo.org.af`
2. **Check Routing**: Test that all routes work (refresh on any page)
3. **Verify HTTPS**: Ensure all requests are over HTTPS
4. **Test Authentication**: Login/logout functionality
5. **Check Console**: No CORS or network errors

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure your NestJS backend includes your frontend domain in CORS configuration:
```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
});
```

### 404 Errors on Refresh
- Ensure `.htaccess` is in the root directory
- Check that mod_rewrite is enabled on your server

### API Connection Issues
- Verify the backend is accessible at `https://api.nsdo.org.af`
- Check SSL certificate validity
- Ensure API endpoints return proper CORS headers

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_API_URL` | Backend API URL | `https://api.nsdo.org.af/api/v1` |
| `VITE_APP_WS_URL` | WebSocket URL | `wss://api.nsdo.org.af` |
| `NODE_ENV` | Environment mode | `production` |

## Performance Optimization

The build is configured with:
- Code splitting for better loading
- Asset optimization
- Compression enabled
- Caching headers set
- Source maps disabled for security

## Security Features

- XSS protection headers
- Content type sniffing prevention
- Frame options set to DENY
- Referrer policy configured
- HTTPS enforcement (recommended) 