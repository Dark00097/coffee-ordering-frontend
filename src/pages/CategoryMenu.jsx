import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import MenuItemCard from '../components/MenuItemCard';
import { toast } from 'react-toastify';
import { ChevronLeft, Coffee, Search, Filter } from 'lucide-react';
import debounce from 'lodash/debounce';

function CategoryMenu({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced search functionality
  const debouncedSearch = debounce((query) => {
    if (query.trim() === '') {
      setFilteredItems(menuItems);
      return;
    }
    
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  }, 300);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuResponse, categoryResponse, breakfastResponse] = await Promise.all([
          api.get(`/menu-items?category_id=${id}`),
          api.get(`/categories/${id}`),
          api.getBreakfasts(),
        ]);
        
        const menuData = menuResponse.data || [];
        const categoryData = categoryResponse.data;
        const breakfastData = breakfastResponse.data || [];

        // Filter breakfasts by category_id
        const categoryBreakfasts = breakfastData
          .filter(breakfast => breakfast.category_id === parseInt(id))
          .map(breakfast => ({
            ...breakfast,
            type: 'breakfast',
            category_name: categoryData?.name || 'Breakfast',
          }));

        // Combine menu items and breakfasts
        const combinedItems = [
          ...menuData,
          ...categoryBreakfasts,
        ];

        setMenuItems(combinedItems);
        setFilteredItems(combinedItems);
        setCategoryName(categoryData?.name || 'Category');
        setCategoryImage(categoryData?.image_url || null);
        
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 100);
      } catch (error) {
        console.error('Error fetching category data:', error);
        toast.error(error.response?.data?.error || 'Failed to load menu or category');
        setError('Failed to load category or menu items.');
        setMenuItems([]);
        setFilteredItems([]);
        setCategoryName('Category');
        setTimeout(() => setIsVisible(true), 100);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    } else {
      setError('Invalid category ID.');
      setLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [id]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, menuItems]);

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  const handleView = (itemId, itemType = 'menuItem') => {
    if (itemType === 'breakfast') {
      navigate(`/breakfast/${itemId}`);
    } else {
      navigate(`/product/${itemId}`);
    }
  };

  const handleSearchFocus = () => {
    // Optional: Add analytics or other focus behaviors
  };

  if (error) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <Coffee size={64} color="#ff6b35" style={{ marginBottom: '20px' }} />
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading delicious menu...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{cssStyles}</style>
      <div style={{
        ...styles.container,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
      }}>
        
        {/* Enhanced Header with Background */}
        <div style={styles.header} className="category-header">
          <div style={styles.headerBackground}>
            {categoryImage ? (
              <div 
                style={{
                  ...styles.headerImage,
                  backgroundImage: `url(${import.meta.env.VITE_API_URL || 'http://192.168.1.13:5000'}${categoryImage})`
                }}
              />
            ) : (
              <div style={styles.headerGradient} />
            )}
            <div style={styles.headerOverlay} />
          </div>

          <div style={styles.headerContent}>
            {/* Navigation Bar */}
            <div style={styles.navBar}>
              <button
                style={styles.backButton}
                onClick={handleBack}
                className="back-button"
              >
                <ChevronLeft size={24} color="white" />
              </button>
              <div style={styles.headerTitle}>
                <h1 style={styles.categoryTitle}>{categoryName}</h1>
                <p style={styles.categorySubtitle}>
                  {filteredItems.length} delicious item{filteredItems.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>

            {/* Search Section */}
            <div style={styles.searchSection}>
              <div style={styles.searchContainer}>
                <div style={styles.searchWrapper}>
                  <Search size={20} color="#8e8e93" style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search in this category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    style={styles.searchInput}
                    className="search-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={styles.content}>
          {/* Search Results Info */}
          {searchQuery && (
            <div style={styles.searchResults} className="search-results">
              <p style={styles.searchResultsText}>
                {filteredItems.length > 0 
                  ? `Found ${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} for "${searchQuery}"`
                  : `No items found for "${searchQuery}"`
                }
              </p>
            </div>
          )}

          {/* Menu Items Grid */}
          {filteredItems.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>
                <Coffee size={64} color="#8e8e93" />
              </div>
              <h3 style={styles.emptyStateTitle}>
                {searchQuery ? 'No items found' : 'No menu items available'}
              </h3>
              <p style={styles.emptyStateText}>
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all items.'
                  : 'This category is currently empty. Check back soon for new items!'
                }
              </p>
              {searchQuery && (
                <button 
                  style={styles.clearSearchButton}
                  onClick={() => setSearchQuery('')}
                  className="clear-search-btn"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="menu-grid" style={styles.menuGrid}>
              {filteredItems.map((item, index) => (
                <MenuItemCard
                  key={`${item.type || 'menuItem'}-${item.id}`}
                  item={item}
                  index={index}
                  isVisible={isVisible}
                  onAddToCart={addToCart}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Enhanced MenuItemCard wrapper with staggered animation
const EnhancedMenuItemCard = ({ item, index, isVisible, onAddToCart, onView }) => {
  const [cardVisible, setCardVisible] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setCardVisible(true);
      }, index * 80);
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  return (
    <div
      style={{
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transitionDelay: `${index * 0.08}s`,
      }}
      className="menu-item-wrapper"
    >
      <MenuItemCard
        item={item}
        onAddToCart={onAddToCart}
        onView={() => onView(item.id, item.type || 'menuItem')}
      />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf8f5',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    margin: 0,
    padding: 0,
    width: '100%',
  },

  header: {
    position: 'relative',
    height: '280px',
    overflow: 'hidden',
    marginBottom: '24px',
  },

  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    filter: 'brightness(0.7)',
  },

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 50%, #ff4500 100%)',
  },

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
  },

  headerContent: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px',
    paddingTop: '40px',
  },

  navBar: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },

  backButton: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    flexShrink: 0,
  },

  headerTitle: {
    flex: 1,
    paddingTop: '8px',
  },

  categoryTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 4px 0',
    letterSpacing: '-1.2px',
    textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
    lineHeight: '1.1',
  },

  categorySubtitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
    textShadow: '0 1px 6px rgba(0, 0, 0, 0.3)',
  },

  searchSection: {
    marginTop: 'auto',
  },

  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  searchWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  searchIcon: {
    position: 'absolute',
    left: '16px',
    zIndex: 2,
  },

  searchInput: {
    width: '100%',
    height: '52px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '26px',
    paddingLeft: '48px',
    paddingRight: '16px',
    fontSize: '16px',
    color: '#1c1c1e',
    outline: 'none',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    fontWeight: '500',
    boxSizing: 'border-box',
  },

  filterButton: {
    width: '52px',
    height: '52px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },

  content: {
    padding: '0 20px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },

  searchResults: {
    marginBottom: '20px',
    opacity: 0,
    animation: 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
  },

  searchResultsText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ff6b35',
    margin: 0,
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 107, 53, 0.2)',
  },

  menuGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    padding: '40px 20px',
  },

  emptyStateIcon: {
    marginBottom: '24px',
    opacity: 0.7,
  },

  emptyStateTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1c1c1e',
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
  },

  emptyStateText: {
    fontSize: '16px',
    color: '#8e8e93',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
    maxWidth: '320px',
  },

  clearSearchButton: {
    padding: '12px 24px',
    backgroundColor: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf8f5',
    gap: '20px',
  },

  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255, 140, 66, 0.2)',
    borderTop: '4px solid #ff8c42',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  loadingText: {
    fontSize: '18px',
    color: '#8e8e93',
    margin: 0,
    fontWeight: '500',
  },

  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf8f5',
    padding: '20px',
  },

  errorContent: {
    textAlign: 'center',
    maxWidth: '320px',
  },

  errorText: {
    fontSize: '18px',
    color: '#ff4444',
    margin: '0 0 24px 0',
    fontWeight: '600',
    lineHeight: '1.4',
  },

  retryButton: {
    padding: '14px 28px',
    backgroundColor: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
};

const cssStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 8px 32px rgba(255, 107, 53, 0.2);
    }
    50% {
      box-shadow: 0 12px 40px rgba(255, 107, 53, 0.4);
    }
  }

  /* Back Button Hover Effects */
  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
    box-shadow: 0 8px 32px rgba(255, 255, 255, 0.2);
  }

  .back-button:active {
    transform: scale(0.95);
  }

  /* Search Input Focus Effect */
  .search-input:focus {
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2);
    transform: scale(1.02);
  }

  /* Filter Button Hover */
  .filter-btn:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: scale(1.08);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
  }

  .filter-btn:active {
    transform: scale(0.95);
  }

  /* Clear Search Button Hover */
  .clear-search-btn:hover {
    background-color: #ff8c42;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.4);
  }

  .clear-search-btn:active {
    transform: translateY(0);
  }

  /* Search Results Animation */
  .search-results {
    animation: fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* Menu Grid Responsive */
  .menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
  }

  @media (max-width: 360px) {
    .menu-grid {
      gap: 12px;
    }
  }

  @media (min-width: 768px) {
    .menu-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
  }

  @media (min-width: 1024px) {
    .menu-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
  }

  @media (min-width: 1400px) {
    .menu-grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 28px;
    }
  }

  /* Enhanced Menu Item Wrapper Hover */
  .menu-item-wrapper:hover {
    transform: translateY(-4px) scale(1.02);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* iOS-style tap highlights */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Better touch targets for mobile */
  @media (max-width: 767px) {
    .search-input {
      font-size: 16px; /* Prevents zoom on iOS */
    }
    
    .category-header {
      height: 240px;
    }
  }

  /* Enhanced animations for mobile */
  @media (hover: none) and (pointer: coarse) {
    .back-button:active {
      transform: scale(0.9);
      transition: transform 0.1s ease;
    }
    
    .clear-search-btn:active {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
    
    .menu-item-wrapper:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
  }

  /* Header responsive adjustments */
  @media (max-width: 480px) {
    .category-header .category-title {
      font-size: 28px !important;
    }
    
    .category-header .category-subtitle {
      font-size: 14px !important;
    }
  }

  /* Retry button hover */
  .retry-button:hover {
    background-color: #ff8c42;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.4);
  }
`;

export default CategoryMenu;