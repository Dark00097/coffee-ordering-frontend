import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import ImageIcon from '@mui/icons-material/Image';
import StarIcon from '@mui/icons-material/Star';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null, is_top: false });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    innerContainer: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      textDecoration: 'none'
    },
    buttonSecondary: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease'
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease'
    },
    buttonSuccess: {
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease'
    },
    formCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },
    formTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s ease',
      backgroundColor: 'white',
      outline: 'none'
    },
    textarea: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s ease',
      backgroundColor: 'white',
      outline: 'none'
    },
    fileInput: {
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '8px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      position: 'relative'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
      wordBreak: 'break-word'
    },
    cardDescription: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.5',
      marginBottom: '16px',
      wordBreak: 'break-word'
    },
    cardImage: {
      width: '100%',
      maxHeight: '150px',
      objectFit: 'cover',
      borderRadius: '8px',
      marginBottom: '16px'
    },
    cardActions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end'
    },
    topBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: '#fef3c7',
      color: '#b45309',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      fontSize: '16px',
      color: '#6b7280'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6b7280'
    },
    emptyStateIcon: {
      fontSize: '48px',
      color: '#d1d5db',
      marginBottom: '16px'
    },
    emptyStateText: {
      fontSize: '16px',
      marginBottom: '8px'
    },
    emptyStateSubtext: {
      fontSize: '14px',
      opacity: '0.8'
    }
  };

  // Media queries for mobile responsiveness
  const mobileStyles = `
    @media (max-width: 768px) {
      .categories-container {
        padding: 12px !important;
      }
      .categories-header {
        flex-direction: column !important;
        align-items: stretch !important;
        text-align: center;
      }
      .categories-header-title {
        font-size: 24px !important;
        justify-content: center;
      }
      .categories-header-actions {
        justify-content: center;
      }
      .categories-grid {
        grid-template-columns: 1fr !important;
      }
      .categories-form-actions {
        flex-direction: column !important;
      }
      .categories-card-actions {
        flex-direction: column !important;
      }
      .categories-button {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/check-auth');
        if (res.data.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/login');
        } else {
          setUser(res.data);
        }
      } catch (err) {
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
        toast.error(error.response?.data?.error || 'Failed to fetch categories');
      }
    };

    checkAuth();
    fetchCategories();
  }, [navigate]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('name', newCategory.name.trim());
      if (newCategory.description.trim()) {
        formData.append('description', newCategory.description.trim());
      }
      if (newCategory.image) {
        formData.append('image', newCategory.image);
      }
      formData.append('is_top', newCategory.is_top);
      await api.post('/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Category added successfully');
      setNewCategory({ name: '', description: '', image: null, is_top: false });
      setShowAddForm(false);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add category');
    }
  };

  const handleEditCategory = async (e, id) => {
    e.preventDefault();
    if (!editingCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('name', editingCategory.name.trim());
      if (editingCategory.description.trim()) {
        formData.append('description', editingCategory.description.trim());
      }
      if (editingCategory.image instanceof File) {
        formData.append('image', editingCategory.image);
      }
      formData.append('is_top', editingCategory.is_top);
      await api.put(`/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Category updated successfully');
      setEditingCategory(null);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    try {
      await api.delete(`/categories/${id}`, { data: { user_id: user.id } });
      toast.success('Category deleted successfully');
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    }
  };

  if (isLoading || !user) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style>{mobileStyles}</style>
      <div style={styles.container} className="categories-container">
        <div style={styles.innerContainer}>
          {/* Header */}
          <div style={styles.header} className="categories-header">
            <h1 style={styles.headerTitle} className="categories-header-title">
              <CategoryIcon sx={{ fontSize: '32px' }} />
              Category Management
            </h1>
            <div style={styles.headerActions} className="categories-header-actions">
              <button
                style={styles.button}
                className="categories-button"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <AddIcon sx={{ fontSize: '18px' }} />
                Add Category
              </button>
              <button
                style={styles.buttonSecondary}
                className="categories-button"
                onClick={() => navigate('/admin')}
              >
                <ArrowBackIcon sx={{ fontSize: '18px' }} />
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Add Category Form */}
          {showAddForm && (
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>
                <AddIcon sx={{ fontSize: '24px' }} />
                Add New Category
              </h2>
              <form onSubmit={handleAddCategory} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Category Name *</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Enter category description (optional)"
                    style={styles.textarea}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setNewCategory({ ...newCategory, image: e.target.files[0] })}
                    style={styles.fileInput}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mark as Top Category</label>
                  <div style={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={newCategory.is_top}
                      onChange={(e) => setNewCategory({ ...newCategory, is_top: e.target.checked })}
                      style={styles.checkbox}
                    />
                    <span>Feature this category on the homepage</span>
                  </div>
                </div>
                <div style={styles.formActions} className="categories-form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategory({ name: '', description: '', image: null, is_top: false });
                    }}
                    style={styles.buttonSecondary}
                    className="categories-button"
                  >
                    <CancelIcon sx={{ fontSize: '16px' }} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={styles.buttonSuccess}
                    className="categories-button"
                  >
                    <SaveIcon sx={{ fontSize: '16px' }} />
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Grid */}
          {categories.length === 0 ? (
            <div style={styles.emptyState}>
              <CategoryIcon sx={styles.emptyStateIcon} />
              <div style={styles.emptyStateText}>No categories found</div>
              <div style={styles.emptyStateSubtext}>Create your first category to get started</div>
            </div>
          ) : (
            <div style={styles.grid} className="categories-grid">
              {categories.map(category => (
                <div key={category.id} style={styles.card}>
                  {editingCategory?.id === category.id ? (
                    <form onSubmit={(e) => handleEditCategory(e, category.id)} style={styles.form}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Category Name *</label>
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          placeholder="Enter category name"
                          required
                          style={styles.input}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea
                          value={editingCategory.description}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          placeholder="Enter category description"
                          style={styles.textarea}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Image</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.files[0] })}
                          style={styles.fileInput}
                        />
                        {category.image_url && !(editingCategory.image instanceof File) && (
                          <img 
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${category.image_url}`} 
                            alt="Current" 
                            style={{ ...styles.cardImage, maxHeight: '100px', marginTop: '8px' }} 
                          />
                        )}
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Mark as Top Category</label>
                        <div style={styles.checkboxContainer}>
                          <input
                            type="checkbox"
                            checked={editingCategory.is_top}
                            onChange={(e) => setEditingCategory({ ...editingCategory, is_top: e.target.checked })}
                            style={styles.checkbox}
                          />
                          <span>Feature this category on the homepage</span>
                        </div>
                      </div>
                      <div style={styles.formActions} className="categories-form-actions">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          style={styles.buttonSecondary}
                          className="categories-button"
                        >
                          <CancelIcon sx={{ fontSize: '16px' }} />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={styles.buttonSuccess}
                          className="categories-button"
                        >
                          <SaveIcon sx={{ fontSize: '16px' }} />
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {category.is_top && (
                        <div style={styles.topBadge}>
                          <StarIcon sx={{ fontSize: '14px' }} />
                          Top Category
                        </div>
                      )}
                      <h3 style={styles.cardTitle}>{category.name}</h3>
                      {category.description && (
                        <p style={styles.cardDescription}>{category.description}</p>
                      )}
                      {category.image_url && (
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${category.image_url}`} 
                          alt={category.name} 
                          style={styles.cardImage}
                        />
                      )}
                      <div style={styles.cardActions} className="categories-card-actions">
                        <button
                          onClick={() => setEditingCategory({ 
                            id: category.id, 
                            name: category.name, 
                            description: category.description || '', 
                            image: null, 
                            image_url: category.image_url,
                            is_top: category.is_top
                          })}
                          style={styles.button}
                          className="categories-button"
                        >
                          <EditIcon sx={{ fontSize: '16px' }} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          style={styles.buttonDanger}
                          className="categories-button"
                        >
                          <DeleteIcon sx={{ fontSize: '16px' }} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Categories;