const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

// static frontend (serve root)
app.use('/', express.static(path.join(__dirname, '..')));

// initialize sqlite db
const DBSOURCE = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(DBSOURCE, (err)=>{
  if(err){ console.error(err); process.exit(1); }
  console.log('Connected to SQLite DB');
});

// create tables
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT, price INTEGER, lat REAL, lng REAL, img TEXT, desc TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT, customer_phone TEXT, customer_address TEXT, total INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER, product_id INTEGER, qty INTEGER, price INTEGER
  )`);
});

// seed products if empty
db.get('SELECT COUNT(*) as cnt from products', (err,row)=>{
  if(err) return console.error(err);
  if(row.cnt === 0){
    const seed = [
      {id:1,name:'Map A - Jakarta',price:125000,lat:-6.2,lng:106.816666,img:'assets/images/map-a.jpg',desc:'Peta area Jakarta, ukuran A3'},
      {id:2,name:'Map B - Bandung',price:98000,lat:-6.914744,lng:107.60981,img:'assets/images/map-b.jpg',desc:'Peta Bandung, tahan air'},
      {id:3,name:'Map C - Surabaya',price:110000,lat:-7.257472,lng:112.752088,img:'assets/images/map-c.jpg',desc:'Peta Surabaya, detail jalan'}
    ];
    const stmt = db.prepare('INSERT INTO products(id,name,price,lat,lng,img,desc) VALUES(?,?,?,?,?,?,?)');
    seed.forEach(p=> stmt.run(p.id,p.name,p.price,p.lat,p.lng,p.img,p.desc));
    stmt.finalize();
    console.log('Seeded products');
  }
});

// API: get products
app.get('/api/products', (req, res)=>{
  db.all('SELECT * FROM products', (err, rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// API: create order
app.post('/api/orders', (req, res)=>{
  const { customer, items } = req.body;
  if(!customer || !items || !Array.isArray(items)) return res.status(400).json({error:'Invalid payload'});
  const total = items.reduce((s,i)=>s+(i.price*i.qty),0);
  db.run(`INSERT INTO orders (customer_name, customer_phone, customer_address, total) VALUES (?,?,?,?)`,
    [customer.name, customer.phone, customer.address, total], function(err){
      if(err) return res.status(500).json({error:err.message});
      const orderId = this.lastID;
      const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?,?,?,?)');
      items.forEach(it=> stmt.run(orderId, it.id, it.qty, it.price));
      stmt.finalize();
      res.json({orderId});
  });
});

// start server
app.listen(PORT, ()=> console.log('Server running on port', PORT));
