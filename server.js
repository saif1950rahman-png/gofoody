const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Data paths ────────────────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const RES_FILE   = path.join(DATA_DIR, 'reservations.json');
const MENU_FILE  = path.join(DATA_DIR, 'menu.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadJSON(file, fallback) {
  if (!fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(fallback, null, 2)); return fallback; }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// Seed default admin (password: admin123)
if (!fs.existsSync(ADMIN_FILE)) {
  const hash = bcrypt.hashSync('admin123', 10);
  saveJSON(ADMIN_FILE, { username: 'admin', password: hash });
}

// Seed default menu
const DEFAULT_MENU = [
  { id: uuidv4(), name: 'Truffle Risotto', category: 'Mains', price: 24.99, description: 'Creamy Arborio rice with black truffle, parmesan & fresh herbs.', image: '/images/truffle-risotto.jpg', featured: true },
  { id: uuidv4(), name: 'Burrata & Heirloom Tomato', category: 'Starters', price: 14.99, description: 'Fresh burrata, heirloom tomatoes, aged balsamic & basil oil.', image: '/images/burrata.jpg', featured: true },
  { id: uuidv4(), name: 'Pan-Seared Salmon', category: 'Mains', price: 28.99, description: 'Atlantic salmon, lemon beurre blanc, capers, asparagus.', image: '/images/salmon.jpg', featured: true },
  { id: uuidv4(), name: 'Chocolate Lava Cake', category: 'Desserts', price: 9.99, description: 'Warm dark chocolate cake, molten centre, vanilla bean ice cream.', image: '/images/lava-cake.jpg', featured: false },
  { id: uuidv4(), name: 'Caesar Salad', category: 'Starters', price: 12.99, description: 'Romaine hearts, house Caesar dressing, house-made croutons, parmesan shavings.', image: '/images/caesar.jpg', featured: false },
  { id: uuidv4(), name: 'Wagyu Beef Burger', category: 'Mains', price: 22.99, description: 'Wagyu beef patty, caramelised onions, aged cheddar, brioche bun, fries.', image: '/images/burger.jpg', featured: true },
  { id: uuidv4(), name: 'Mango Sorbet', category: 'Desserts', price: 7.99, description: 'House-made Alfonso mango sorbet with a mint sugar rim.', image: '/images/sorbet.jpg', featured: false },
  { id: uuidv4(), name: 'Wild Mushroom Soup', category: 'Starters', price: 11.99, description: 'Foraged mushroom velouté, truffle oil, crispy shallots.', image: '/images/mushroom-soup.jpg', featured: false },
];
if (!fs.existsSync(MENU_FILE)) saveJSON(MENU_FILE, DEFAULT_MENU);
if (!fs.existsSync(RES_FILE))  saveJSON(RES_FILE, []);

// ── Multer for image uploads ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(__dirname, 'public/images'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); cb(null, dir); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'gofoody_secret_2024', resave: false, saveUninitialized: false, cookie: { maxAge: 24 * 60 * 60 * 1000 } }));
app.set('view engine', 'html');

function authMiddleware(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ── Public HTML routes ────────────────────────────────────────────────────────
const sendPage = (page) => (req, res) => res.sendFile(path.join(__dirname, 'public', page));
app.get('/', sendPage('index.html'));
app.get('/menu', sendPage('menu.html'));
app.get('/reservation', sendPage('reservation.html'));
app.get('/contact', sendPage('contact.html'));

// ── API: Reservations ─────────────────────────────────────────────────────────
app.post('/api/reservations', (req, res) => {
  const { name, phone, email, date, time, guests, notes } = req.body;
  if (!name || !phone || !date || !time || !guests) return res.status(400).json({ error: 'Missing required fields.' });
  if (!/^\d{10,15}$/.test(phone.replace(/[\s\-\+\(\)]/g, ''))) return res.status(400).json({ error: 'Invalid phone number.' });
  const reservations = loadJSON(RES_FILE, []);
  const reservation = { id: uuidv4(), name, phone, email, date, time, guests: parseInt(guests), notes: notes || '', status: 'confirmed', createdAt: new Date().toISOString() };
  reservations.push(reservation);
  saveJSON(RES_FILE, reservations);
  res.json({ success: true, message: `Table booked! Confirmation #${reservation.id.slice(0,8).toUpperCase()}`, id: reservation.id });
});

// ── API: Menu (public) ────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => res.json(loadJSON(MENU_FILE, [])));

// ── Admin routes ──────────────────────────────────────────────────────────────
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-login.html')));
app.post('/admin/login', (req, res) => {
  const admin = loadJSON(ADMIN_FILE, {});
  if (req.body.username === admin.username && bcrypt.compareSync(req.body.password, admin.password)) {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
});
app.post('/admin/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/admin', authMiddleware, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Admin API: reservations
app.get('/admin/api/reservations', authMiddleware, (req, res) => res.json(loadJSON(RES_FILE, [])));
app.patch('/admin/api/reservations/:id', authMiddleware, (req, res) => {
  const reservations = loadJSON(RES_FILE, []);
  const idx = reservations.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  reservations[idx] = { ...reservations[idx], ...req.body };
  saveJSON(RES_FILE, reservations);
  res.json(reservations[idx]);
});
app.delete('/admin/api/reservations/:id', authMiddleware, (req, res) => {
  let reservations = loadJSON(RES_FILE, []);
  reservations = reservations.filter(r => r.id !== req.params.id);
  saveJSON(RES_FILE, reservations);
  res.json({ success: true });
});

// Admin API: menu
app.get('/admin/api/menu', authMiddleware, (req, res) => res.json(loadJSON(MENU_FILE, [])));
app.post('/admin/api/menu', authMiddleware, upload.single('image'), (req, res) => {
  const menu = loadJSON(MENU_FILE, []);
  const item = {
    id: uuidv4(),
    name: req.body.name,
    category: req.body.category,
    price: parseFloat(req.body.price),
    description: req.body.description,
    image: req.file ? `/images/${req.file.filename}` : (req.body.imageUrl || '/images/default.jpg'),
    featured: req.body.featured === 'true'
  };
  menu.push(item);
  saveJSON(MENU_FILE, menu);
  res.json(item);
});
app.put('/admin/api/menu/:id', authMiddleware, upload.single('image'), (req, res) => {
  const menu = loadJSON(MENU_FILE, []);
  const idx = menu.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  menu[idx] = {
    ...menu[idx],
    name: req.body.name,
    category: req.body.category,
    price: parseFloat(req.body.price),
    description: req.body.description,
    featured: req.body.featured === 'true',
    image: req.file ? `/images/${req.file.filename}` : (req.body.imageUrl || menu[idx].image)
  };
  saveJSON(MENU_FILE, menu);
  res.json(menu[idx]);
});
app.delete('/admin/api/menu/:id', authMiddleware, (req, res) => {
  let menu = loadJSON(MENU_FILE, []);
  menu = menu.filter(m => m.id !== req.params.id);
  saveJSON(MENU_FILE, menu);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`\n🍽️  Go Foody running at http://localhost:${PORT}\n`));
