import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import MenuItemCard from '../components/MenuItemCard';
import {
  ShoppingCartOutlined,
  FavoriteOutlined,
  ShareOutlined,
  RemoveOutlined,
  AddOutlined,
  CategoryOutlined,
  CheckCircleOutlined,
  ArrowBackIosOutlined,
  Star,
  RestaurantMenuOutlined,
} from '@mui/icons-material';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [selectedSupplement, setSelectedSupplement] = useState('0');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [isRatingSubmitted, setIsRating] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        setLoading(true);
        const itemId = parseInt(id);
        if (isNaN(itemId) || itemId <= 0) {
          throw new Error('Invalid product ID');
        }
        const [productResponse, relatedResponse, supplementsResponse, ratingResponse] = await Promise.all([
          api.get(`/menu-items/${itemId}`),
          api.get(`/menu-items/${itemId}/related`),
          api.getSupplementsByMenuItem(itemId),
          api.getRatingsByItem(itemId),
        ]);
        setProduct(productResponse.data);
        setRelatedProducts(relatedResponse.data || []);
        setSupplements(supplementsResponse.data || []);
        if (ratingResponse.data?.length > 0) {
          setIsRating(true);
          setRating(parseInt(ratingResponse.data[0].rating) || 0);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error(error.response?.data?.error || 'Failed to load product details');
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const debouncedRatingSubmit = useMemo(
    () =>
      debounce(async (ratingValue) => {
        if (ratingValue < 1 || ratingValue > 5) {
          toast.error('Please select a rating between 1 and 5');
          return;
        }
        try {
          await api.submitRating({
            item_id: parseInt(id),
            rating: parseInt(ratingValue),
          });
          setIsRating(true);
          toast.success('Rating submitted!');
          const response = await api.get(`/menu-items/${id}`);
          setProduct(response.data);
        } catch (error) {
          console.error('Error posting rating:', error);
          toast.error(error.response?.data?.error || 'Failed to submit rating');
        }
      }, 500),
    [id]
  );

  const handleAddToCart = useCallback(async () => {
    if (!product) {
      toast.error('Product not loaded');
      return;
    }
    if (!product.availability) {
      toast.error('Item is not available');
      return;
    }
    try {
      const selectedSupplementData = selectedSupplement !== '0'
        ? supplements.find((s) => s.supplement_id === parseInt(selectedSupplement))
        : null;
      const itemToAdd = {
        item_id: parseInt(product.id),
        name: product.name || 'Unknown Product',
        unit_price: parseFloat(product.sale_price || product.regular_price) || 0,
        quantity: parseInt(quantity) || 1,
        image_url: product.image_url && product.image_url !== '/Uploads/undefined' && product.image_url !== 'null'
          ? product.image_url
          : '/placeholder.jpg',
        supplement_id: selectedSupplementData ? parseInt(selectedSupplementData.supplement_id) : null,
        supplement_name: selectedSupplementData ? selectedSupplementData.name : null,
        supplement_price: selectedSupplementData ? parseFloat(selectedSupplementData.additional_price) || 0 : 0,
        cartItemId: `${product.id}-${Date.now()}`,
      };
      await addToCart(itemToAdd);
      toast.success(`${product.name} added to cart!`);
      setSelectedSupplement('0');
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.error || 'Failed to add to cart');
    }
  }, [product, quantity, selectedSupplement, supplements, addToCart]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || 'Product',
          text: product?.description || 'Check out this product!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  }, [product]);

  const handleStarClick = useCallback((star) => {
    if (!isRatingSubmitted) {
      setRating(star);
    }
  }, [isRatingSubmitted]);

  const handleViewProduct = useCallback((productId) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  const calculateTotalPrice = useCallback(() => {
    const basePrice = parseFloat(product?.sale_price || product?.regular_price) || 0;
    const supplementPrice = selectedSupplement !== '0'
      ? parseFloat(supplements.find((s) => s.supplement_id === parseInt(selectedSupplement))?.additional_price) || 0
      : 0;
    return ((basePrice + supplementPrice) * quantity).toFixed(2);
  }, [product, selectedSupplement, supplements, quantity]);

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
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>🔍</div>
            <p style={styles.errorText}>Product not found</p>
            <button style={styles.retryButton} onClick={() => navigate('/')}>
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const imageSrc = product.image_url && product.image_url !== '/Uploads/undefined' && product.image_url !== 'null'
    ? `${api.defaults.baseURL.replace('/api', '')}${product.image_url}`
    : '/placeholder.jpg';

  const regularPrice = parseFloat(product.regular_price) || 0;
  const salePrice = parseFloat(product.sale_price) || null;
  const averageRating = parseFloat(product.average_rating) || 0;
  const reviewCount = parseInt(product.review_count) || 0;

  return (
    <>
      <style>{cssStyles}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.headerButton} onClick={() => navigate(-1)} className="header-btn">
            <ArrowBackIosOutlined style={{ fontSize: '18px' }} />
          </button>
          <h1 style={styles.headerTitle}>Product Details</h1>
          <button style={styles.headerButton} onClick={handleShare} className="header-btn">
            <ShareOutlined style={{ fontSize: '18px' }} />
          </button>
        </div>

        <div style={styles.imageSection}>
          <div style={styles.imageContainer}>
            <img
              src={imageSrc}
              alt={product.name || 'Product'}
              style={styles.productImage}
              loading="lazy"
              decoding="async"
              onError={(e) => (e.target.src = '/placeholder.jpg')}
            />
            <button
              style={{
                ...styles.favoriteButton,
                backgroundColor: isFavorite ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              }}
              onClick={() => setIsFavorite(!isFavorite)}
              className="favorite-btn"
            >
              <FavoriteOutlined
                style={{
                  fontSize: '20px',
                  color: isFavorite ? '#ff6b35' : '#8e8e93',
                }}
              />
            </button>
          </div>
        </div>

        <div style={styles.detailsSection}>
          <h2 style={styles.productTitle}>{product.name || 'Unknown Product'}</h2>
          <div style={styles.ratingContainer}>
            <div style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  style={star <= Math.round(averageRating) ? styles.ratingStarFilled : styles.ratingStar}
                />
              ))}
            </div>
            <span style={styles.ratingText}>
              {averageRating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>

          <p style={styles.productDescription}>
            {product.description || 'No description available.'}
          </p>

          <div style={styles.priceSection}>
            <div style={styles.priceContainer}>
              {salePrice ? (
                <>
                  <span style={styles.originalPrice}>${regularPrice.toFixed(2)}</span>
                  <span style={styles.salePrice}>${salePrice.toFixed(2)}</span>
                  <span style={styles.saveBadge}>SAVE ${(regularPrice - salePrice).toFixed(2)}</span>
                </>
              ) : (
                <span style={styles.regularPriceOnly}>${regularPrice.toFixed(2)}</span>
              )}
            </div>
            <div style={styles.totalPrice}>
              Total: <span style={styles.totalAmount}>${calculateTotalPrice()}</span>
            </div>
          </div>

          <div style={styles.optionsCard}>
            <div style={styles.optionRow}>
              <div style={styles.optionLeft}>
                <CheckCircleOutlined
                  style={{
                    fontSize: '18px',
                    color: product.availability ? '#34d399' : '#ef4444',
                  }}
                />
                <span style={styles.optionLabel}>Availability</span>
              </div>
              <span
                style={{
                  ...styles.optionValue,
                  color: product.availability ? '#34d399' : '#ef4444',
                }}
              >
                {product.availability ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {product.dietary_tags && product.dietary_tags !== '[]' && (
              <div style={styles.optionRow}>
                <div style={styles.optionLeft}>
                  <RestaurantMenuOutlined style={{ fontSize: '18px', color: '#ff6b35' }} />
                  <span style={styles.optionLabel}>Dietary Tags</span>
                </div>
                <span style={styles.optionValue}>
                  {JSON.parse(product.dietary_tags || '[]').join(', ') || 'None'}
                </span>
              </div>
            )}

            {supplements.length > 0 && (
              <div style={styles.optionRow}>
                <div style={styles.optionLeft}>
                  <CategoryOutlined style={{ fontSize: '18px', color: '#ff6b35' }} />
                  <span style={styles.optionLabel}>Add Supplement</span>
                </div>
                <select
                  value={selectedSupplement}
                  onChange={(e) => setSelectedSupplement(e.target.value)}
                  style={styles.supplementSelect}
                  className="supplement-select"
                >
                  <option value="0">None</option>
                  {supplements.map((s) => (
                    <option key={s.supplement_id} value={s.supplement_id}>
                      {s.name} (+${parseFloat(s.additional_price || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.optionRow}>
              <div style={styles.optionLeft}>
                <Star style={{ fontSize: '18px', color: '#fbbf24' }} />
                <span style={styles.optionLabel}>Rate this item</span>
              </div>
              <div style={styles.userRatingContainer}>
                <div style={styles.userRatingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      style={star <= rating ? styles.userRatingStarFilled : styles.userRatingStar}
                      onClick={() => handleStarClick(star)}
                      className="rating-star"
                    />
                  ))}
                </div>
                {!isRatingSubmitted && rating > 0 && (
                  <button
                    style={styles.ratingSubmitButton}
                    onClick={() => debouncedRatingSubmit(rating)}
                    className="rating-submit-btn"
                  >
                    Submit
                  </button>
                )}
                {isRatingSubmitted && <span style={styles.ratingThankYou}>Thank you!</span>}
              </div>
            </div>

            <div style={styles.optionRow}>
              <div style={styles.optionLeft}>
                <span style={styles.optionLabel}>Quantity</span>
              </div>
              <div style={styles.quantityContainer}>
                <button
                  style={{
                    ...styles.quantityButton,
                    ...(quantity <= 1 || !product.availability ? styles.quantityButtonDisabled : {}),
                  }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !product.availability}
                  className="quantity-btn"
                >
                  <RemoveOutlined style={{ fontSize: '14px' }} />
                </button>
                <span style={styles.quantityDisplay}>{quantity}</span>
                <button
                  style={{
                    ...styles.quantityButton,
                    ...(!product.availability ? styles.quantityButtonDisabled : {}),
                  }}
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.availability}
                  className="quantity-btn"
                >
                  <AddOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
            </div>
          </div>

          <button
            style={{
              ...styles.addToCartButton,
              ...(!product.availability ? styles.addToCartButtonDisabled : {}),
            }}
            onClick={handleAddToCart}
            disabled={!product.availability}
            className="add-to-cart-btn"
          >
            <ShoppingCartOutlined style={{ fontSize: '18px' }} />
            {product.availability ? `Add to Cart • $${calculateTotalPrice()}` : 'Unavailable'}
          </button>
        </div>

        {relatedProducts.length > 0 && (
          <div style={styles.relatedSection}>
            <h3 style={styles.sectionTitle}>You might also like</h3>
            <div className="related-grid">
              {relatedProducts.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                  onView={handleViewProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    backgroundColor: '#faf8f5',
    minHeight: '100vh',
    padding: '0 16px 16px',
    boxSizing: 'border-box',
  },
  header: {
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderRadius: '0 0 16px 16px',
  },
  headerButton: {
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    margin: 0,
  },
  imageSection: {
    padding: '16px 0',
    display: 'flex',
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '280px',
  },
  productImage: {
    width: '100%',
    height: '280px',
    borderRadius: '16px',
    objectFit: 'cover',
    border: '2px solid rgba(255, 255, 255, 0.8)',
  },
  favoriteButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  detailsSection: {
    padding: '16px 0',
  },
  productTitle: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px',
  },
  ratingStars: {
    display: 'flex',
    gap: '2px',
  },
  ratingStar: {
    fontSize: '14px',
    color: '#d1d5db',
  },
  ratingStarFilled: {
    fontSize: '14px',
    color: '#fbbf24',
  },
  ratingText: {
    fontSize: '12px',
    color: '#8e8e93',
  },
  productDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  priceSection: {
    backgroundColor: 'rgba(255, 140, 66, 0.05)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  originalPrice: {
    fontSize: '14px',
    color: '#8e8e93',
    textDecoration: 'line-through',
  },
  salePrice: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ff6b35',
  },
  regularPriceOnly: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ff6b35',
  },
  saveBadge: {
    backgroundColor: '#34d399',
    color: 'white',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '8px',
  },
  totalPrice: {
    fontSize: '14px',
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  optionsCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  },
  optionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  optionLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  optionValue: {
    fontSize: '13px',
    color: '#6b7280',
  },
  supplementSelect: {
    minWidth: '120px',
    padding: '6px 30px 6px 8px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    fontSize: '13px',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
    backgroundPosition: 'right 8px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '14px',
  },
  userRatingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  userRatingStars: {
    display: 'flex',
    gap: '2px',
  },
  userRatingStar: {
    fontSize: '16px',
    color: '#d1d5db',
    cursor: 'pointer',
  },
  userRatingStarFilled: {
    fontSize: '16px',
    color: '#fbbf24',
    cursor: 'pointer',
  },
  ratingSubmitButton: {
    backgroundColor: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  ratingThankYou: {
    fontSize: '11px',
    color: '#34d399',
  },
  quantityContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '2px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  quantityButtonDisabled: {
    backgroundColor: '#e5e7eb',
    cursor: 'not-allowed',
    color: '#9ca3af',
  },
  quantityDisplay: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '20px',
    textAlign: 'center',
  },
  addToCartButton: {
    width: '100%',
    height: '48px',
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  addToCartButtonDisabled: {
    background: '#e5e7eb',
    cursor: 'not-allowed',
    color: '#9ca3af',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  relatedSection: {
    padding: '16px 0',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    gap: '12px',
  },
  errorIcon: {
    fontSize: '48px',
  },
  errorText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  retryButton: {
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '12px',
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255, 107, 53, 0.1)',
    borderTop: '3px solid #ff6b35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#6b7280',
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
  .header-btn:hover {
    background-color: white;
    transform: scale(1.05);
  }
  .favorite-btn:hover {
    transform: scale(1.05);
  }
  .supplement-select:focus {
    outline: none;
    border-color: #ff6b35;
  }
  .rating-star:hover {
    transform: scale(1.1);
  }
  .rating-submit-btn:hover {
    background-color: #ff4500;
  }
  .quantity-btn:hover:not(:disabled) {
    background-color: #ff6b35;
    color: white;
  }
  .add-to-cart-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }
  .related-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 360px) {
    .related-grid {
      gap: 8px;
    }
  }
  @media (min-width: 768px) {
    .container {
      padding: 0 24px 24px;
    }
    .header {
      padding: 24px;
    }
    .imageContainer {
      max-width: 320px;
    }
    .productImage {
      height: 320px;
    }
    .productTitle {
      font-size: 24px;
    }
    .productDescription {
      font-size: 15px;
    }
    .salePrice, .regularPriceOnly {
      font-size: 20px;
    }
    .totalAmount {
      font-size: 18px;
    }
  }
`;

export default ProductDetails;