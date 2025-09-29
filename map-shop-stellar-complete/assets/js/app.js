/* app.js - map + product list + cart (simple demo) */
/* Frontend fetches products from /api/products when available, fallback to local list */

const fallbackProducts = [
  { id:1, name:"Map A - Jakarta", price:125000, lat:-6.200000, lng:106.816666, img:"assets/images/map-a.jpg", desc:"Peta area Jakarta, ukuran A3" },
  { id:2, name:"Map B - Bandung", price:98000, lat:-6.914744, lng:107.609810, img:"assets/images/map-b.jpg", desc:"Peta Bandung, tahan air" },
  { id:3, name:"Map C - Surabaya", price:110000, lat:-7.257472, lng:112.752088, img:"assets/images/map-c.jpg", desc:"Peta Surabaya, detail jalan" },
];

let products = fallbackProducts;
let cart = JSON.parse(localStorage.getItem('cart_demo')) || [];

// try to load from API
fetch('/api/products').then(r=>{
  if(r.ok) return r.json();
  throw new Error('no api');
}).then(data=>{
  products = data;
  init();
}).catch(err=>{
  console.warn('Using fallback products', err);
  init();
});

function init(){
  // init map
  const map = L.map('map').setView([-6.2, 106.816666], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

  const markers = {};
  products.forEach(p=>{
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    marker.bindPopup(`<strong>${p.name}</strong><br>Rp ${p.price.toLocaleString()}<br><button onclick="addToCart(${p.id})">Tambah ke Keranjang</button>`);
    markers[p.id] = marker;
  });

  window.focusOn = function(id){
    const p = products.find(x=>x.id===id);
    if(!p) return;
    map.setView([p.lat, p.lng], 13, {animate:true});
    markers[id].openPopup();
  };

  // render list
  function renderList(items){
    const list = document.getElementById('list');
    list.innerHTML = '';
    items.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" style="width:100%; height:140px; object-fit:cover; border-radius:6px;"/>
        <h4 style="margin:8px 0 4px;">${p.name}</h4>
        <div style="font-size:0.95rem; color:#666">${p.desc}</div>
        <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
          <strong>Rp ${p.price.toLocaleString()}</strong>
          <div>
            <button onclick="focusOn(${p.id})" style="margin-right:6px;">Lihat di Peta</button>
            <button onclick="addToCart(${p.id})">Tambah</button>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }
  renderList(products);

  // cart functions
  window.addToCart = function(id){
    const p = products.find(x=>x.id===id);
    if(!p) return;
    const found = cart.find(x=>x.id===id);
    if(found) found.qty += 1; else cart.push({id:p.id, name:p.name, price:p.price, qty:1});
    saveCart();
  };
  window.removeFromCart = function(id){
    cart = cart.filter(x=>x.id!==id);
    saveCart();
  };
  window.changeQty = function(id, qty){
    const item = cart.find(x=>x.id===id);
    if(!item) return;
    item.qty = Math.max(1, qty);
    saveCart();
  };
  function saveCart(){ localStorage.setItem('cart_demo', JSON.stringify(cart)); renderCart(); }
  function renderCart(){
    const el = document.getElementById('cart-list');
    el.innerHTML = '';
    if(cart.length===0){ el.innerHTML = '<div>Kosong</div>'; document.getElementById('cart-total').innerText = '0'; return; }
    let total = 0;
    cart.forEach(i=>{
      total += i.price * i.qty;
      const row = document.createElement('div');
      row.style.display='flex';
      row.style.justifyContent='space-between';
      row.style.alignItems='center';
      row.style.marginBottom='8px';
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:600">${i.name}</div>
          <div style="font-size:0.85rem">Rp ${i.price.toLocaleString()}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="number" value="${i.qty}" min="1" style="width:60px" onchange="changeQty(${i.id}, parseInt(this.value))"/>
          <button onclick="removeFromCart(${i.id})">Hapus</button>
        </div>
      `;
      el.appendChild(row);
    });
    document.getElementById('cart-total').innerText = total.toLocaleString();
  }
  renderCart();

  document.getElementById('search').addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase().trim();
    const filtered = products.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    renderList(filtered);
  });

  document.getElementById('checkoutBtn').addEventListener('click', ()=>{
    if(cart.length===0){ alert('Keranjang kosong'); return; }
    document.getElementById('checkoutForm').style.display = document.getElementById('checkoutForm').style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('submitOrder').addEventListener('click', async ()=>{
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    if(!name||!phone||!address){ alert('Lengkapi data checkout'); return; }

    // POST to backend if available
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({customer:{name,phone,address}, items:cart})
      });
      if(res.ok){
        const data = await res.json();
        alert('Pesanan terkirim. ID: ' + data.orderId);
        cart = []; saveCart();
        document.getElementById('checkoutForm').style.display = 'none';
      } else {
        throw new Error('server error');
      }
    } catch(e){
      console.warn('Order saved locally (demo)', e);
      alert('Pesanan belum terkirim ke server. Cek console.');
      console.log({customer:{name,phone,address}, items:cart});
    }
  });
}
