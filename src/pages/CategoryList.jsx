import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { AlertTriangle, Coffee, ArrowRight, RotateCw, X } from 'lucide-react';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCloseAnimation, setShowCloseAnimation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error(error.response?.data?.error || 'Failed to load categories');
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (id) => {
    navigate(`/category/${id}`);
  };

  const handleClose = () => {
    setShowCloseAnimation(true);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  if (error) {
    return (
      <>
        <style>{cssStyles}</style>
        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <AlertTriangle size={56} color="#ff6b35" style={styles.errorIcon} />
            <h3 style={styles.errorTitle}>Oops! Something went wrong</h3>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryButton} onClick={() => window.location.reload()} className="retry-btn">
              <RotateCw size={18} style={{marginRight: '8px'}} />
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
          <p style={styles.loadingText}>Loading categories...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{cssStyles}</style>
      <div style={{...styles.container, ...(showCloseAnimation ? styles.containerClosing : {})}}>
        
        {/* Header Section with Gradient Background */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <button 
              style={styles.closeButton}
              onClick={handleClose}
              className="close-btn"
            >
              <X size={20} color="#fff" />
            </button>
            
            <div style={styles.titleSection}>
              <h1 style={styles.title}>Our Categories</h1>
              <p style={styles.subtitle}>Discover what we have to offer</p>
            </div>
            
            <div style={styles.headerEmoji}>🍴</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          {categories.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <Coffee size={64} color="#ff8c42" style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>No Categories Yet</h3>
              <p style={styles.emptyText}>Check back soon for new categories!</p>
            </div>
          )}
          
          <div className="category-grid">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="category-card"
                style={{
                  ...styles.categoryCard,
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div style={styles.imageContainer}>
                  {category.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${category.image_url}`}
                      alt={category.name}
                      style={styles.categoryImage}
                      loading="lazy"
                    />
                  ) : (
                    <div style={styles.placeholderImage}>
                      <Coffee size={40} color="#ff8c42" />
                    </div>
                  )}
                  <div style={styles.imageOverlay}></div>
                  <div style={styles.cardBadge}>
                    <ArrowRight size={16} color="#fff" />
                  </div>
                </div>
                
                <div style={styles.cardContent}>
                  <h3 style={styles.categoryName}>{category.name}</h3>
                  <p style={styles.categoryDescription}>
                    {category.description || 'Explore delicious options in this category'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    backgroundColor: '#faf8f5',
    minHeight: '100vh',
    animation: 'slideInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    width: '100%',
  },
  containerClosing: {
    animation: 'slideOutDown 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
  },
  header: {
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 50%, #ff4500 100%)',
    borderRadius: '0 0 32px 32px',
    padding: '20px',
    paddingTop: '60px',
    paddingBottom: '40px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  closeButton: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    backdropFilter: 'blur(10px)',
  },
  titleSection: {
    flex: 1,
    textAlign: 'center',
    marginLeft: '20px',
    marginRight: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
    textShadow: '0 1px 6px rgba(0, 0, 0, 0.1)',
    whiteSpace: 'nowrap',
  },
  headerEmoji: {
    fontSize: '36px',
    animation: 'bounce 2s infinite',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
  },
  content: {
    padding: '0 20px 40px 20px',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    animation: 'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
    opacity: 0,
    transform: 'translateY(30px)',
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    height: '160px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(255, 140, 66, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: '0',
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%)',
  },
  cardBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  cardContent: {
    padding: '20px',
  },
  categoryName: {
    fontSize: '20px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 8px 0',
    lineHeight: '1.3',
    letterSpacing: '-0.5px',
  },
  categoryDescription: {
    fontSize: '15px',
    color: '#8e8e93',
    margin: '0',
    lineHeight: '1.5',
    fontWeight: '500',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf8f5',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 140, 66, 0.2)',
    borderTop: '4px solid #ff8c42',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '16px',
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
    padding: '40px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  errorIcon: {
    marginBottom: '20px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1c1c1e',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  errorText: {
    fontSize: '16px',
    color: '#8e8e93',
    margin: '0 0 32px 0',
    lineHeight: '1.4',
    fontWeight: '500',
  },
  retryButton: {
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
    letterSpacing: '0.5px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  emptyIcon: {
    marginBottom: '8px',
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#8e8e93',
    margin: 0,
    lineHeight: '1.4',
    fontWeight: '500',
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

  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideOutDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
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

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-8px);
    }
    60% {
      transform: translateY(-4px);
    }
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
    }
    50% {
      box-shadow: 0 8px 32px rgba(255, 107, 53, 0.5);
    }
  }

  /* Close Button Hover */
  .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
  }

  .close-btn:active {
    transform: scale(0.95);
  }

  /* Category Grid */
  .category-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: '100%';
  }

  /* Category Card Hover Effects */
  .category-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 48px rgba(255, 107, 53, 0.2);
  }

  .category-card:hover img {
    transform: scale(1.1);
  }

  .category-card:hover .card-badge {
    background-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.2) rotate(15deg);
  }

  .category-card:active {
    transform: translateY(-4px) scale(1.01);
  }

  /* Retry Button Hover */
  .retry-btn:hover {
    background: linear-gradient(135deg, #ff9955 0%, #ff7d42 100%);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.5);
    animation: pulseGlow 2s infinite;
  }

  .retry-btn:active {
    transform: translateY(0) scale(1.02);
  }

  /* Mobile responsive text adjustments */
  @media (max-width: 480px) {
    .title-section h1 {
      font-size: 20px !important;
      letter-spacing: -0.3px !important;
    }
    
    .title-section p {
      font-size: 12px !important;
    }
  }

  @media (max-width: 320px) {
    .title-section h1 {
      font-size: 18px !important;
      letter-spacing: -0.2px !important;
    }
    
    .title-section p {
      font-size: 11px !important;
    }
  }

  /* Responsive Design */
  @media (max-width: 360px) {
    .category-grid {
      gap: 12px;
    }
  }

  @media (min-width: 768px) {
    .category-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
  }

  @media (min-width: 1024px) {
    .category-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
  }

  @media (min-width: 1400px) {
    .category-grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 28px;
    }
  }

  /* iOS-style tap highlights */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Enhanced animations for mobile */
  @media (hover: none) and (pointer: coarse) {
    .category-card:active {
      transform: translateY(-4px) scale(1.01);
      transition: transform 0.1s ease;
    }
    
    .close-btn:active {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
    
    .retry-btn:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
  }

  /* Better touch targets for mobile */
  @media (max-width: 767px) {
    .category-card {
      min-height: 240px;
    }
    
    .close-btn {
      width: 48px;
      height: 48px;
      border-radius: 24px;
    }
  }
`;

export default CategoryList;