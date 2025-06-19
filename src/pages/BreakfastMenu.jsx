import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import {
  ShoppingCartOutlined,
  ArrowBackIosOutlined,
  CheckCircleOutlined,
  CategoryOutlined,
  RemoveOutlined,
  AddOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
} from '@mui/icons-material';

function BreakfastMenu({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [breakfasts, setBreakfasts] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});
  const [addingToCart, setAddingToCart] = useState({});

  const getImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl === '/Uploads/undefined' || imageUrl === 'null') {
      return '/placeholder.jpg';
    }
    return `${api.defaults.baseURL.replace('/api', '')}${imageUrl}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        setLoading(true);
        let breakfastsData = [];

        if (id) {
          const [breakfastResponse, optionsResponse, groupsResponse] = await Promise.all([
            api.getBreakfast(id),
            api.getBreakfastOptions(id),
            api.getBreakfastOptionGroups(id),
          ]);
          if (!breakfastResponse.data.availability) {
            throw new Error('Breakfast is not available');
          }
          breakfastsData = [{
            ...breakfastResponse.data,
            options: optionsResponse.data || [],
            optionGroups: groupsResponse.data || [],
          }];
        } else {
          const breakfastResponse = await api.getBreakfasts();
          breakfastsData = await Promise.all(
            breakfastResponse.data
              .filter((b) => b.availability)
              .map(async (breakfast) => {
                const [optionsResponse, groupsResponse] = await Promise.all([
                  api.getBreakfastOptions(breakfast.id),
                  api.getBreakfastOptionGroups(breakfast.id),
                ]);
                return {
                  ...breakfast,
                  options: optionsResponse.data || [],
                  optionGroups: groupsResponse.data || [],
                };
              })
          );
        }

        setBreakfasts(breakfastsData);
        const initialQuantities = {};
        const initialOptions = {};
        const initialExpanded = {};
        breakfastsData.forEach((b) => {
          initialQuantities[b.id] = 1;
          initialOptions[b.id] = {};
          initialExpanded[b.id] = false;
        });
        setQuantities(initialQuantities);
        setSelectedOptions(initialOptions);
        setExpandedOptions(initialExpanded);
      } catch (error) {
        console.error('Error fetching breakfasts:', error);
        toast.error(error.response?.data?.error || 'Failed to load breakfasts');
        setError('Failed to load breakfasts');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleOptionChange = useCallback((breakfastId, groupId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [breakfastId]: {
        ...prev[breakfastId],
        [groupId]: optionId,
      },
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [breakfastId]: {
        ...prev[breakfastId],
        [groupId]: false,
      },
    }));
  }, []);

  const toggleOptionsExpanded = useCallback((breakfastId) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [breakfastId]: !prev[breakfastId],
    }));
  }, []);

  const handleAddToCart = useCallback(
    async (breakfast) => {
      try {
        setAddingToCart((prev) => ({ ...prev, [breakfast.id]: true }));
        
        const selectedGroupOptions = selectedOptions[breakfast.id] || {};
        const requiredGroups = breakfast.optionGroups.map((g) => g.id);
        const missingGroups = requiredGroups.filter((gId) => !selectedGroupOptions[gId]);
        
        if (missingGroups.length > 0) {
          toast.error('Please select one option for each option group');
          setValidationErrors((prev) => ({
            ...prev,
            [breakfast.id]: {
              ...prev[breakfast.id],
              ...missingGroups.reduce((acc, gId) => ({ ...acc, [gId]: true }), {}),
            },
          }));
          return;
        }

        const selectedOptionIds = Object.values(selectedGroupOptions).filter((id) => id);
        const basePrice = parseFloat(breakfast.price) || 0;
        const optionsPrice = breakfast.options
          .filter((opt) => selectedOptionIds.includes(opt.id))
          .reduce((sum, opt) => sum + parseFloat(opt.additional_price), 0);
        const totalPrice = (basePrice + optionsPrice) * (quantities[breakfast.id] || 1);

        const itemToAdd = {
          breakfast_id: parseInt(breakfast.id),
          name: breakfast.name || 'Unknown Breakfast',
          unit_price: basePrice,
          total_price: totalPrice,
          quantity: parseInt(quantities[breakfast.id]) || 1,
          image_url: getImageUrl(breakfast.image_url),
          option_ids: selectedOptionIds,
          options: breakfast.options
            .filter((opt) => selectedOptionIds.includes(opt.id))
            .map((opt) => ({
              ...opt,
              group_title: breakfast.optionGroups.find((g) => g.id === opt.group_id)?.title || 'Unknown Group',
            })),
          cartItemId: `${breakfast.id}-${Date.now()}`,
        };
        
        await addToCart(itemToAdd);
        toast.success(`${breakfast.name} added to cart!`);
        setQuantities((prev) => ({ ...prev, [breakfast.id]: 1 }));
        setSelectedOptions((prev) => ({ ...prev, [breakfast.id]: {} }));
        setValidationErrors((prev) => ({ ...prev, [breakfast.id]: {} }));
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error(error.response?.data?.error || 'Failed to add to cart');
      } finally {
        setAddingToCart((prev) => ({ ...prev, [breakfast.id]: false }));
      }
    },
    [addToCart, quantities, selectedOptions]
  );

  const calculatePriceBreakdown = useCallback(
    (breakfast) => {
      const basePrice = parseFloat(breakfast.price) || 0;
      const optionsPrice = breakfast.options
        .filter((opt) => Object.values(selectedOptions[breakfast.id] || {}).includes(opt.id))
        .reduce((sum, opt) => sum + parseFloat(opt.additional_price), 0);
      const quantity = quantities[breakfast.id] || 1;
      const total = (basePrice + optionsPrice) * quantity;
      return {
        basePrice: basePrice.toFixed(2),
        optionsPrice: optionsPrice.toFixed(2),
        total: total.toFixed(2),
      };
    },
    [quantities, selectedOptions]
  );

  const breakfastList = useMemo(() => {
    return breakfasts.map((breakfast, index) => {
      const imageSrc = getImageUrl(breakfast.image_url);
      const priceBreakdown = calculatePriceBreakdown(breakfast);
      const optionsByGroup = breakfast.optionGroups.reduce((acc, group) => {
        const groupOptions = breakfast.options.filter((opt) => opt.group_id === group.id);
        if (groupOptions.length > 0) {
          acc[group.id] = {
            title: group.title,
            options: groupOptions,
          };
        }
        return acc;
      }, {});

      const hasOptions = Object.keys(optionsByGroup).length > 0;
      const isExpanded = expandedOptions[breakfast.id];
      const isAddingToCart = addingToCart[breakfast.id];

      return (
        <div 
          key={breakfast.id} 
          className="breakfast-card"
          style={{
            ...styles.breakfastCard,
            animationDelay: `${index * 0.1}s`
          }}
        >
          {/* Image Section */}
          <div className="image-section" style={styles.imageSection}>
            <div className="image-container" style={styles.imageContainer}>
              <img
                src={imageSrc}
                alt={breakfast.name || 'Breakfast'}
                className="product-image"
                style={styles.productImage}
                loading="lazy"
                onError={(e) => (e.target.src = '/placeholder.jpg')}
              />
              <div className="image-overlay" style={styles.imageOverlay}>
                <div className="availability-badge" style={{
                  ...styles.availabilityBadge,
                  ...(breakfast.availability ? styles.availableBadge : styles.unavailableBadge)
                }}>
                  <CheckCircleOutlined style={{ fontSize: '14px' }} />
                  {breakfast.availability ? 'Available' : 'Unavailable'}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="content-section" style={styles.contentSection}>
            {/* Header */}
            <div className="product-header" style={styles.productHeader}>
              <h2 className="product-title" style={styles.productTitle}>
                {breakfast.name || 'Unknown Breakfast'}
              </h2>
              <div className="price-badge" style={styles.priceBadge}>
                ${priceBreakdown.basePrice}
              </div>
            </div>

            {/* Description */}
            <p className="product-description" style={styles.productDescription}>
              {breakfast.description || 'No description available.'}
            </p>

            {/* Options Section */}
            {hasOptions && (
              <div className="options-section" style={styles.optionsSection}>
                <button
                  className="options-toggle"
                  style={styles.optionsToggle}
                  onClick={() => toggleOptionsExpanded(breakfast.id)}
                >
                  <CategoryOutlined style={{ fontSize: '16px' }} />
                  <span>Customize ({Object.keys(optionsByGroup).length} options)</span>
                  {isExpanded ? 
                    <ExpandLessOutlined style={{ fontSize: '20px' }} /> : 
                    <ExpandMoreOutlined style={{ fontSize: '20px' }} />
                  }
                </button>

                <div 
                  className={`options-content ${isExpanded ? 'expanded' : ''}`}
                  style={{
                    ...styles.optionsContent,
                    ...(isExpanded ? styles.optionsContentExpanded : {})
                  }}
                >
                  {Object.entries(optionsByGroup).map(([groupId, group]) => (
                    <div
                      key={groupId}
                      className="option-group"
                      style={{
                        ...styles.optionGroup,
                        ...(validationErrors[breakfast.id]?.[groupId] ? styles.optionGroupError : {})
                      }}
                    >
                      <div className="group-title" style={styles.groupTitle}>
                        {group.title}
                        {validationErrors[breakfast.id]?.[groupId] && (
                          <span style={styles.errorIndicator}>*</span>
                        )}
                      </div>
                      <div className="options-grid" style={styles.optionsGrid}>
                        {group.options.map((opt) => {
                          const isSelected = selectedOptions[breakfast.id]?.[groupId] === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`option-item ${isSelected ? 'selected' : ''}`}
                              style={{
                                ...styles.optionItem,
                                ...(isSelected ? styles.optionItemSelected : {})
                              }}
                            >
                              <input
                                type="radio"
                                name={`group-${breakfast.id}-${groupId}`}
                                checked={isSelected}
                                onChange={() => handleOptionChange(breakfast.id, groupId, opt.id)}
                                disabled={!breakfast.availability}
                                style={styles.hiddenRadio}
                              />
                              <div className="option-content" style={styles.optionContent}>
                                <span className="option-name" style={styles.optionName}>
                                  {opt.option_name}
                                </span>
                                <span className="option-price" style={styles.optionPrice}>
                                  +${parseFloat(opt.additional_price).toFixed(2)}
                                </span>
                              </div>
                              <div className="radio-indicator" style={{
                                ...styles.radioIndicator,
                                ...(isSelected ? styles.radioIndicatorSelected : {})
                              }}>
                                {isSelected && <div style={styles.radioIndicatorDot}></div>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Section */}
            <div className="bottom-section" style={styles.bottomSection}>
              {/* Quantity & Price */}
              <div className="quantity-price-row" style={styles.quantityPriceRow}>
                <div className="quantity-section" style={styles.quantitySection}>
                  <span className="quantity-label" style={styles.quantityLabel}>Qty</span>
                  <div className="quantity-controls" style={styles.quantityControls}>
                    <button
                      className="quantity-btn"
                      style={{
                        ...styles.quantityButton,
                        ...(quantities[breakfast.id] <= 1 || !breakfast.availability ? styles.quantityButtonDisabled : {})
                      }}
                      onClick={() =>
                        setQuantities((prev) => ({
                          ...prev,
                          [breakfast.id]: Math.max(1, prev[breakfast.id] - 1),
                        }))
                      }
                      disabled={quantities[breakfast.id] <= 1 || !breakfast.availability}
                    >
                      <RemoveOutlined style={{ fontSize: '16px' }} />
                    </button>
                    <span className="quantity-display" style={styles.quantityDisplay}>
                      {quantities[breakfast.id]}
                    </span>
                    <button
                      className="quantity-btn"
                      style={{
                        ...styles.quantityButton,
                        ...(!breakfast.availability ? styles.quantityButtonDisabled : {})
                      }}
                      onClick={() =>
                        setQuantities((prev) => ({
                          ...prev,
                          [breakfast.id]: prev[breakfast.id] + 1,
                        }))
                      }
                      disabled={!breakfast.availability}
                    >
                      <AddOutlined style={{ fontSize: '16px' }} />
                    </button>
                  </div>
                </div>

                <div className="total-price" style={styles.totalPrice}>
                  <span className="total-label" style={styles.totalLabel}>Total</span>
                  <span className="total-amount" style={styles.totalAmount}>
                    ${priceBreakdown.total}
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                className={`add-to-cart-btn ${isAddingToCart ? 'loading' : ''}`}
                style={{
                  ...styles.addToCartButton,
                  ...(!breakfast.availability ? styles.addToCartButtonDisabled : {}),
                  ...(isAddingToCart ? styles.addToCartButtonLoading : {})
                }}
                onClick={() => handleAddToCart(breakfast)}
                disabled={!breakfast.availability || isAddingToCart}
              >
                {isAddingToCart ? (
                  <>
                    <div className="loading-spinner" style={styles.loadingSpinner}></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCartOutlined style={{ fontSize: '18px' }} />
                    {breakfast.availability ? 'Add to Cart' : 'Unavailable'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    });
  }, [breakfasts, quantities, selectedOptions, validationErrors, expandedOptions, addingToCart, 
      handleAddToCart, handleOptionChange, toggleOptionsExpanded]);

  if (error) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>🍽️</div>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div className="main-loading-spinner" style={styles.mainLoadingSpinner}></div>
            <p style={styles.loadingText}>Loading delicious breakfasts...</p>
          </div>
        </div>
      </>
    );
  }

  if (breakfasts.length === 0) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>🔍</div>
            <p style={styles.errorText}>No breakfasts available</p>
            <button style={styles.retryButton} onClick={() => navigate('/')}>
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{cssStyles}</style>
      <div style={styles.container}>
        {/* Header */}
        <div className="header" style={styles.header}>
          <button
            className="header-back-btn"
            style={styles.headerBackButton}
            onClick={() => navigate(-1)}
          >
            <ArrowBackIosOutlined style={{ fontSize: '18px' }} />
          </button>
          <h1 className="header-title" style={styles.headerTitle}>
            {id ? breakfasts[0]?.name || 'Breakfast' : 'Breakfast Menu'}
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Content */}
        <div className="content" style={styles.content}>
          {breakfastList}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    position: 'relative',
  },
  header: {
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: '0',
    zIndex: '100',
    boxShadow: '0 2px 20px rgba(255, 107, 53, 0.3)',
  },
  headerBackButton: {
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    margin: '0',
    letterSpacing: '-0.5px',
  },
  content: {
    padding: '16px',
    paddingBottom: '32px',
  },
  breakfastCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    marginBottom: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease',
    animation: 'slideUp 0.6s ease-out forwards',
    opacity: '0',
    transform: 'translateY(20px)',
  },
  imageSection: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  imageOverlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '12px',
  },
  availabilityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  availableBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    color: 'white',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
  },
  contentSection: {
    padding: '20px',
  },
  productHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
    gap: '12px',
  },
  productTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0',
    lineHeight: '1.3',
    flex: '1',
  },
  priceBadge: {
    backgroundColor: '#ff6b35',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: '0',
  },
  productDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  optionsSection: {
    marginBottom: '20px',
  },
  optionsToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  optionsContent: {
    maxHeight: '0',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, padding 0.3s ease',
    paddingTop: '0',
  },
  optionsContentExpanded: {
    maxHeight: '1000px',
    paddingTop: '16px',
  },
  optionGroup: {
    marginBottom: '16px',
  },
  optionGroupError: {
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '8px',
    backgroundColor: '#fef2f2',
  },
  groupTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  errorIndicator: {
    color: '#ef4444',
    fontSize: '16px',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  optionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
  },
  optionItemSelected: {
    borderColor: '#ff6b35',
    backgroundColor: '#fff7ed',
  },
  hiddenRadio: {
    display: 'none',
  },
  optionContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1',
  },
  optionName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
  },
  optionPrice: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  radioIndicator: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  radioIndicatorSelected: {
    borderColor: '#ff6b35',
    backgroundColor: '#ff6b35',
  },
  radioIndicatorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'white',
  },
  bottomSection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
  },
  quantityPriceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  quantitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  quantityLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    padding: '4px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  quantityButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  quantityDisplay: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '32px',
    textAlign: 'center',
  },
  totalPrice: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '2px',
  },
  totalAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff6b35',
  },
  addToCartButton: {
    width: '100%',
    height: '48px',
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(255, 107, 53, 0.3)',
  },
  addToCartButtonDisabled: {
    background: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  addToCartButtonLoading: {
    background: '#d1d5db',
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: '0.7',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  mainLoadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 107, 53, 0.2)',
    borderTop: '4px solid #ff6b35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    gap: '16px',
  },
  errorIcon: {
    fontSize: '56px',
  },
  errorText: {
    fontSize: '16px',
    color: '#ef4444',
    fontWeight: '500',
  },
  retryButton: {
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    fontWeight: '500',
  },
};

const cssStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .header-back-btn:hover {
    background-color: white;
    transform: scale(1.05);
  }
  .breakfast-card:hover .product-image {
    transform: scale(1.05);
  }
  .options-toggle:hover {
    background-color: #e5e7eb;
    transform: translateY(-1px);
  }
  .option-item:hover:not(.selected) {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }
  .quantity-btn:hover:not(:disabled) {
    background-color: #ff6b35;
    color: white;
    box-shadow: '0 2px 8px rgba(255, 107, 53, 0.3)';
  }
  .add-to-cart-btn:hover:not(:disabled):not(.loading) {
    transform: translateY(-2px);
    box-shadow: '0 6px 20px rgba(255, 107, 53, 0.4)';
  }
  .retry-button:hover {
    transform: translateY(-1px);
    box-shadow: '0 4px 12px rgba(255, 107, 53, 0.3)';
  }
  @media (max-width: 767px) {
    .container {
      padding: 0 12px 12px;
    }
    .header {
      padding: 12px 16px;
    }
    .product-title {
      fontSize: 18px;
    }
    .product-description {
      fontSize: 13px;
    }
    .option-group {
      padding: 8px;
      margin-bottom: 12px;
    }
    .group-title {
      fontSize: 13px;
      margin-bottom: 6px;
    }
    .option-item {
      padding: 10px;
      font-size: 13px;
    }
    .option-name {
      font-size: 13px;
    }
    .option-price {
      font-size: 11px;
    }
    .total-amount {
      font-size: 16px;
    }
    .image-section {
      height: 180px;
    }
  }
  @media (min-width: 768px) {
    .container {
      padding: 0 24px 24px;
    }
    .header {
      padding: 20px 24px;
    }
    .image-section {
      height: 240px;
    }
    .product-title {
      font-size: 22px;
    }
    .product-description {
      font-size: 15px;
    }
    .options-grid {
      grid-template-columns: 'repeat(auto-fit, minmax(200px, 1fr))';
    }
    .option-item {
      padding: 12px;
    }
    .total-amount {
      font-size: 20px;
    }
  }
`;

export default BreakfastMenu;