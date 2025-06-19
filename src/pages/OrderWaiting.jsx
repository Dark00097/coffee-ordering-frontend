import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import { api } from '../services/api';

function OrderWaiting({ sessionId }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [itemsVisible, setItemsVisible] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Prevent unintended navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your order tracking will be interrupted.';
    };

    const handlePopState = (e) => {
      e.preventDefault();
      if (!window.confirm('Are you sure you want to leave? Your order tracking will be interrupted.')) {
        window.history.pushState(null, '', window.location.pathname);
      } else {
        navigate('/');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Trigger animations
  useEffect(() => {
    if (!isLoading && !errorMessage) {
      setTimeout(() => setIsVisible(true), 100);
      setTimeout(() => setItemsVisible(true), 300);
    }
  }, [isLoading, errorMessage]);

  // Initialize socket and fetch order
  useEffect(() => {
    let cleanupSocket = () => {};

    const setupSocketAndOrder = async () => {
      if (!orderId || isNaN(parseInt(orderId))) {
        setErrorMessage('Invalid order ID.');
        setIsLoading(false);
        return;
      }

      const onOrderApproved = (data) => {
        if (data.orderId === orderId) {
          setIsApproved(true);
          setOrderDetails((prev) => ({
            ...prev,
            ...data.orderDetails,
            approved: true,
            status: data.orderDetails?.status || prev?.status || 'received',
          }));
        }
      };

      const onOrderUpdate = (data) => {
        if (data.orderId === orderId) {
          setOrderDetails((prev) => ({
            ...prev,
            ...data.orderDetails,
            status: data.status,
          }));
        }
      };

      try {
        cleanupSocket = await initSocket(
          () => {},
          onOrderUpdate,
          () => {},
          () => {},
          () => {},
          onOrderApproved,
          () => {}
        );
      } catch (error) {
        console.error('Socket initialization failed:', { error: error.message });
        setErrorMessage('Failed to connect to real-time updates. Please try again later.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getOrder(orderId);
        if (response.data.session_id !== sessionId) {
          setErrorMessage('Access denied: This order belongs to another session.');
          setIsLoading(false);
          return;
        }
        setOrderDetails(response.data);
        setIsApproved(!!response.data.approved);
        setIsLoading(false);
      } catch (error) {
        console.error('Fetch order error:', {
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
        });
        if (error.response?.status === 403) {
          setErrorMessage('Access denied: You are not authorized to view this order.');
        } else if (error.response?.status === 404) {
          setErrorMessage('Order not found.');
        } else if (error.response?.status === 500) {
          setErrorMessage('Server error. Please try again later.');
        } else {
          setErrorMessage('Failed to load order details. Check your connection.');
        }
        setIsLoading(false);
      }
    };

    setupSocketAndOrder();

    return () => {
      cleanupSocket();
    };
  }, [orderId, sessionId]);

  const handleReturnHome = () => {
    setIsVisible(false);
    setTimeout(() => navigate('/'), 200);
  };

  // Group items by item_id and breakfast_id with correct pricing
  const groupedItems = (() => {
    if (!orderDetails) return [];

    const acc = {};

    // Menu items
    const itemIds = orderDetails.item_ids?.split(',').filter(id => id.trim()) || [];
    const itemNames = orderDetails.item_names?.split(',') || [];
    const menuQuantities = orderDetails.menu_quantities?.split(',').filter(q => q !== 'NULL') || [];
    const unitPrices = orderDetails.unit_prices?.split(',').map(price => parseFloat(price) || 0) || [];
    const supplementIds = orderDetails.supplement_ids?.split(',') || [];
    const supplementNames = orderDetails.supplement_names?.split(',') || [];
    const supplementPrices = orderDetails.supplement_prices?.split(',').map(price => parseFloat(price) || 0) || [];
    const imageUrls = orderDetails.image_urls?.split(',') || [];

    itemIds.forEach((id, idx) => {
      if (idx >= menuQuantities.length || idx >= itemNames.length) return;
      const supplementId = supplementIds[idx]?.trim() || null;
      const key = `${id.trim()}_${supplementId || 'none'}`;
      const quantity = parseInt(menuQuantities[idx], 10) || 1;

      if (!acc[key]) {
        acc[key] = {
          id: parseInt(id),
          type: 'menu',
          name: itemNames[idx]?.trim() || 'Unknown Item',
          quantity: 0,
          unitPrice: unitPrices[idx],
          supplementName: supplementId ? supplementNames[idx]?.trim() : null,
          supplementPrice: supplementId ? supplementPrices[idx] : 0,
          imageUrl: imageUrls[idx]?.trim() || null,
          options: [], // Initialize options as empty array for menu items
        };
      }
      acc[key].quantity += quantity;
    });

    // Breakfast items
    const breakfastIds = orderDetails.breakfast_ids?.split(',').filter(id => id.trim()) || [];
    const breakfastNames = orderDetails.breakfast_names?.split(',') || [];
    const breakfastQuantities = orderDetails.breakfast_quantities?.split(',').filter(q => q !== 'NULL') || [];
    const unitPricesBreakfast = orderDetails.unit_prices?.split(',').map(price => parseFloat(price) || 0) || [];
    const breakfastImages = orderDetails.breakfast_images?.split(',') || [];
    const optionIds = orderDetails.breakfast_option_ids?.split(',').filter(id => id.trim()) || [];
    const optionNames = orderDetails.breakfast_option_names?.split(',') || [];
    const optionPrices = orderDetails.breakfast_option_prices?.split(',').map(price => parseFloat(price) || 0) || [];

    breakfastIds.forEach((id, idx) => {
      if (idx >= breakfastQuantities.length || idx >= breakfastNames.length) return;
      const key = id.trim();
      const quantity = parseInt(breakfastQuantities[idx], 10) || 1;

      if (!acc[key]) {
        acc[key] = {
          id: parseInt(id),
          type: 'breakfast',
          name: breakfastNames[idx]?.trim() || 'Unknown Breakfast',
          quantity: 0,
          unitPrice: unitPricesBreakfast[idx],
          imageUrl: breakfastImages[idx]?.trim() || null,
          options: [],
        };
      }
      acc[key].quantity += quantity;

      const optionsPerItem = optionIds.length / breakfastIds.length;
      const startIdx = idx * optionsPerItem;
      const endIdx = (idx + 1) * optionsPerItem;
      for (let i = startIdx; i < endIdx && i < optionIds.length; i++) {
        if (orderDetails.breakfast_option_ids[i]) {
          acc[key].options.push({
            id: optionIds[i],
            name: optionNames[i] || 'Unknown Option',
            price: optionPrices[i] || 0,
          });
        }
      }
      acc[key].options = Array.from(new Set(acc[key].options.map(opt => JSON.stringify(opt))), JSON.parse);
    });

    return Object.values(acc);
  })();

  // Loading Screen
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>
          <div style={styles.spinner}></div>
          <h2 style={styles.loaderText}>Loading Order</h2>
          <p style={styles.loaderSubtext}>Please wait...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (errorMessage) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, ...styles.errorCard }}>
          <div style={styles.errorIcon}>
            <div style={styles.errorCircle}>
              <div style={styles.errorDot}></div>
            </div>
          </div>
          <h2 style={styles.errorTitle}>{errorMessage}</h2>
          <button
            onClick={handleReturnHome}
            style={styles.button}
            onMouseDown={(e) => (e.target.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Main Order Screen
  const baseImageUrl = api.defaults.baseURL.replace('/api', '');
  return (
    <div style={styles.container}>
      <div style={{ ...styles.header, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(-20px)' }}>
        <h1 style={styles.headerTitle}>
          {isApproved ? 'Order Confirmed!' : 'Waiting for Confirmation'}
        </h1>
        <p style={styles.headerSubtitle}>
          Order #{orderId} • {orderDetails.order_type === 'delivery' ? 'Delivery' : `Table ${orderDetails.table_number || 'N/A'}`}
        </p>
      </div>

      <div style={{ ...styles.card, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}>
        <div style={styles.statusSection}>
          <div style={isApproved ? styles.statusApproved : styles.statusPending}>
            <span style={styles.statusText}>
              {isApproved ? 'Order Approved' : 'Pending Approval'}
            </span>
          </div>
          <p style={styles.statusMessage}>
            {isApproved
              ? 'Your order has been confirmed and is being prepared.'
              : 'Your order is being reviewed by our staff.'}
          </p>
        </div>

        <div style={styles.itemsSection}>
          <h2 style={styles.sectionTitle}>Your Order</h2>
          <div style={styles.itemsList}>
            {groupedItems.map((item, index) => {
              const totalOptionsPrice = (item.options || []).reduce((sum, opt) => sum + opt.price, 0); // Safe access to options
              const itemTotalPrice = (item.unitPrice + totalOptionsPrice) * item.quantity;
              return (
                <div
                  key={`${item.type}-${item.id}-${index}`}
                  style={{
                    ...styles.itemRow,
                    opacity: itemsVisible ? 1 : 0,
                    transform: itemsVisible ? 'translateX(0)' : `translateX(${index % 2 === 0 ? '-20px' : '20px'})`,
                    transitionDelay: `${index * 0.1}s`,
                  }}
                >
                  <img
                    src={item.imageUrl ? `${baseImageUrl}${item.imageUrl}` : 'https://via.placeholder.com/40?text=No+Image'}
                    alt={item.name}
                    style={styles.itemImage}
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/40?text=No+Image')}
                  />
                  <div style={styles.itemDetails}>
                    <span style={styles.itemName}>{item.name}</span>
                    {item.supplementName && (
                      <span style={styles.itemOption}>
                        + {item.supplementName} {item.supplementPrice > 0 && `(+$${item.supplementPrice.toFixed(2)})`}
                      </span>
                    )}
                    {(item.options || []).map((opt, optIdx) => (
                      <span key={optIdx} style={styles.itemOption}>
                        + {opt.name} (+${opt.price.toFixed(2)})
                      </span>
                    ))}
                    
                  </div>
                  <span style={styles.quantityBadge}>{item.quantity}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.totalSection}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total</span>
            <span style={styles.totalValue}>${parseFloat(orderDetails.total_price).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleReturnHome}
        style={{ ...styles.button, ...styles.homeButton }}
        onMouseDown={(e) => (e.target.style.transform = 'scale(0.96)')}
        onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
      >
        Return to Home
      </button>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f2f2f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  loader: {
    textAlign: 'center',
    color: '#1c1c1e',
  },
  spinner: {
    width: '44px',
    height: '44px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: '#e5e5ea #e5e5ea #e5e5ea #007aff',
    borderRadius: '50%',
    margin: '0 auto 24px',
    animation: 'spin 1s linear infinite',
  },
  loaderText: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px',
    color: '#1c1c1e',
  },
  loaderSubtext: {
    fontSize: '16px',
    color: '#8e8e93',
    margin: '0',
    fontWeight: '400',
  },
  errorCard: {
    maxWidth: '340px',
    width: '100%',
    animation: 'slideUp 0.4s ease-out',
  },
  errorIcon: {
    width: '56px',
    height: '56px',
    backgroundColor: '#ff3b30',
    borderRadius: '50%',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCircle: {
    width: '20px',
    height: '20px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'white',
    borderRadius: '50%',
    position: 'relative',
  },
  errorDot: {
    position: 'absolute',
    top: '4px',
    left: '6px',
    width: '2px',
    height: '2px',
    backgroundColor: 'white',
    borderRadius: '50%',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1c1c1e',
    margin: '0 0 20px',
    lineHeight: '1.3',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '20px',
    textAlign: 'center',
    borderRadius: '0 0 20px 20px',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '600px',
    transition: 'all 0.4s ease-out',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1c1c1e',
    margin: '0 0 8px',
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#8e8e93',
    margin: '0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.4s ease-out',
    marginBottom: '20px',
  },
  statusSection: {
    marginBottom: '20px',
    textAlign: 'center',
  },
  statusApproved: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'inline-block',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'inline-block',
  },
  statusText: {
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0 0',
  },
  itemsSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1c1c1e',
    margin: '0 0 12px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    gap: '12px',
    transition: 'all 0.3s ease-out',
  },
  itemImage: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: '4px',
    display: 'block',
  },
  itemOption: {
    fontSize: '14px',
    color: '#6b7280',
    display: 'block',
    marginBottom: '2px',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f97316',
    marginTop: '4px',
    display: 'block',
  },
  quantityBadge: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '28px',
    textAlign: 'center',
  },
  totalSection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1c1c1e',
  },
  totalLabel: {
    color: '#6b7280',
  },
  totalValue: {
    color: '#1c1c1e',
  },
  button: {
    backgroundColor: '#007aff',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '300px',
  },
  homeButton: {
    marginTop: '20px',
  },
  '@media (max-width: 600px)': {
    container: {
      padding: '16px',
    },
    header: {
      padding: '16px',
      marginBottom: '16px',
    },
    headerTitle: {
      fontSize: '24px',
    },
    headerSubtitle: {
      fontSize: '14px',
    },
    card: {
      padding: '16px',
    },
    itemRow: {
      padding: '10px',
      gap: '10px',
    },
    itemImage: {
      width: '40px',
      height: '40px',
    },
    itemName: {
      fontSize: '14px',
    },
    itemOption: {
      fontSize: '12px',
    },
    itemPrice: {
      fontSize: '12px',
    },
    quantityBadge: {
      fontSize: '11px',
      padding: '3px 6px',
    },
    button: {
      padding: '12px 20px',
      fontSize: '15px',
    },
  },
  '@media (max-width: 400px)': {
    headerTitle: {
      fontSize: '20px',
    },
    card: {
      padding: '12px',
    },
    sectionTitle: {
      fontSize: '16px',
    },
    itemRow: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '8px',
    },
    itemImage: {
      width: '100%',
      height: 'auto',
      maxWidth: '100px',
      borderRadius: '6px',
    },
    quantityBadge: {
      alignSelf: 'flex-end',
    },
  },
};

export default OrderWaiting;