import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import CollabPage from './pages/CollabPage.jsx';
import { ProductModal, ConfirmationModal } from './components/Modals.jsx';
import { apiFetch, parseJsonSafe } from './utils/api.js';

const pizzaImage = '/pizza.gif';
const drinkImage = '/bebida.gif';
const fallbackCatalog = [
  { id: 'P001', nombre: 'Margherita', precio: 22000, descripcion: 'Base de tomate y mozzarella fresca.', ingredientes: ['salsa de tomate', 'mozzarella', 'albahaca', 'aceite de oliva'], imagen: pizzaImage },
  { id: 'P002', nombre: 'Pepperoni', precio: 25000, descripcion: 'Clásica con doble pepperoni.', ingredientes: ['pepperoni', 'mozzarella', 'orégano'], imagen: pizzaImage },
  { id: 'P003', nombre: 'Hawaiana', precio: 24000, descripcion: 'Dulce y salada.', ingredientes: ['jamón', 'piña', 'queso', 'salsa de tomate'], imagen: pizzaImage },
  { id: 'P004', nombre: 'Cuatro Quesos', precio: 26000, descripcion: 'Mezcla cremosa de quesos.', ingredientes: ['mozzarella', 'gorgonzola', 'parmesano', 'provolone'], imagen: pizzaImage },
  { id: 'P005', nombre: 'Vegetariana', precio: 23000, descripcion: 'Cargada de vegetales frescos.', ingredientes: ['pimentón', 'champiñón', 'aceitunas', 'cebolla morada'], imagen: pizzaImage },
  { id: 'P006', nombre: 'BBQ Pollo', precio: 27000, descripcion: 'Salsa BBQ ahumada.', ingredientes: ['pollo', 'salsa BBQ', 'queso', 'maíz tierno'], imagen: pizzaImage },
  { id: 'P007', nombre: 'Mexicana', precio: 26000, descripcion: 'Un toque picante.', ingredientes: ['carne molida', 'jalapeños', 'queso', 'frijol'], imagen: pizzaImage },
  { id: 'P008', nombre: 'Carbonara', precio: 28000, descripcion: 'Inspirada en la pasta clásica.', ingredientes: ['tocineta', 'huevo', 'queso pecorino', 'pimienta negra'], imagen: pizzaImage }
];

export default function App() {
  const [view, setView] = useState('home');
  const [products, setProducts] = useState(fallbackCatalog);
  const [infoProduct, setInfoProduct] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [orders, setOrders] = useState([]);
  const [collab, setCollab] = useState(null);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => p.nombre.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term));
  }, [products, search]);

  const sortedOrders = [...orders].sort((a, b) => {
    const da = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
    const db = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
    return db - da;
  });
  const readyOrders = sortedOrders.filter((o) => o.estado === 'LISTO').slice(0, 8);
  const userOrders = sortedOrders.filter((o) => !['ENTREGADO'].includes(o.estado));
  const collabQueue = orders.filter((o) => o.estado === 'CREADO' || o.estado === 'EN_PREPARACION' || o.estado === 'LISTO');
  const viewTitles = {
    catalog: 'Catálogo',
    orders: 'Mis pedidos',
    collab: 'Colaboradores'
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/v1/orders/products');
      if (!res.ok) throw new Error('catálogo no disponible');
      const data = await parseJsonSafe(res);
      const mapped = (data.items || []).map((p) => ({
        ...p,
        imagen: p.tipo === 'bebida' ? drinkImage : pizzaImage
      }));
      setProducts(mapped.length ? mapped : fallbackCatalog);
    } catch (_err) {
      setProducts(fallbackCatalog);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiFetch('/v1/orders');
      const data = await parseJsonSafe(res);
      setOrders(data.items || []);
    } catch (_err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    const timer = setInterval(fetchOrders, 5000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { product, qty }];
    });
    setInfoProduct(null);
    setDetailQty(1);
  };

  const updateCartQty = (productId, qty) => {
    setCart((prev) =>
      prev.map((c) => (c.product.id === productId ? { ...c, qty: Math.max(1, qty) } : c))
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const ordenar = async (itemsToSend) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: 'CL001',
          clienteNombre: 'Cliente Demo',
          items: itemsToSend.map((c) => ({
            productoId: c.product.id,
            nombre: c.product.nombre,
            cantidad: c.qty,
            precioUnit: c.product.precio,
            subtotal: c.qty * c.product.precio
          }))
        })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.message || data.error || 'No se pudo crear la orden');
      setConfirmation({ orderId: data.orderId, product: itemsToSend[0].product, items: itemsToSend });
      setCart([]);
      setInfoProduct(null);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, estado) => {
    try {
      const res = await apiFetch(`/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.message || data.error || 'No se pudo actualizar');
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? data : o)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className={`frame ${view === 'home' ? 'home-view' : 'catalog'}`}>
        <Header />

        {view === 'home' && (
          <section className="home-content">
            <div className="home-card">
              <h2>Pizza Panucci&apos;s</h2>
              <p className="home-lead">Selecciona cómo quieres continuar.</p>
              <div className="home-buttons">
                <button className="btn home" onClick={() => setView('orders')}>Pedidos</button>
                <button className="btn home" onClick={() => setView('collab')}>Acceso Colaboradores</button>
                <button className="btn home" onClick={() => setView('catalog')}>Ir al catálogo</button>
              </div>
            </div>
          </section>
        )}

        {view !== 'home' && (
          <>
            {error && <div className="toast error">{error}</div>}
            <div className="module-bar">
              <button className="btn home-link" onClick={() => setView('home')}>INICIO</button>
              <h3>{viewTitles[view] || ''}</h3>
              <div className="module-bar-spacer" />
            </div>

            {view === 'catalog' && (
              <>
                <div className="catalog-toolbar">
                  <input
                    className="search"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <CatalogPage
                  products={filteredProducts}
                  cart={cart}
                  loading={loading}
                  onAddToCart={(p) => addToCart(p, 1)}
                  onOpenDetail={(p) => { setInfoProduct(p); setDetailQty(1); }}
                  onUpdateQty={updateCartQty}
                  onRemove={removeFromCart}
                  onConfirm={ordenar}
                  onClear={() => setCart([])}
                />
              </>
            )}

            {view === 'orders' && (
              <OrdersPage userOrders={userOrders} readyOrders={readyOrders} />
            )}

            {view === 'collab' && (
              <CollabPage collab={collab} setCollab={setCollab} orders={collabQueue} onUpdate={updateStatus} />
            )}
          </>
        )}
      </div>

      <ProductModal
        product={infoProduct}
        qty={detailQty}
        loading={loading}
        onClose={() => setInfoProduct(null)}
        onQtyChange={setDetailQty}
        onAdd={addToCart}
      />

      <ConfirmationModal
        confirmation={confirmation}
        onClose={() => setConfirmation(null)}
      />
    </div>
  );
}
