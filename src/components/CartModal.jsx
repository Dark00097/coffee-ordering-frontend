import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CoffeeIcon from '@mui/icons-material/Coffee';
import SearchIcon from '@mui/icons-material/Search';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';

// Memoized CartItem component
const CartItem = React.memo(({ item, itemSupplements, breakfastOptions, supplementSelections, handleQuantityChange, handleSupplementChange, api }) => {
  const imageSrc = useMemo(() => {
    let src = '/placeholder.jpg'; // Default fallback
    // Use image_url for both menu and breakfast items, as processed by BreakfastMenu
    src = item.image_url && item.image_url !== '/Uploads/undefined' && item.image_url !== 'null'
      ? item.image_url // Already preprocessed with getImageUrl
      : src;
    return src;
  }, [item.image_url]);

  const displayPrice = parseFloat(item.sale_price || item.unit_price || item.regular_price) || 0;
  const supplementPrice = parseFloat(supplementSelections[item.cartItemId]?.additional_price || item.supplement_price || 0) || 0;
  const breakfastOptionPrices = item.option_ids?.reduce((sum, optionId) => {
    const option = breakfastOptions.find(o => o.id === optionId);
    return sum + (parseFloat(option?.additional_price) || 0);
  }, 0) || 0;

  return (
    <li className="cart-item">
      <div className="item-header">
        <div className="item-image">
          <img
            src={imageSrc}
            srcSet={`
              ${imageSrc}?w=48 1x,
              ${imageSrc}?w=96 2x
            `}
            alt={item.name || 'Item'}
            className="item-img"
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
          />
        </div>
        <div className="item-details">
          <h4 className="item-name">{item.name || 'Unnamed Item'}</h4>
          <div className="item-price">
            ${(displayPrice + breakfastOptionPrices + supplementPrice).toFixed(2)}
            {supplementPrice > 0 && (
              <span className="supplement-price">+${supplementPrice.toFixed(2)} (Supplement)</span>
            )}
            {breakfastOptionPrices > 0 && (
              <span className="supplement-price">+${breakfastOptionPrices.toFixed(2)} (Options)</span>
            )}
          </div>
          {item.breakfast_id && item.option_ids && (
            <div className="breakfast-options">
              {breakfastOptions
                .filter(option => item.option_ids.includes(option.id))
                .map(option => (
                  <span key={option.id} className="option-detail">
                    {option.option_name} (+${parseFloat(option.additional_price || 0).toFixed(2)})
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      {!item.breakfast_id && itemSupplements?.length > 0 && (
        <select
          onChange={(e) => handleSupplementChange(item.cartItemId, e.target.value)}
          value={supplementSelections[item.cartItemId]?.supplement_id || item.supplement_id || '0'}
          className="supplement-select"
        >
          <option value="0">No Supplement</option>
          {itemSupplements.map((s) => (
            <option key={s.supplement_id} value={s.supplement_id}>
              {s.name} (+${parseFloat(s.additional_price || 0).toFixed(2)})
            </option>
          ))}
        </select>
      )}

      <div className="quantity-controls">
        <div className="quantity-buttons">
          <button
            onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="quantity-button"
          >
            <RemoveIcon fontSize="small" />
          </button>
          <span className="quantity-number">{item.quantity || 1}</span>
          <button
            onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
            className="quantity-button"
          >
            <AddIcon fontSize="small" />
          </button>
        </div>
        <button
          onClick={() => handleQuantityChange(item.cartItemId, 0)}
          className="delete-button"
        >
          <DeleteIcon fontSize="small" />
        </button>
      </div>
    </li>
  );
});

function CartModal({
  isOpen,
  onClose,
  cart = [],
  updateQuantity,
  orderType,
  setOrderType,
  deliveryAddress,
  setDeliveryAddress,
  clearCart,
}) {
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [supplementSelections, setSupplementSelections] = useState({});
  const [itemSupplements, setItemSupplements] = useState({});
  const [breakfastOptions, setBreakfastOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const touchStartY = useRef(null);
  const submissionLockRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || orderType !== 'local') {
      setTableId('');
      setTableSearch('');
      return;
    }

    api.getTables()
      .then((res) => setTables(res.data || []))
      .catch((error) => {
        console.error('Failed to load tables:', error);
        toast.error('Failed to load tables');
        setTables([]);
      });
  }, [isOpen, orderType]);

  useEffect(() => {
    if (!isOpen || !cart.length) {
      setItemSupplements({});
      setSupplementSelections({});
      setBreakfastOptions({});
      return;
    }

    const fetchSupplementsAndOptions = async () => {
      const supplementsData = {};
      const optionsData = {};
      const uniqueItemIds = [...new Set(cart.map((item) => item.item_id || item.breakfast_id))].slice(0, 5);
      for (const itemId of uniqueItemIds) {
        try {
          if (itemId) {
            const itemType = cart.find(i => i.item_id === itemId || i.breakfast_id === itemId)?.breakfast_id ? 'breakfast' : 'menu';
            if (itemType === 'menu') {
              const res = await api.getSupplementsByMenuItem(itemId);
              supplementsData[itemId] = res.data || [];
            } else if (itemType === 'breakfast') {
              const res = await api.getBreakfastOptions(itemId);
              optionsData[itemId] = res.data || [];
            }
          }
        } catch (error) {
          console.error(`Failed to fetch data for item ${itemId}:`, error);
          supplementsData[itemId] = [];
          optionsData[itemId] = [];
        }
      }
      setItemSupplements(supplementsData);
      setBreakfastOptions(optionsData);
    };

    fetchSupplementsAndOptions();
  }, [cart, isOpen]);

  // Aggregate quantities by item type and unique identifiers
  const aggregatedCart = useMemo(() => {
    const acc = {};
    cart.forEach((item) => {
      const key = item.breakfast_id
        ? `${item.breakfast_id}_${item.option_ids?.sort().join('-') || 'no-options'}`
        : `${item.item_id}_${item.supplement_id || 'no-supplement'}_${item.cartItemId}`;
      if (!acc[key]) {
        acc[key] = { ...item, quantity: 0 };
      }
      acc[key].quantity += item.quantity || 1;
    });
    return Object.values(acc);
  }, [cart]);

  const calculateTotal = useMemo(() => {
    return (aggregatedCart || [])
      .reduce((sum, item) => {
        const basePrice = parseFloat(item.sale_price || item.unit_price || item.regular_price) || 0;
        const supplementPrice = parseFloat(supplementSelections[item.cartItemId]?.additional_price || item.supplement_price || 0) || 0;
        const breakfastOptionPrices = item.option_ids?.reduce((sum, optionId) => {
          const option = (breakfastOptions[item.breakfast_id] || []).find(o => o.id === optionId);
          return sum + (parseFloat(option?.additional_price) || 0);
        }, 0) || 0;
        return sum + item.quantity * (basePrice + supplementPrice + breakfastOptionPrices);
      }, 0)
      .toFixed(2);
  }, [aggregatedCart, supplementSelections, breakfastOptions]);

  const total = calculateTotal;
  const itemCount = useMemo(() => (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0), [cart]);

  // Filter tables based on search input
  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    return tables.filter((table) =>
      table.table_number.toString().toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [tables, tableSearch]);

  const handleQuantityChange = useCallback((cartItemId, newQuantity) => {
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    if (newQuantity === 0) {
      updateQuantity(cartItemId, 0);
      setSupplementSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[cartItemId];
        return newSelections;
      });
    } else {
      updateQuantity(cartItemId, Math.max(1, newQuantity));
    }
  }, [cart, updateQuantity]);

  const handleSupplementChange = useCallback((cartItemId, supplementId) => {
    const parsedSupplementId = supplementId === '0' ? null : parseInt(supplementId);
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item || item.breakfast_id) return;

    const supplement = parsedSupplementId
      ? (itemSupplements[item.item_id] || []).find((s) => s.supplement_id === parsedSupplementId)
      : null;

    setSupplementSelections((prev) => ({
      ...prev,
      [cartItemId]: supplement,
    }));

    updateQuantity(cartItemId, item.quantity, {
      supplement_id: parsedSupplementId,
      supplement_name: supplement?.name || null,
      supplement_price: parseFloat(supplement?.additional_price || 0),
    });
  }, [cart, itemSupplements, updateQuantity]);

  const validateOrder = useCallback(() => {
    if (!cart?.length) return 'Cart is empty';
    if (orderType === 'local' && (!tableId || isNaN(parseInt(tableId)))) return 'Please select a valid table';
    if (orderType === 'delivery' && (!deliveryAddress || !deliveryAddress.trim())) return 'Please enter a delivery address';
    for (const item of cart || []) {
      if (!item.item_id && !item.breakfast_id || (isNaN(item.item_id) && isNaN(item.breakfast_id)) || (item.item_id <= 0 && item.breakfast_id <= 0))
        return `Invalid item ID: ${item.item_id || item.breakfast_id}`;
      if (!item.quantity || item.quantity <= 0) return `Invalid quantity for ${item.name || 'Unnamed Item'}`;
      const basePrice = parseFloat(item.sale_price || item.unit_price || item.regular_price) || 0;
      if (basePrice <= 0) return `Invalid price for ${item.name || 'Unnamed Item'}`;
      if (item.breakfast_id && item.option_ids) {
        const options = breakfastOptions[item.breakfast_id] || [];
        const groups = new Set(options.map(o => o.group_id));
        const selectedGroups = new Set(options.filter(o => item.option_ids.includes(o.id)).map(o => o.group_id));
        if (groups.size > 0 && selectedGroups.size !== groups.size) {
          return `Must select one option from each of the ${groups.size} option groups for breakfast ${item.breakfast_id}`;
        }
      }
    }
    return null;
  }, [cart, orderType, tableId, deliveryAddress, breakfastOptions]);

  const handlePlaceOrder = useCallback(async () => {
    if (submissionLockRef.current || isSubmitting) return;

    const lockId = uuidv4();
    submissionLockRef.current = lockId;
    setIsSubmitting(true);

    try {
      const validationError = validateOrder();
      if (validationError) throw new Error(validationError);

      const requestId = uuidv4();

      // Group items to avoid duplication for backend submission
      const groupedItems = aggregatedCart.reduce((acc, item) => {
        const key = item.breakfast_id
          ? `${item.breakfast_id}_${item.option_ids?.sort().join('-') || 'no-options'}`
          : `${item.item_id}_${item.supplement_id || 'no-supplement'}`;
        if (!acc[key]) {
          acc[key] = { ...item, quantity: 0 };
        }
        acc[key].quantity += item.quantity;
        return acc;
      }, {});

      const orderItems = Object.values(groupedItems).map((item) => {
        let unitPrice = parseFloat(item.sale_price || item.unit_price || item.regular_price) || 0;

        if (item.breakfast_id && item.option_ids) {
          const options = breakfastOptions[item.breakfast_id] || [];
          const optionPrices = item.option_ids.reduce((sum, optionId) => {
            const option = options.find(o => o.id === optionId);
            return sum + (parseFloat(option?.additional_price) || 0);
          }, 0);
          unitPrice += optionPrices;
        }

        const supplement = item.breakfast_id ? null : (supplementSelections[item.cartItemId] || {
          supplement_id: item.supplement_id || null,
          name: item.supplement_name || null,
          additional_price: parseFloat(item.supplement_price || 0),
        });

        if (supplement && !item.breakfast_id) {
          unitPrice += parseFloat(supplement.additional_price || 0);
        }

        return {
          ...(item.breakfast_id ? { breakfast_id: parseInt(item.breakfast_id) } : { item_id: parseInt(item.item_id) }),
          quantity: parseInt(item.quantity || 1),
          unit_price: parseFloat(unitPrice.toFixed(2)),
          ...(supplement && !item.breakfast_id ? { supplement_id: parseInt(supplement.supplement_id) } : {}),
          ...(supplement && !item.breakfast_id ? { supplement_name: supplement.name } : {}),
          ...(supplement && !item.breakfast_id ? { supplement_price: parseFloat(supplement.additional_price) } : {}),
          ...(item.breakfast_id && item.option_ids ? { option_ids: item.option_ids } : {}),
        };
      });

      const orderData = {
        breakfastItems: orderItems.filter(item => item.breakfast_id),
        items: orderItems.filter(item => item.item_id),
        total_price: parseFloat(total),
        order_type: orderType,
        table_id: orderType === 'local' ? parseInt(tableId) : null,
        delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : null,
        request_id: requestId,
      };

      const response = await api.submitOrder(orderData);
      if (!response.data?.orderId) throw new Error('Order creation failed: No orderId returned');

      clearCart();
      setSupplementSelections({});
      setTableId('');
      setTableSearch('');
      setDeliveryAddress('');
      toast.success('Order placed successfully!');
      navigate(`/order-waiting/${response.data.orderId}`);
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to place order';
      if (error.response?.status === 429) {
        toast.error('Please wait a moment before placing another order.');
      } else if (message.includes('Price mismatch')) {
        toast.error('Price mismatch detected. Please refresh the page and try again.');
      } else {
        toast.error(message);
      }
    } finally {
      submissionLockRef.current = null;
      setIsSubmitting(false);
    }
  }, [orderType, tableId, deliveryAddress, aggregatedCart, supplementSelections, total, clearCart, navigate, validateOrder, breakfastOptions]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setSupplementSelections({});
      setTableId('');
      setTableSearch('');
      setDragOffset(0);
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      // Only allow drag-to-close if touch starts near the top (within 50px)
      if (touchY > 50) {
        touchStartY.current = null; // Disable drag if not near top
      }
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current) return;

    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY.current;
    const content = contentRef.current;

    if (content && deltaY < 0 && content.scrollTop > 0) {
      // Allow scrolling up if not at the top
      return;
    } else if (content && deltaY > 0 && content.scrollTop === 0) {
      // Initiate drag-to-close only if at the top
      setDragOffset(Math.min(deltaY, 300));
      e.preventDefault();
    } else if (deltaY > 0) {
      // Allow natural scrolling down
      return;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 150) {
      handleClose();
    } else {
      setDragOffset(0);
    }
    touchStartY.current = null;
  }, [dragOffset, handleClose]);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal && isOpen) {
      modal.addEventListener('touchstart', handleTouchStart, { passive: true });
      modal.addEventListener('touchmove', handleTouchMove, { passive: false });
      modal.addEventListener('touchend', handleTouchEnd, { passive: true });
      return () => {
        modal.removeEventListener('touchstart', handleTouchStart);
        modal.removeEventListener('touchmove', handleTouchMove);
        modal.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <style>{`
        :root {
          --primary-orange: #FF6B35;
          --primary-orange-dark: #F7931E;
          --error-red: #ff3b30;
          --neutral-gray: #666;
          --light-gray: #999;
          --modal-bg: rgba(255, 255, 255, 0.95);
          --overlay-bg: rgba(0, 0, 0, 0.4);
          --border-color: rgba(0, 0, 0, 0.05);
          --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--overlay-bg);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overscroll-behavior: none;
          animation: var(--animation, fadeIn 0.2s ease-out);
        }

        .modal {
          background: var(--modal-bg);
          width: 100%;
          max-width: 340px;
          max-height: 85vh;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .handle {
          width: 32px;
          height: 4px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
          align-self: center;
          margin: 6px 0;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.15);
        }

        .close-button:active {
          transform: scale(0.95);
        }

        .title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #000;
          text-align: center;
          font-family: var(--font-family);
        }

        .badge {
          background: rgba(0, 0, 0, 0.1);
          color: #333;
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 6px;
        }

        .content {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px 12px;
          -webkit-overflow-scrolling: touch; /* Smooth scrolling for iOS */
          scrollbar-width: thin;
          scrollbar-color: var(--light-gray) transparent;
        }

        .content::-webkit-scrollbar {
          width: 6px;
        }

        .content::-webkit-scrollbar-thumb {
          background: var(--light-gray);
          border-radius: 3px;
        }

        .empty-cart {
          text-align: center;
          padding: 32px 16px;
          color: var(--neutral-gray);
          font-size: 14px;
          font-family: var(--font-family);
        }

        .empty-cart-icon {
          font-size: 32px;
          margin-bottom: 10px;
          color: var(--light-gray);
        }

        .empty-cart-text {
          font-size: 14px;
          margin: 0 0 6px 0;
        }

        .empty-cart-subtext {
          font-size: 12px;
          color: var(--light-gray);
        }

        .cart-list {
          list-style: none;
          padding: 0;
          margin: 0 0 12px 0;
        }

        .cart-item {
          margin-bottom: 10px;
          background: var(--modal-bg);
          border-radius: 12px;
          padding: 10px;
          border: 1px solid var(--border-color);
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .item-image {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          overflow: hidden;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: #000;
          margin: 0 0 3px 0;
          line-height: 1.3;
          font-family: var(--font-family);
        }

        .item-price {
          font-size: 12px;
          color: var(--primary-orange);
          font-weight: 500;
        }

        .supplement-price {
          font-size: 11px;
          color: var(--neutral-gray);
          display: block;
        }

        .breakfast-options {
          margin-top: 4px;
        }

        .option-detail {
          display: block;
          font-size: 11px;
          color: var(--neutral-gray);
        }

        .supplement-select {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 12px;
          margin-top: 6px;
          background: rgba(255, 255, 255, 0.7);
          font-family: var(--font-family);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 6px;
        }

        .quantity-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .quantity-button {
          width: 28px;
          height: 28px;
          border: 1px solid var(--border-color);
          background: var(--modal-bg);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-orange);
        }

        .quantity-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .quantity-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 1);
        }

        .quantity-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .quantity-number {
          font-size: 14px;
          font-weight: 500;
          color: #000;
          min-width: 20px;
          text-align: center;
          font-family: var(--font-family);
        }

        .delete-button {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255, 59, 48, 0.1);
          color: var(--error-red);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-button:hover {
          background: rgba(255, 59, 48, 0.15);
        }

        .delete-button:active {
          transform: scale(0.95);
        }

        .summary {
          background: var(--modal-bg);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid var(--border-color);
          margin-bottom: 12px;
        }

        .total-price {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin: 0 0 12px 0;
          text-align: center;
          font-family: var(--font-family);
        }

        .form-group {
          margin-bottom: 10px;
        }

        .label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #333;
          margin-bottom: 5px;
          font-family: var(--font-family);
        }

        .select, .input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 14px;
          background: rgba(255, 255, 255, 0.7);
          font-family: var(--font-family);
        }

        .table-search-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .table-search-icon {
          position: absolute;
          left: 12px;
          color: var(--neutral-gray);
          font-size: 16px;
        }

        .table-search-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 14px;
          background: rgba(255, 255, 255, 0.7);
          font-family: var(--font-family);
        }

        .table-search-input:focus {
          outline: none;
          border-color: var(--primary-orange);
        }

        .table-list-container {
          max-height: 120px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.7);
          margin-top: 6px;
          scrollbar-width: thin;
          scrollbar-color: var(--light-gray) transparent;
        }

        .table-list-container::-webkit-scrollbar {
          width: 6px;
        }

        .table-list-container::-webkit-scrollbar-thumb {
          background: var(--light-gray);
          border-radius: 3px;
        }

        .table-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .table-item {
          padding: 10px 12px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s ease;
          font-family: var(--font-family);
        }

        .table-item:last-child {
          border-bottom: none;
        }

        .table-item:hover {
          background: rgba(255, 107, 53, 0.1);
        }

        .table-item.selected {
          background: rgba(255, 107, 53, 0.2);
          color: var(--primary-orange);
          font-weight: 500;
        }

        .table-list-empty {
          padding: 10px 12px;
          font-size: 14px;
          color: var(--neutral-gray);
          text-align: center;
          font-family: var(--font-family);
        }

        .place-order-button {
          width: 100%;
          padding: 12px;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-family);
        }

        .place-order-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%) !important;
          transform: translateY(-1px);
        }

        .place-order-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (min-width: 768px) {
          .modal {
            border-radius: 16px;
            align-self: center;
          }
        }

        @media (max-width: 767px) {
          .select, .input, .table-search-input {
            font-size: 14px;
          }
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
      <div className="overlay" style={{ '--animation': isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out' }}>
        <div
          ref={modalRef}
          className="modal"
          style={{ transform: `translateY(${dragOffset}px)` }}
        >
          <div className="handle" />
          <div className="header">
            <button
              onClick={handleClose}
              className="close-button"
            >
              <CloseIcon fontSize="small" />
            </button>
            <h3 className="title">Your Cart</h3>
            <div className="badge">{itemCount} items</div>
          </div>

          <div ref={contentRef} className="content">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <CoffeeIcon className="empty-cart-icon" />
                <p className="empty-cart-text">Your cart is empty</p>
                <p className="empty-cart-subtext">Add some delicious items to get started!</p>
              </div>
            ) : (
              <>
                <ul className="cart-list">
                  {aggregatedCart.map((item) => (
                    <CartItem
                      key={item.cartItemId}
                      item={item}
                      itemSupplements={item.breakfast_id ? [] : (itemSupplements[item.item_id] || [])}
                      breakfastOptions={item.breakfast_id ? (breakfastOptions[item.breakfast_id] || []) : []}
                      supplementSelections={supplementSelections}
                      handleQuantityChange={handleQuantityChange}
                      handleSupplementChange={handleSupplementChange}
                      api={api}
                    />
                  ))}
                </ul>

                <div className="summary">
                  <div className="total-price">Total: ${total}</div>

                  <div className="form-group">
                    <label className="label">
                      <RestaurantIcon style={{ fontSize: '14px' }} />
                      Order Type
                    </label>
                    <select
                      onChange={(e) => setOrderType(e.target.value)}
                      value={orderType}
                      className="select"
                    >
                      <option value="local">Dine In</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>

                  {orderType === 'local' && (
                    <>
                      <div className="form-group">
                        <label className="label">
                          <RestaurantIcon style={{ fontSize: '14px' }} />
                          Search Table
                        </label>
                        <div className="table-search-container">
                          <SearchIcon className="table-search-icon" />
                          <input
                            type="text"
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            placeholder="Search table number..."
                            className="table-search-input"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">
                          <RestaurantIcon style={{ fontSize: '14px' }} />
                          Select Table
                        </label>
                        <div className="table-list-container">
                          {filteredTables.length > 0 ? (
                            <ul className="table-list">
                              {filteredTables.map((t) => (
                                <li
                                  key={t.id}
                                  className={`table-item ${tableId === t.id ? 'selected' : ''}`}
                                  onClick={() => setTableId(t.id)}
                                >
                                  Table {t.table_number}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="table-list-empty">No tables found</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {orderType === 'delivery' && (
                    <div className="form-group">
                      <label className="label">
                        <LocalShippingIcon style={{ fontSize: '14px' }} />
                        Delivery Address
                      </label>
                      <input
                        value={deliveryAddress || ''}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                        className="input"
                      />
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="place-order-button"
                    style={{
                      background: isSubmitting
                        ? 'rgba(0, 0, 0, 0.3)'
                        : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                      opacity: isSubmitting ? 0.7 : 1,
                      pointerEvents: isSubmitting ? 'none' : 'auto',
                    }}
                  >
                    {isSubmitting ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <div className="spinner"></div>
                        Placing Order...
                      </div>
                    ) : (
                      `Place Order - $${total}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CartModal;