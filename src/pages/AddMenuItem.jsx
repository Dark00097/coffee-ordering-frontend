import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { createFormData } from '../utils/formDataHelper';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Restaurant as RestaurantIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  Check as CheckIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

function AddMenuItem() {
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    regular_price: '',
    category_id: '',
    image: null,
    availability: true,
    dietary_tags: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/check-auth');
        if (res.data.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/login');
        } else {
          setUser(res.data);
          console.log('User authenticated:', res.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err.response?.data || err.message);
        toast.error(err.response?.data?.error || 'Please log in');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error(error.response?.data?.error || 'Failed to fetch categories');
      }
    };

    checkAuth();
    fetchCategories();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value;
    setNewItem(prev => ({
      ...prev,
      [name]: newValue,
    }));
    console.log('Input changed:', { name, value: type === 'file' ? files[0]?.name : newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !user) {
      toast.error('Please wait, authentication is still loading');
      return;
    }
    try {
      if (!newItem.name.trim()) {
        toast.error('Name is required');
        return;
      }
      const regular_price = parseFloat(newItem.regular_price);
      if (isNaN(regular_price) || regular_price <= 0) {
        toast.error('Regular price must be a positive number');
        return;
      }
      if (!newItem.category_id) {
        toast.error('Category is required');
        return;
      }
      if (newItem.dietary_tags && !/^[a-zA-Z0-9\s,-]+$/.test(newItem.dietary_tags)) {
        toast.error('Dietary tags must be a comma-separated list of valid tags');
        return;
      }
      if (newItem.image && !['image/jpeg', 'image/png'].includes(newItem.image.type)) {
        toast.error('Image must be JPEG or PNG');
        return;
      }
      if (newItem.image && newItem.image.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const payload = {
        user_id: user.id,
        name: newItem.name.trim(),
        description: newItem.description || '',
        regular_price: regular_price.toFixed(2),
        category_id: newItem.category_id || '',
        availability: newItem.availability,
        dietary_tags: newItem.dietary_tags || '',
        image: newItem.image || null,
      };

      console.log('FormData payload before creation:', payload);
      const formData = createFormData(payload);

      const response = await api.post('/menu-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Menu item added:', response.data);
      toast.success('Menu item added');
      setNewItem({
        name: '',
        description: '',
        regular_price: '',
        category_id: '',
        image: null,
        availability: true,
        dietary_tags: '',
      });
      navigate('/admin');
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error(error.response?.data?.error || 'Failed to add menu item');
    }
  };

  if (isLoading || !user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => navigate('/admin')}
          style={styles.backButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <ArrowBackIcon style={styles.backIcon} />
        </button>
        <div style={styles.titleSection}>
          <RestaurantIcon style={styles.titleIcon} />
          <h1 style={styles.title}>Add New Menu Item</h1>
        </div>
      </div>

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Name Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="name">
                <RestaurantIcon style={styles.labelIcon} />
                Item Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={newItem.name}
                onChange={handleInputChange}
                placeholder="Enter item name"
                required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Price Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="regular_price">
                <AttachMoneyIcon style={styles.labelIcon} />
                Price *
              </label>
              <input
                id="regular_price"
                type="number"
                name="regular_price"
                step="0.01"
                min="0.01"
                value={newItem.regular_price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </div>

          {/* Description Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="description">
              <DescriptionIcon style={styles.labelIcon} />
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={newItem.description}
              onChange={handleInputChange}
              placeholder="Describe your menu item..."
              style={styles.textarea}
              onFocus={(e) => e.target.style.borderColor = '#2196F3'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={styles.formGrid}>
            {/* Category Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="category_id">
                <CategoryIcon style={styles.labelIcon} />
                Category *
              </label>
              <select
                id="category_id"
                name="category_id"
                value={newItem.category_id}
                onChange={handleInputChange}
                required
                style={styles.select}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Availability Toggle */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <CheckIcon style={styles.labelIcon} />
                Availability
              </label>
              <div style={styles.checkboxContainer}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="availability"
                    checked={newItem.availability}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkboxText}>Available for order</span>
                </label>
              </div>
            </div>
          </div>

          {/* Dietary Tags Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="dietary_tags">
              <LocalOfferIcon style={styles.labelIcon} />
              Dietary Tags
            </label>
            <input
              id="dietary_tags"
              type="text"
              name="dietary_tags"
              value={newItem.dietary_tags}
              onChange={handleInputChange}
              placeholder="e.g., vegan, gluten-free, dairy-free"
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#2196F3'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            <small style={styles.helperText}>Separate multiple tags with commas</small>
          </div>

          {/* Image Upload Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="image">
              <CloudUploadIcon style={styles.labelIcon} />
              Item Image
            </label>
            <div style={styles.fileInputContainer}>
              <input
                id="image"
                type="file"
                name="image"
                accept="image/jpeg,image/png"
                onChange={handleInputChange}
                style={styles.fileInput}
              />
              <label htmlFor="image" style={styles.fileInputLabel}>
                <CloudUploadIcon style={styles.uploadIcon} />
                {newItem.image ? newItem.image.name : 'Choose image file'}
              </label>
            </div>
            <small style={styles.helperText}>JPEG or PNG format, max 5MB</small>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !user || user.role !== 'admin'}
            style={{
              ...styles.submitButton,
              opacity: (isLoading || !user || user.role !== 'admin') ? 0.6 : 1,
              cursor: (isLoading || !user || user.role !== 'admin') ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.backgroundColor = '#1976D2';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.backgroundColor = '#2196F3';
              }
            }}
          >
            <AddIcon style={styles.buttonIcon} />
            Add Menu Item
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#fafafa',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #2196F3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#666',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px',
    maxWidth: '800px',
    margin: '0 auto 24px auto',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    marginRight: '16px',
    transition: 'all 0.2s ease',
  },
  backIcon: {
    fontSize: '24px',
    color: '#666',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  titleIcon: {
    fontSize: '32px',
    color: '#2196F3',
    marginRight: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  formCard: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  form: {
    padding: '32px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
  },
  labelIcon: {
    fontSize: '18px',
    color: '#666',
    marginRight: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
    outline: 'none',
  },
  checkboxContainer: {
    marginTop: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#333',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginRight: '8px',
    cursor: 'pointer',
  },
  checkboxText: {
    userSelect: 'none',
  },
  fileInputContainer: {
    position: 'relative',
  },
  fileInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  },
  fileInputLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '16px',
    color: '#666',
  },
  uploadIcon: {
    marginRight: '8px',
    fontSize: '20px',
  },
  helperText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
    display: 'block',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '16px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '24px',
  },
  buttonIcon: {
    marginRight: '8px',
    fontSize: '20px',
  },
};

// Add CSS animation for loading spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AddMenuItem;