# Deployment Guide for Samuel Adhikari's Portfolio

This guide assumes you have a VPS with **Ubuntu** (or similar Linux) and **512MB RAM**.

## 1. Local Setup (Do this on your computer first)

Since your server has low RAM, we will build the frontend **locally**.

1.  **Install Node.js**: Download from [nodejs.org](https://nodejs.org/).
2.  **Install Dependencies**:
    ```bash
    cd server
    npm install
    cd ../client
    npm install
    ```
3.  **Build Frontend**:
    ```bash
    cd client
    npm run build
    ```
    This creates a `dist` folder in `client/`. This folder contains your optimized website.

4.  **Move Build to Server Folder**:
    - Copy the contents of `client/dist` to `server/public` (create the `public` folder in `server` if it doesn't exist).
    - *Note: You might need to adjust `server/index.js` to serve these static files if you want to host everything on one port, OR use Nginx to serve the frontend.*

    **Recommended Approach for 512MB RAM**: Use Nginx to serve the `dist` folder and proxy API requests to Node.js.

## 2. Server Setup (VPS)

### A. Add Swap Space (CRITICAL for 512MB RAM)
Run these commands on your VPS to add 1GB of "fake" RAM:
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### B. Install Node.js & Nginx
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### C. Upload Files
Upload your `server` folder and the `client/dist` folder to your VPS (e.g., using FileZilla) to `/var/www/portfolio`.

Structure on server:
```
/var/www/portfolio/
  ├── server/
  │    ├── index.js
  │    ├── package.json
  │    └── ...
  └── client_build/  (rename 'dist' to 'client_build')
       ├── index.html
       └── assets/
```

### D. Start Backend
```bash
cd /var/www/portfolio/server
npm install --production
pm2 start index.js --name "portfolio-api"
pm2 save
```

### E. Configure Nginx
Create a config file: `sudo nano /etc/nginx/sites-available/portfolio`

```nginx
server {
    listen 80;
    server_name your-domain.com.np;

    # Frontend (React)
    location / {
        root /var/www/portfolio/client_build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend (API)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 3. Domain Setup (.com.np)
1.  Go to [register.com.np](https://register.com.np/).
2.  Create an account.
3.  Request `samueladhikari.com.np` (or similar).
4.  **Nameservers**: You need to point these to your VPS provider's nameservers (e.g., `ns1.digitalocean.com`, `ns2.digitalocean.com`) or use Cloudflare (recommended).
5.  Submit the request with your **Citizenship** and a **Cover Letter**.
6.  Wait for approval (usually 1-2 days).

## 4. MongoDB Atlas
1.  Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Go to **Network Access** -> Allow Access from Anywhere (0.0.0.0/0) OR add your VPS IP.
3.  Go to **Database Access** -> Create a user.
4.  Get the **Connection String**.
5.  Create a `.env` file in your `server` folder on the VPS and paste the URI:
    ```
    MONGODB_URI=mongodb+srv://...
    ```
