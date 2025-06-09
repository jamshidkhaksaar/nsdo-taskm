# Quick Deployment Guide for cPanel

## Your Frontend is Ready! 🎉

Your frontend has been successfully configured to connect to your backend at `https://api.nsdo.org.af`.

## What's Been Configured:

✅ **API URLs**: All services now point to `https://api.nsdo.org.af/api/v1`  
✅ **Production Build**: Optimized for hosting  
✅ **SPA Routing**: `.htaccess` file for proper routing  
✅ **Security Headers**: XSS protection, content type sniffing prevention  
✅ **Performance**: Code splitting, compression, caching  

## Deployment Steps:

### 1. Build the Project (Already Done)
```bash
npm run build
```
This created the `dist` folder with all production files.

### 2. Upload to cPanel
1. **Login to your cPanel** (Namecheap hosting)
2. **Go to File Manager**
3. **Navigate to public_html** (or your domain's folder)
4. **Upload the contents of the `dist` folder** (not the folder itself)
   - Upload: `index.html`, `assets/`, `manifest.webmanifest`, etc.
   - Make sure `.htaccess` is uploaded too

### 3. Alternative: Using cPanel Node.js App
1. **Go to "Node.js Apps"** in cPanel
2. **Create New App**
3. **Upload your `dist` folder contents**
4. **Set startup file** to serve static files

## Important Files in Your Build:

- **`index.html`**: Main application file
- **`assets/`**: All CSS, JS, and image files
- **`.htaccess`**: Handles routing for React Router
- **`_redirects`**: Alternative routing file
- **`manifest.webmanifest`**: PWA configuration

## Database Connection:

**You DON'T need to connect directly to the database!** 

Your frontend connects to your NestJS backend at `https://api.nsdo.org.af`, and your backend handles all database operations. This is the correct architecture:

```
Frontend (React) → Backend API (NestJS) → Database
```

## Testing After Deployment:

1. **Visit your domain**
2. **Check browser console** for any errors
3. **Test login functionality**
4. **Verify API calls** are going to `https://api.nsdo.org.af`
5. **Test routing** by refreshing on different pages

## Troubleshooting:

### If you get CORS errors:
Make sure your NestJS backend allows your frontend domain in CORS settings.

### If routing doesn't work:
Ensure `.htaccess` is in the root directory and mod_rewrite is enabled.

### If API calls fail:
- Check that `https://api.nsdo.org.af` is accessible
- Verify SSL certificate is valid
- Check network tab in browser dev tools

## Your Frontend is Production-Ready! 🚀

All configurations point to your production backend. Just upload the `dist` folder contents to your hosting and you're good to go! 