import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from './services/api';
import { v4 as uuidv4 } from 'uuid';
import { initSocket } from './services/socket';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AddMenuItem from './pages/AddMenuItem';
import Categories from './pages/Categories';
import CategoryMenu from './pages/CategoryMenu';
import CategoryList from './pages/CategoryList';
import ManageMenuItems from './pages/ManageMenuItems';
import ManageSupplements from './pages/ManageSupplements';
import ProductDetails from './pages/ProductDetails';
import TableManagement from './pages/TableManagement';
import OrderManagement from './pages/OrderManagement';
import UserManagement from './pages/UserManagement';
import PromotionManagement from './pages/PromotionManagement';
import Reservations from './pages/Reservations';
import AdminTableReservations from './pages/AdminTableReservations';
import StaffTableReservations from './pages/StaffTableReservations';
import OrderWaiting from './pages/OrderWaiting';
import BannerManagement from './pages/BannerManagement';
import AdminBreakfasts from './pages/AdminBreakfasts';
import BreakfastMenu from './pages/BreakfastMenu';
import Header from './components/Header';
import Footer from './components/Footer';
import CartModal from './components/CartModal';
import SupplementPopup from './components/SupplementPopup';

function App() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('local');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [promotionId, setPromotionId] = useState('');
  const [promotions, setPromotions] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [error, setError] = useState(null);
  const [latestOrderId, setLatestOrderId] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [cleanupSocket, setCleanupSocket] = useState(() => {});

  const handleNewNotification = (notification) => {
    if (!notification.id) {
      console.warn('Received notification without ID:', notification);
      return;
    }
    toast.info(notification.message, { autoClose: 5000 });
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await api.getSession();
        const serverSessionId = response.data.sessionId;
        setSessionId(serverSessionId);
        api.defaults.headers.common['X-Session-Id'] = serverSessionId;
      } catch (error) {
        console.error('Error fetching session ID:', error);
        const fallbackSessionId = `guest-${Date.now()}`;
        setSessionId(fallbackSessionId);
        api.defaults.headers.common['X-Session-Id'] = fallbackSessionId;
      }

      const checkAuth = async () => {
        try {
          const res = await api.get('/check-auth');
          setUser(res.data);
        } catch (err) {
          setUser(null);
        }
      };

      const fetchPromotions = async () => {
        try {
          const response = await api.get('/promotions');
          setPromotions(response.data || []);
        } catch (error) {
          toast.error(error.response?.data?.error || 'Failed to load promotions');
          setPromotions([]);
        }
      };

      const socketCleanup = initSocket(
        (data) => setLatestOrderId(data.orderId),
        () => {},
        () => {},
        () => {},
        () => {},
        (data) => setLatestOrderId(data.orderId),
        handleNewNotification
      );
      setCleanupSocket(() => socketCleanup);

      await Promise.all([checkAuth(), fetchPromotions()]);
    };

    initializeApp();

    return () => {
      if (cleanupSocket) cleanupSocket();
    };
  }, []);

  const handleLogin = (user) => {
    setUser(user);
    navigate(user.role === 'admin' ? '/admin' : '/staff');
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
      setCart([]);
      setDeliveryAddress('');
      setPromotionId('');
      setIsCartOpen(false);
      if (cleanupSocket) cleanupSocket();
      const socketCleanup = initSocket(
        (data) => setLatestOrderId(data.orderId),
        () => {},
        () => {},
        () => {},
        () => {},
        (data) => setLatestOrderId(data.orderId),
        handleNewNotification
      );
      setCleanupSocket(() => socketCleanup);
      toast.success('Successfully logged out');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const addToCart = (item) => {
    if (!item || (!item.item_id && !item.breakfast_id)) {
      console.error('Invalid item:', item);
      toast.error('Cannot add item to cart');
      return;
    }

    setCart((prev) => {
      if (item.item_id) {
        const itemKey = `${item.item_id}_${item.supplement_id || 'no-supplement'}`;
        const existingItem = prev.find(
          (cartItem) => `${cartItem.item_id}_${cartItem.supplement_id || 'no-supplement'}` === itemKey
        );
        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.cartItemId === existingItem.cartItemId
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + (item.quantity || 1),
                }
              : cartItem
          );
        }
        return [
          ...prev,
          {
            cartItemId: uuidv4(),
            item_id: item.item_id,
            quantity: item.quantity || 1,
            unit_price: parseFloat(item.unit_price || 0),
            name: item.name || 'Unknown Item',
            image_url: item.image_url || null,
            supplement_id: item.supplement_id || null,
            supplement_name: item.supplement_name || null,
            supplement_price: parseFloat(item.supplement_price || 0),
          },
        ];
      }

      if (item.breakfast_id) {
        const optionIds = item.option_ids ? item.option_ids.sort().join('-') : 'no-options';
        const itemKey = `${item.breakfast_id}_${optionIds}`;
        const existingItem = prev.find(
          (cartItem) =>
            cartItem.breakfast_id === item.breakfast_id &&
            (cartItem.option_ids ? cartItem.option_ids.sort().join('-') : 'no-options') === optionIds
        );
        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.cartItemId === existingItem.cartItemId
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + (item.quantity || 1),
                }
              : cartItem
          );
        }
        return [
          ...prev,
          {
            cartItemId: uuidv4(),
            breakfast_id: item.breakfast_id,
            quantity: item.quantity || 1,
            unit_price: parseFloat(item.unit_price || 0),
            name: item.name || 'Unknown Breakfast',
            image_url: item.image_url || null,
            option_ids: item.option_ids || [],
            options: item.options || [],
          },
        ];
      }

      return prev;
    });
    setIsCartOpen(true);
    toast.success(`${item.name || 'Item'} added to cart`);
  };

  const updateQuantity = (cartItemId, quantity, supplement = null, options = null) => {
    if (quantity < 1) {
      setCart((prev) => prev.filter((cartItem) => cartItem.cartItemId !== cartItemId));
    } else {
      setCart((prev) => {
        const targetItem = prev.find((cartItem) => cartItem.cartItemId === cartItemId);
        if (!targetItem) return prev;

        if (targetItem.item_id) {
          const newSupplementId = supplement?.supplement_id || targetItem.supplement_id || 'no-supplement';
          const itemKey = `${targetItem.item_id}_${newSupplementId}`;
          const existingItem = prev.find(
            (cartItem) =>
              cartItem.cartItemId !== cartItemId &&
              `${cartItem.item_id}_${cartItem.supplement_id || 'no-supplement'}` === itemKey
          );

          if (existingItem && supplement) {
            return prev
              .filter((cartItem) => cartItem.cartItemId !== cartItemId)
              .map((cartItem) =>
                cartItem.cartItemId === existingItem.cartItemId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + quantity,
                      supplement_id: supplement.supplement_id,
                      supplement_name: supplement.supplement_name,
                      supplement_price: parseFloat(supplement.supplement_price || 0),
                    }
                  : cartItem
              );
          }

          return prev.map((cartItem) =>
            cartItem.cartItemId === cartItemId
              ? {
                  ...cartItem,
                  quantity,
                  ...(supplement && {
                    supplement_id: supplement.supplement_id,
                    supplement_name: supplement.supplement_name,
                    supplement_price: parseFloat(supplement.supplement_price || 0),
                  }),
                }
              : cartItem
          );
        }

        if (targetItem.breakfast_id) {
          const newOptionIds = options?.option_ids ? options.option_ids.sort().join('-') : targetItem.option_ids.sort().join('-');
          const itemKey = `${targetItem.breakfast_id}_${newOptionIds}`;
          const existingItem = prev.find(
            (cartItem) =>
              cartItem.cartItemId !== cartItemId &&
              cartItem.breakfast_id === targetItem.breakfast_id &&
              (cartItem.option_ids ? cartItem.option_ids.sort().join('-') : 'no-options') === newOptionIds
          );

          if (existingItem && options) {
            return prev
              .filter((cartItem) => cartItem.cartItemId !== cartItemId)
              .map((cartItem) =>
                cartItem.cartItemId === existingItem.cartItemId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + quantity,
                      option_ids: options.option_ids,
                      options: options.options,
                    }
                  : cartItem
              );
          }

          return prev.map((cartItem) =>
            cartItem.cartItemId === cartItemId
              ? {
                  ...cartItem,
                  quantity,
                  ...(options && {
                    option_ids: options.option_ids,
                    options: options.options,
                  }),
                }
              : cartItem
          );
        }

        return prev;
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    setDeliveryAddress('');
    setPromotionId('');
    setIsCartOpen(false);
  };

  useEffect(() => {
    const handleError = (event) => {
      toast.error('An error occurred: ' + (event.message || 'Unknown error'));
      setError('An unexpected error occurred. Please try refreshing the page.');
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{error}</div>;
  }

  if (!sessionId) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Initializing session...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', minHeight: '100vh' }}>
      <Header
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        user={user}
        handleLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/admin"
          element={user && user.role === 'admin' ? <AdminDashboard /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/staff"
          element={user && user.role === 'server' ? <StaffDashboard user={user} handleNewNotification={handleNewNotification} /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/add-menu-item"
          element={user && user.role === 'admin' ? <AddMenuItem /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/categories"
          element={user && user.role === 'admin' ? <Categories /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/manage-menu-items"
          element={user && user.role === 'admin' ? <ManageMenuItems /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/supplements"
          element={user && user.role === 'admin' ? <ManageSupplements /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/tables"
          element={user && user.role === 'admin' ? <TableManagement /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/orders"
          element={user && user.role === 'admin' ? <OrderManagement /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/users"
          element={user && user.role === 'admin' ? <UserManagement /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/promotions"
          element={user && user.role === 'admin' ? <PromotionManagement /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/banners"
          element={user && user.role === 'admin' ? <BannerManagement /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/breakfasts"
          element={user && user.role === 'admin' ? <AdminBreakfasts /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin/table-reservations"
          element={user && user.role === 'admin' ? <AdminTableReservations /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/staff/table-reservations"
          element={user && user.role === 'server' ? <StaffTableReservations /> : <Login onLogin={handleLogin} />}
        />
        <Route path="/category/:id" element={<CategoryMenu addToCart={addToCart} />} />
        <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} latestOrderId={latestOrderId} />} />
        <Route path="/order-waiting/:orderId" element={<OrderWaiting sessionId={sessionId} />} />
        <Route path="/breakfast" element={<BreakfastMenu addToCart={addToCart} />} />
        <Route path="/breakfast/:id" element={<BreakfastMenu addToCart={addToCart} />} />
        <Route path="*" element={<div style={{ textAlign: 'center', color: '#666' }}>404 Not Found</div>} />
      </Routes>
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        orderType={orderType}
        setOrderType={setOrderType}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        promotionId={promotionId}
        setPromotionId={setPromotionId}
        promotions={promotions}
        clearCart={clearCart}
        sessionId={sessionId}
      />
      <Footer />
    </div>
  );
}

export default App;
