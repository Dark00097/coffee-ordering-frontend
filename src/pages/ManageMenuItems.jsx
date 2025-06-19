import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  AddCircleOutline,
  DeleteOutline,
  Edit,
  Close,
  Save,
  Cancel,
  ArrowBack,
  Search,
  FilterList,
  Add,
  Restaurant,
  AttachMoney,
  Category,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { createFormData } from '../utils/formDataHelper';

// Utility function to safely parse dietary_tags
const safeParseDietaryTags = (tags) => {
  if (!tags || typeof tags !== 'string') return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing dietary_tags:', error, { tags });
    return [];
  }
};

function ManageMenuItems() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newSupplementId, setNewSupplementId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  // Base URL for images
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // CSS Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '32px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
    },
    headerTitle: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerSubtitle: {
      fontSize: '16px',
      opacity: '0.9',
      margin: '0'
    },
    backButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 20px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      marginTop: '16px'
    },
    controlsSection: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0'
    },
    controlsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      background: '#f8fafc',
      position: 'relative'
    },
    searchContainer: {
      position: 'relative'
    },
    searchIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      zIndex: 1
    },
    filterSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      background: 'white',
      transition: 'all 0.3s ease'
    },
    itemsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
      gap: '24px'
    },
    itemCard: {
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    itemCardEditing: {
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
      border: '2px solid #667eea',
      transition: 'all 0.3s ease'
    },
    itemImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '12px',
      marginBottom: '16px'
    },
    itemTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 8px 0'
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      margin: '0 0 12px 0'
    },
    regularPrice: {
      fontSize: '18px',
      color: '#94a3b8',
      textDecoration: 'line-through'
    },
    salePrice: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#059669'
    },
    itemMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '16px'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500'
    },
    availableBadge: {
      background: '#d1fae5',
      color: '#065f46'
    },
    unavailableBadge: {
      background: '#fee2e2',
      color: '#991b1b'
    },
    categoryBadge: {
      background: '#e0e7ff',
      color: '#3730a3'
    },
    dietaryTag: {
      background: '#f3e8ff',
      color: '#6b21a8'
    },
    itemDescription: {
      color: '#64748b',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '20px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px',
      marginTop: '16px'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 16px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease',
      flex: 1
    },
    secondaryButton: {
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 16px',
      color: '#475569',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease',
      flex: 1
    },
    dangerButton: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '10px 16px',
      color: '#dc2626',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease',
      flex: 1
    },
    formSection: {
      marginBottom: '24px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formLabel: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      background: 'white',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 0'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      accentColor: '#667eea'
    },
    supplementSection: {
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px'
    },
    supplementGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '8px',
      alignItems: 'end',
      marginBottom: '16px'
    },
    supplementItem: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr auto',
      gap: '8px',
      alignItems: 'center',
      padding: '12px',
      background: 'white',
      borderRadius: '8px',
      marginBottom: '8px',
      border: '1px solid #e5e7eb'
    },
    noImage: {
      width: '100%',
      height: '200px',
      background: '#f1f5f9',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748b',
      fontSize: '14px',
      marginBottom: '16px'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      fontSize: '18px',
      color: '#64748b'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b'
    },
    emptyStateIcon: {
      fontSize: '64px',
      color: '#cbd5e1',
      marginBottom: '16px'
    },
    '@media (max-width: 768px)': {
      container: {
        padding: '16px'
      },
      headerTitle: {
        fontSize: '24px'
      },
      itemsGrid: {
        gridTemplateColumns: '1fr'
      },
      controlsGrid: {
        gridTemplateColumns: '1fr'
      },
      buttonGroup: {
        flexDirection: 'column'
      },
      supplementItem: {
        gridTemplateColumns: '1fr',
        gap: '12px'
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const authRes = await api.get('/check-auth');
        if (!authRes.data?.id || authRes.data.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/login');
          return;
        }
        setUser(authRes.data);

        const [menuRes, catRes, supRes] = await Promise.all([
          api.get('/menu-items'),
          api.get('/categories'),
          api.get('/supplements'),
        ]);
        setMenuItems(menuRes.data || []);
        setFilteredItems(menuRes.data || []);
        setCategories(catRes.data || []);
        setSupplements(supRes.data || []);
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error(error.response?.data?.error || 'Failed to load data');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [navigate]);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = menuItems;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === parseInt(selectedCategory));
    }
    
    setFilteredItems(filtered);
  }, [menuItems, searchTerm, selectedCategory]);

  const handleEdit = async (item) => {
    try {
      const supRes = await api.get(`/menu-items/${item.id}/supplements`);
      const regularPriceValue = parseFloat(item.regular_price);
      const salePriceValue = item.sale_price !== null ? parseFloat(item.sale_price) : '';
      setEditingItem({
        id: parseInt(item.id) || 0,
        name: item.name || '',
        description: item.description || '',
        regular_price: isNaN(regularPriceValue) ? '' : regularPriceValue,
        sale_price: isNaN(salePriceValue) ? '' : salePriceValue,
        category_id: parseInt(item.category_id) || '',
        availability: !!item.availability,
        dietary_tags: safeParseDietaryTags(item.dietary_tags).join(', ') || '',
        image: null,
        image_url: item.image_url,
        assignedSupplements: supRes.data.map(sup => ({
          supplement_id: parseInt(sup.supplement_id) || 0,
          name: sup.name || '',
          additional_price: parseFloat(sup.additional_price) || 0,
        })),
      });
      setNewSupplementId('');
    } catch (error) {
      console.error('Error fetching supplements:', error);
      toast.error('Failed to load supplement data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue;
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'file') {
      newValue = files[0];
    } else if (type === 'number' && (name === 'regular_price' || name === 'sale_price')) {
      newValue = value === '' ? '' : parseFloat(value) || 0;
    } else {
      newValue = value;
    }
    setEditingItem(prev => (prev ? { ...prev, [name]: newValue } : null));
  };

  const handleSupplementChange = (supplementId, field, value) => {
    setEditingItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        assignedSupplements: prev.assignedSupplements.map(sup =>
          sup.supplement_id === supplementId
            ? { ...sup, [field]: field === 'additional_price' ? parseFloat(value) || 0 : value }
            : sup
        ),
      };
    });
  };

  const handleAddSupplement = () => {
    if (!newSupplementId) {
      toast.error('Please select a supplement');
      return;
    }
    const supplement = supplements.find(s => s.id === parseInt(newSupplementId));
    if (!supplement) {
      toast.error('Invalid supplement selected');
      return;
    }
    if (editingItem?.assignedSupplements.some(s => s.supplement_id === supplement.id)) {
      toast.warn('Supplement already assigned');
      return;
    }
    setEditingItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        assignedSupplements: [
          ...prev.assignedSupplements,
          {
            supplement_id: supplement.id,
            name: supplement.name,
            additional_price: parseFloat(supplement.price) || 0,
          },
        ],
      };
    });
    setNewSupplementId('');
  };

  const handleRemoveSupplement = async (supplementId) => {
    if (!user) {
      toast.error('You must be logged in to remove supplements');
      return;
    }
    if (!window.confirm('Remove this supplement from the menu item?')) return;
    try {
      setIsSubmitting(true);
      await api.deleteSupplementFromMenuItem(editingItem.id, supplementId, { user_id: user.id });
      setEditingItem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          assignedSupplements: prev.assignedSupplements.filter(
            sup => sup.supplement_id !== supplementId
          ),
        };
      });
      toast.success('Supplement removed');
    } catch (error) {
      console.error('Error removing supplement:', error);
      toast.error(error.response?.data?.error || 'Failed to remove supplement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      toast.error('Update in progress, please wait');
      return;
    }
    if (!user || !user.id) {
      toast.error('User not authenticated');
      return;
    }
    if (!editingItem) {
      toast.error('No item selected for editing');
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate inputs
      const itemId = parseInt(editingItem.id);
      const userId = parseInt(user.id);
      const name = editingItem.name?.trim();
      const regularPrice = parseFloat(editingItem.regular_price);
      const salePrice = editingItem.sale_price !== '' ? parseFloat(editingItem.sale_price) : null;
      const categoryId = parseInt(editingItem.category_id);
      const dietaryTags = editingItem.dietary_tags?.trim();
      const description = editingItem.description?.trim();
      const availability = editingItem.availability;

      if (!itemId || isNaN(itemId) || itemId <= 0) {
        throw new Error('Invalid menu item ID');
      }
      if (!userId || isNaN(userId) || userId <= 0) {
        throw new Error('Invalid user ID');
      }
      if (!name) {
        throw new Error('Name is required');
      }
      if (isNaN(regularPrice) || regularPrice <= 0) {
        throw new Error('Regular price must be a positive number');
      }
      if (salePrice !== null && (isNaN(salePrice) || salePrice < 0)) {
        throw new Error('Sale price must be a non-negative number');
      }
      if (!categoryId || isNaN(categoryId) || categoryId <= 0) {
        throw new Error('Category is required');
      }
      if (dietaryTags && !/^[a-zA-Z0-9\s,-]*$/.test(dietaryTags)) {
        throw new Error('Dietary tags must be a comma-separated list');
      }
      if (editingItem.image) {
        if (!['image/jpeg', 'image/png'].includes(editingItem.image.type)) {
          throw new Error('Image must be JPEG or PNG');
        }
        if (editingItem.image.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }
      }

      // Construct payload
      const payload = {
        user_id: userId,
        name,
        regular_price: regularPrice,
        sale_price: salePrice,
        category_id: categoryId,
        availability,
        description: description || '',
        dietary_tags: dietaryTags ? dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        image: editingItem.image,
      };

      console.log('Update payload:', payload);

      const formData = createFormData(payload);

      // Log FormData for debugging
      console.log('FormData entries before sending:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
      }

      // Update menu item
      await api.updateMenuItem(itemId, formData);

      // Update or add supplements
      const existingSups = (await api.getSupplementsByMenuItem(itemId)).data;
      for (const sup of editingItem.assignedSupplements) {
        const additionalPrice = parseFloat(sup.additional_price);
        if (isNaN(additionalPrice) || additionalPrice < 0) {
          throw new Error(`Invalid additional price for supplement ${sup.name}`);
        }
        if (!sup.supplement_id || !sup.name) {
          throw new Error(`Invalid supplement data for ${sup.name || 'unknown'}`);
        }
        const supPayload = {
          user_id: userId,
          name: sup.name.trim(),
          additional_price: additionalPrice,
          supplement_id: parseInt(sup.supplement_id),
        };
        const isAssigned = existingSups.some(s => s.supplement_id === sup.supplement_id);
        if (!isAssigned) {
          await api.addSupplementToMenuItem(itemId, supPayload);
        } else {
          await api.updateSupplementForMenuItem(itemId, sup.supplement_id, supPayload);
        }
      }

      toast.success('Menu item updated successfully');
      setEditingItem(null);
      setNewSupplementId('');
      const res = await api.get('/menu-items');
      setMenuItems(res.data || []);
    } catch (error) {
      console.error('Update error:', error);
      const serverErrors = error.response?.data?.errors;
      if (serverErrors?.length) {
        serverErrors.forEach(err => toast.error(`Validation error: ${err.msg} (${err.path})`));
      } else {
        toast.error(error.message || 'Failed to update menu item');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      toast.error('You must be logged in to delete menu items');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      setIsSubmitting(true);
      await api.deleteMenuItem(id, { user_id: user.id });
      toast.success('Menu item deleted');
      const res = await api.get('/menu-items');
      setMenuItems(res.data || []);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setNewSupplementId('');
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <Restaurant style={{ fontSize: '48px', marginRight: '16px' }} />
          Loading menu items...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          <Restaurant />
          Manage Menu Items
        </h1>
        <p style={styles.headerSubtitle}>
          Edit, update, and manage your restaurant's menu items
        </p>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/admin')}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          <ArrowBack />
          Back to Dashboard
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={styles.controlsSection}>
        <div style={styles.controlsGrid}>
          <div style={styles.searchContainer}>
            <Search style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.filterSelect}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <div style={styles.emptyState}>
          <Restaurant style={styles.emptyStateIcon} />
          <h3>No menu items found</h3>
          <p>Try adjusting your search criteria or add new menu items.</p>
        </div>
      ) : (
        <div style={styles.itemsGrid}>
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              style={editingItem && editingItem.id === item.id ? styles.itemCardEditing : styles.itemCard}
              onMouseEnter={(e) => {
                if (!(editingItem && editingItem.id === item.id)) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(editingItem && editingItem.id === item.id)) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {editingItem && editingItem.id === item.id ? (
                <form onSubmit={handleUpdate}>
                  <div style={styles.formSection}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Item Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={editingItem.name || ''}
                        onChange={handleInputChange}
                        placeholder="Enter item name"
                        required
                        style={styles.formInput}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Description</label>
                      <textarea
                        name="description"
                        value={editingItem.description || ''}
                        onChange={handleInputChange}
                        placeholder="Enter item description"
                        style={styles.formTextarea}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Regular Price *</label>
                      <input
                        type="number"
                        name="regular_price"
                        step="0.01"
                        min="0.01"
                        value={editingItem.regular_price || ''}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                        style={styles.formInput}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Sale Price (Optional)</label>
                      <input
                        type="number"
                        name="sale_price"
                        step="0.01"
                        min="0"
                        value={editingItem.sale_price || ''}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        style={styles.formInput}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Category *</label>
                      <select
                        name="category_id"
                        value={editingItem.category_id || ''}
                        onChange={handleInputChange}
                        required
                        style={styles.formSelect}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Image Upload</label>
                      <input
                        type="file"
                        name="image"
                        accept="image/jpeg,image/png"
                        onChange={handleInputChange}
                        style={styles.formInput}
                      />
                      {editingItem.image_url && (
                        <img
                          src={`${API_BASE_URL}${editingItem.image_url}`}
                          alt={editingItem.name}
                          style={styles.itemImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      )}
                      <div style={{ ...styles.noImage, display: editingItem.image_url ? 'none' : 'flex' }}>
                        No Image Available
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <div style={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          name="availability"
                          checked={editingItem.availability}
                          onChange={handleInputChange}
                          style={styles.checkbox}
                        />
                        <label style={styles.formLabel}>Available</label>
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Dietary Tags</label>
                      <input
                        type="text"
                        name="dietary_tags"
                        value={editingItem.dietary_tags || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., vegan, gluten-free"
                        style={styles.formInput}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div style={styles.supplementSection}>
                      <label style={styles.formLabel}>Supplements</label>
                      <div style={styles.supplementGrid}>
                        <select
                          value={newSupplementId}
                          onChange={(e) => setNewSupplementId(e.target.value)}
                          style={styles.formSelect}
                          onFocus={(e) => e.target.style.borderColor = '#667eea'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        >
                          <option value="">Select Supplement</option>
                          {supplements
                            .filter(
                              s =>
                                !editingItem.assignedSupplements.some(
                                  as => as.supplement_id === s.id
                                )
                            )
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddSupplement}
                          style={styles.primaryButton}
                          disabled={isSubmitting}
                          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          <AddCircleOutline fontSize="small" />
                          Add Supplement
                        </button>
                      </div>
                      {editingItem.assignedSupplements.map(sup => (
                        <div key={sup.supplement_id} style={styles.supplementItem}>
                          <select
                            value={sup.supplement_id}
                            onChange={(e) =>
                              handleSupplementChange(
                                sup.supplement_id,
                                'supplement_id',
                                parseInt(e.target.value)
                              )
                            }
                            style={styles.formSelect}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          >
                            {supplements
                              .filter(
                                s =>
                                  !editingItem.assignedSupplements.some(
                                    as =>
                                      as.supplement_id === s.id &&
                                      as.supplement_id !== sup.supplement_id
                                  )
                              )
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={sup.additional_price || ''}
                            onChange={(e) =>
                              handleSupplementChange(
                                sup.supplement_id,
                                'additional_price',
                                e.target.value
                              )
                            }
                            placeholder="Additional Price"
                            style={styles.formInput}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplement(sup.supplement_id)}
                            style={styles.dangerButton}
                            disabled={isSubmitting}
                            onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.target.style.background = '#fee2e2'}
                          >
                            <Close fontSize="small" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.buttonGroup}>
                    <button
                      type="submit"
                      style={styles.primaryButton}
                      disabled={isSubmitting}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <Save fontSize="small" />
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      style={styles.secondaryButton}
                      disabled={isSubmitting}
                      onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                      onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                    >
                      <Cancel fontSize="small" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {item.image_url ? (
                    <img
                      src={`${API_BASE_URL}${item.image_url}`}
                      alt={item.name}
                      style={styles.itemImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ ...styles.noImage, display: item.image_url ? 'none' : 'flex' }}>
                    No Image Available
                  </div>
                  <h3 style={styles.itemTitle}>{item.name}</h3>
                  <div style={styles.priceContainer}>
                    {item.sale_price !== null && (
                      <span style={styles.regularPrice}>
                        ${isNaN(parseFloat(item.regular_price)) ? 'N/A' : parseFloat(item.regular_price).toFixed(2)}
                      </span>
                    )}
                    <span style={styles.salePrice}>
                      ${isNaN(parseFloat(item.sale_price ?? item.regular_price)) ? 'N/A' : parseFloat(item.sale_price ?? item.regular_price).toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.itemMeta}>
                    <span style={{ ...styles.badge, ...styles.categoryBadge }}>
                      <Category fontSize="small" style={{ marginRight: '4px' }} />
                      {item.category_name || 'N/A'}
                    </span>
                    <span style={{ ...styles.badge, ...(item.availability ? styles.availableBadge : styles.unavailableBadge) }}>
                      {item.availability ? <Visibility fontSize="small" style={{ marginRight: '4px' }} /> : <VisibilityOff fontSize="small" style={{ marginRight: '4px' }} />}
                      {item.availability ? 'Available' : 'Unavailable'}
                    </span>
                    {safeParseDietaryTags(item.dietary_tags).map((tag, index) => (
                      <span key={index} style={{ ...styles.badge, ...styles.dietaryTag }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p style={styles.itemDescription}>{item.description || 'No description available'}</p>
                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.primaryButton}
                      onClick={() => handleEdit(item)}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <Edit fontSize="small" />
                      Edit
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={() => handleDelete(item.id)}
                      disabled={isSubmitting}
                      onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                      onMouseLeave={(e) => e.target.style.background = '#fee2e2'}
                    >
                      <DeleteOutline fontSize="small" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageMenuItems;