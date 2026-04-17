# 🍽️ Go Foody – Restaurant Website

A complete, modern restaurant website with public pages, online reservations, and an admin panel.

---

## 🚀 Quick Start (3 steps)

### Step 1 – Install dependencies
```bash
cd gofoody
npm install
```

### Step 2 – Start the server
```bash
npm start
```

### Step 3 – Open in browser
```
http://localhost:3000
```

---

## 📋 Pages

| URL | Description |
|-----|-------------|
| `/` | Home page with hero, featured menu, reviews |
| `/menu` | Full menu with category tabs |
| `/reservation` | Table booking form |
| `/contact` | Contact info & message form |
| `/admin` | Admin dashboard (login required) |

---

## 🔐 Admin Login

- **URL:** `http://localhost:3000/admin`
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change the password before going live! Edit `data/admin.json` and replace the hash using:
```bash
node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR_NEW_PASSWORD',10))"
```

---

## 📁 File Structure

```
gofoody/
├── server.js            # Express backend
├── package.json
├── public/
│   ├── index.html       # Home
│   ├── menu.html        # Menu
│   ├── reservation.html # Bookings
│   ├── contact.html     # Contact
│   ├── admin.html       # Admin dashboard
│   ├── admin-login.html # Admin login
│   ├── css/
│   │   └── style.css    # All styles
│   ├── js/
│   │   └── app.js       # Shared JS
│   └── images/          # Uploaded images
└── data/                # JSON storage (auto-created)
    ├── reservations.json
    ├── menu.json
    └── admin.json
```

---

## 🌐 Deploy to Render (free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set **Build command:** `npm install`
5. Set **Start command:** `npm start`
6. Deploy ✅

---

## 🗺️ Add Google Maps

In `contact.html`, replace this block:
```html
<div class="map-embed" ...>📍 Map Embed Here</div>
```
With your actual Google Maps embed iframe from [maps.google.com](https://maps.google.com).

---

## 🖼️ Add Real Food Images

Replace image URLs in `data/menu.json` with real URLs from:
- [Unsplash](https://unsplash.com/s/photos/food) (free)
- Your own uploaded photos via the admin panel

---

## ✉️ Hook Up Contact Form

The contact form currently simulates sending. To connect real email, add:
- [SendGrid](https://sendgrid.com) or [Nodemailer](https://nodemailer.com) to `server.js`
- Add a `POST /api/contact` route

---

## 🛡️ Production Checklist

- [ ] Change admin password
- [ ] Set `SESSION_SECRET` env variable
- [ ] Add HTTPS (handled by Render/Vercel automatically)
- [ ] Add Google Maps embed
- [ ] Replace placeholder food images
- [ ] Connect real email for contact form
