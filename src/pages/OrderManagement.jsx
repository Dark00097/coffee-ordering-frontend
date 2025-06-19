import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';

function OrderManagement() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const placeholderImage = 'https://via.placeholder.com/48?text=No+Image';

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get('/check-auth');
        if (res.data.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/login');
        } else {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err.response?.data || err.message);
        toast.error(err.response?.data?.error || 'Please log in');
        navigate('/login');
      }
    }

    async function fetchOrders() {
      try {
        const query = dateFilter !== 'all' ? `?time_range=${dateFilter}` : '';
        const res = await api.get(`/orders${query}`);
        const processedOrders = (res.data || []).map(order => ({
          ...order,
          item_names: order.item_names ? order.item_names.split(',').map(name => name.trim()) : [],
          image_urls: order.image_urls ? order.image_urls.split(',').map(url => url.trim()) : [],
          quantities: order.quantities ? order.quantities.split(',').map(qty => parseInt(qty, 10)) : [],
          status: order.approved ? 'Approved' : 'Pending',
        }));
        setOrders(processedOrders);
      } catch (err) {
        console.error('Failed to load orders:', err.response?.data || err.message);
        toast.error(err.response?.data?.error || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
    fetchOrders();

    const socketCleanup = initSocket(
      (order) => {
        const processedOrder = {
          ...order,
          item_names: order.item_names ? order.item_names.split(',').map(name => name.trim()) : [],
          image_urls: order.image_urls ? order.image_urls.split(',').map(url => url.trim()) : [],
          quantities: order.quantities ? order.quantities.split(',').map(qty => parseInt(qty, 10)) : [],
          status: order.approved ? 'Approved' : 'Pending',
        };
        setOrders(prev => [processedOrder, ...prev]);
        toast.success(`New order #${order.id} received`);
      },
      (updatedOrder) => {
        setOrders(prev =>
          prev.map(order =>
            order.id === parseInt(updatedOrder.orderId)
              ? { ...order, status: updatedOrder.status || (updatedOrder.approved ? 'Approved' : 'Pending') }
              : order
          )
        );
        toast.info(`Order #${updatedOrder.orderId} updated to ${updatedOrder.status || (updatedOrder.approved ? 'Approved' : 'Pending')}`);
      },
      () => {},
      () => {},
      () => {}
    );

    return () => {
      if (typeof socketCleanup === 'function') {
        socketCleanup();
      }
    };
  }, [navigate, dateFilter]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const approved = status === 'Approved' ? 1 : 0;
      await api.post(`/orders/${orderId}/approve`, { user_id: user.id, approved });
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status, approved } : order
        )
      );
      toast.success('Order status updated successfully');
    } catch (err) {
      console.error('Failed to update order:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to update order status');
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const closeOrderDetail = () => {
    setShowOrderDetail(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    return status === 'Approved' 
      ? { background: '#dcfce7', color: '#166534' }
      : { background: '#fed7aa', color: '#9a3412' };
  };

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Loading Orders</h2>
        <p style={{ fontSize: '14px', opacity: '0.8' }}>Please wait...</p>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          animation: 'slideInFromTop 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Order Management
          </h1>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '12px',
            justifyContent: 'flex-start'
          }}>
            {['all', 'hour', 'day', 'yesterday', 'week', 'month'].map(filter => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: dateFilter === filter ? '#667eea' : '#e2e8f0',
                  background: dateFilter === filter ? '#667eea' : 'white',
                  color: dateFilter === filter ? 'white' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: '1 1 auto',
                  minWidth: '100px',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  if (dateFilter !== filter) {
                    e.target.style.borderColor = '#a5b4fc';
                    e.target.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (dateFilter !== filter) {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = 'white';
                  }
                }}
              >
                {filter === 'all' ? 'All' :
                 filter === 'hour' ? 'Last Hour' :
                 filter === 'day' ? 'Today' :
                 filter === 'yesterday' ? 'Yesterday' :
                 filter === 'week' ? 'Last 7 Days' :
                 'Last 30 Days'}
              </button>
            ))}
          </div>
          <p style={{
            margin: '12px 0 0 0',
            color: '#64748b',
            fontSize: '14px'
          }}>
            {orders.length} orders • {orders.filter(o => o.status === 'Pending').length} pending
          </p>
        </div>

        {orders.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: 0
            }}>No orders available.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
          }}>
            {orders.map((order, index) => {
              const formattedPrice = parseFloat(order.total_price).toFixed(2);
              return (
                <div
                  key={order.id}
                  onClick={() => openOrderDetail(order)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    animation: `slideInFromBottom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s both`,
                    transform: 'translateY(0)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#1e293b'
                      }}>
                        Order #{order.id}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '4px 0 0 0'
                      }}>
                        {order.table_number ? `Table ${order.table_number}` : order.order_type} • {order.created_at ? formatTime(order.created_at) : 'N/A'}
                      </p>
                    </div>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: getStatusColor(order.status).background,
                      color: getStatusColor(order.status).color
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    flexWrap: 'wrap'
                  }}>
                    {order.item_names.slice(0, 3).map((name, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '13px'
                      }}>
                        {order.image_urls[idx] && order.image_urls[idx] !== 'null' ? (
                          <img
                            src={`${baseUrl}${order.image_urls[idx]}`}
                            alt={name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = placeholderImage;
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#64748b'
                          }}>
                            {order.quantities[idx]}
                          </div>
                        )}
                        <span style={{ color: '#334155' }}>{name}</span>
                      </div>
                    ))}
                    {order.item_names.length > 3 && (
                      <div style={{
                        padding: '8px 12px',
                        background: '#f1f5f9',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: '#64748b'
                      }}>
                        +{order.item_names.length - 3} more
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      ${formattedPrice}
                    </span>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showOrderDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end',
          padding: '16px',
          animation: showOrderDetail ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            background: 'white',
            borderRadius: '24px 24px 8px 8px',
            maxHeight: '80vh',
            overflow: 'hidden',
            animation: showOrderDetail ? 'slideUpModal 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'slideDownModal 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Order #{selectedOrder?.id}
                </h2>
                <p style={{
                  fontSize: '14px',
                  margin: '4px 0 0 0',
                  opacity: 0.9
                }}>
                  {selectedOrder?.table_number ? `Table ${selectedOrder.table_number}` : selectedOrder?.order_type}
                </p>
              </div>
              <button
                onClick={closeOrderDetail}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '20px',
              maxHeight: 'calc(80vh - 140px)',
              overflowY: 'auto'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1e293b'
                }}>
                  Items Ordered
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedOrder?.item_names.map((name, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '12px'
                    }}>
                      {selectedOrder.image_urls[index] && selectedOrder.image_urls[index] !== 'null' ? (
                        <img
                          src={`${baseUrl}${selectedOrder.image_urls[index]}`}
                          alt={name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.src = placeholderImage;
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          No Img
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          margin: 0,
                          color: '#1e293b'
                        }}>
                          {name}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: '2px 0 0 0'
                        }}>
                          Quantity: {selectedOrder.quantities[index]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#1e293b'
                }}>
                  Update Status
                </h3>
                <select
                  value={selectedOrder?.status}
                  onChange={(e) => {
                    handleStatusUpdate(selectedOrder.id, e.target.value);
                    setSelectedOrder(prev => ({ ...prev, status: e.target.value }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '16px'
              }}>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Total Amount
                </span>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#059669'
                }}>
                  ${parseFloat(selectedOrder?.total_price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromBottom {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes slideUpModal {
          0% {
            opacity: 0;
            transform: translateY(100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDownModal {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(100%);
          }
        }

        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
        }

        @media (max-width: 480px) {
          button {
            font-size: 14px !important;
            padding: 10px 16px !important;
            min-width: 90px !important;
            margin: 4px 0 !important;
          }

          div[style*="flex-wrap: wrap"] {
            gap: 8px !important;
            justify-content: space-around !important;
          }
        }

        * {
          -webkit-overflow-scrolling: touch;
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </>
  );
}

export default OrderManagement;