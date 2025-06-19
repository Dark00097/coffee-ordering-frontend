import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import {
  AddCircleOutline,
  DeleteOutline,
  Edit,
  Save,
  Cancel,
  ArrowBack,
  Restaurant,
  Coffee,
  Visibility,
  VisibilityOff,
  Category as CategoryIcon
} from '@mui/icons-material';

function AdminBreakfasts() {
  const [breakfasts, setBreakfasts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBreakfast, setEditingBreakfast] = useState(null);
  const [newOption, setNewOption] = useState({ group_id: '', option_type: '', option_name: '', additional_price: '' });
  const [newOptionGroup, setNewOptionGroup] = useState({ title: '' });
  const [editingOptionGroup, setEditingOptionGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.13:5000';

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
    itemDescription: {
      color: '#64748b',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '20px'
    },
    optionsList: {
      marginBottom: '16px',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    optionItemDisplay: {
      fontSize: '14px',
      color: '#1e293b',
      marginBottom: '8px'
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
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
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
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box',
      backgroundColor: '#fff'
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
    optionSection: {
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px'
    },
    optionGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr auto',
      gap: '8px',
      alignItems: 'end',
      marginBottom: '16px'
    },
    optionItem: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr auto',
      gap: '8px',
      alignItems: 'center',
      padding: '12px',
      background: 'white',
      borderRadius: '8px',
      marginBottom: '8px',
      border: '1px solid #e2e8f0'
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
        setUserId(authRes.data.id);
        const [breakfastRes, categoriesRes] = await Promise.all([
          api.getBreakfasts(),
          api.get('/categories')
        ]);
        const breakfastsWithDetails = await Promise.all(
          breakfastRes.data.map(async (breakfast) => {
            const [optionsRes, groupsRes] = await Promise.all([
              api.getBreakfastOptions(breakfast.id),
              api.getBreakfastOptionGroups(breakfast.id)
            ]);
            return {
              ...breakfast,
              options: (optionsRes.data || []).map(opt => ({
                ...opt,
                additional_price: parseFloat(opt.additional_price) || 0
              })),
              optionGroups: groupsRes.data || []
            };
          })
        );
        setBreakfasts(breakfastsWithDetails || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        toast.error('Failed to load data');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [navigate]);

  const handleEdit = (breakfast) => {
    setEditingBreakfast({
      id: breakfast.id,
      name: breakfast.name || '',
      description: breakfast.description || '',
      price: parseFloat(breakfast.price) || '',
      availability: !!breakfast.availability,
      image: null,
      image_url: breakfast.image_url,
      category_id: breakfast.category_id || '',
      options: breakfast.options.map(opt => ({
        ...opt,
        additional_price: parseFloat(opt.additional_price) || 0
      })),
      optionGroups: breakfast.optionGroups || []
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setEditingBreakfast(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : 
              type === 'number' ? (value === '' ? '' : parseFloat(value)) : 
              name === 'category_id' ? (value === '' ? '' : parseInt(value)) : 
              value
    }));
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setNewOption(prev => ({
      ...prev,
      [name]: name === 'additional_price' ? (value === '' ? '' : parseFloat(value)) : 
              name === 'group_id' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };

  const handleOptionGroupChange = (e) => {
    const { value } = e.target;
    setNewOptionGroup({ title: value });
  };

  const handleEditOptionGroupChange = (e) => {
    const { value } = e.target;
    setEditingOptionGroup(prev => ({ ...prev, title: value }));
  };

  const handleAddOptionGroup = async () => {
    if (!newOptionGroup.title.trim()) {
      toast.error('Option group title is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.addBreakfastOptionGroup(editingBreakfast.id, {
        user_id: userId,
        title: newOptionGroup.title
      });
      toast.success('Option group added');
      setNewOptionGroup({ title: '' });
      const groupsRes = await api.getBreakfastOptionGroups(editingBreakfast.id);
      setEditingBreakfast(prev => ({
        ...prev,
        optionGroups: groupsRes.data || []
      }));
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add option group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOptionGroup = (group) => {
    setEditingOptionGroup(group);
  };

  const handleUpdateOptionGroup = async (groupId) => {
    if (!editingOptionGroup.title.trim()) {
      toast.error('Option group title is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.updateBreakfastOptionGroup(editingBreakfast.id, groupId, {
        user_id: userId,
        title: editingOptionGroup.title
      });
      toast.success('Option group updated');
      setEditingOptionGroup(null);
      const groupsRes = await api.getBreakfastOptionGroups(editingBreakfast.id);
      setEditingBreakfast(prev => ({
        ...prev,
        optionGroups: groupsRes.data || []
      }));
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update option group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOptionGroup = async (groupId) => {
    if (!window.confirm('Remove this option group? This will also remove associated options.')) return;
    try {
      setIsSubmitting(true);
      await api.deleteBreakfastOptionGroup(editingBreakfast.id, groupId, { user_id: userId });
      toast.success('Option group removed');
      const [groupsRes, optionsRes] = await Promise.all([
        api.getBreakfastOptionGroups(editingBreakfast.id),
        api.getBreakfastOptions(editingBreakfast.id)
      ]);
      setEditingBreakfast(prev => ({
        ...prev,
        optionGroups: groupsRes.data || [],
        options: (optionsRes.data || []).map(opt => ({
          ...opt,
          additional_price: parseFloat(opt.additional_price) || 0
        }))
      }));
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove option group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOption.group_id || !newOption.option_type || !newOption.option_name || newOption.additional_price === '') {
      toast.error('All option fields, including option group, are required');
      return;
    }
    if (!editingBreakfast.optionGroups.length) {
      toast.error('Create at least one option group first');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.addBreakfastOption(editingBreakfast.id, {
        user_id: userId,
        group_id: newOption.group_id,
        option_type: newOption.option_type,
        option_name: newOption.option_name,
        additional_price: newOption.additional_price
      });
      toast.success('Option added');
      setNewOption({ group_id: '', option_type: '', option_name: '', additional_price: '' });
      const optionsRes = await api.getBreakfastOptions(editingBreakfast.id);
      setEditingBreakfast(prev => ({
        ...prev,
        options: (optionsRes.data || []).map(opt => ({
          ...opt,
          additional_price: parseFloat(opt.additional_price) || 0
        }))
      }));
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOption = async (optionId) => {
    if (!window.confirm('Remove this option?')) return;
    try {
      setIsSubmitting(true);
      await api.deleteBreakfastOption(editingBreakfast.id, optionId, { user_id: userId });
      toast.success('Option removed');
      const optionsRes = await api.getBreakfastOptions(editingBreakfast.id);
      setEditingBreakfast(prev => ({
        ...prev,
        options: (optionsRes.data || []).map(opt => ({
          ...opt,
          additional_price: parseFloat(opt.additional_price) || 0
        }))
      }));
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!editingBreakfast.name || !editingBreakfast.price) {
      toast.error('Name and price are required');
      return;
    }
    if (editingBreakfast.category_id && isNaN(parseInt(editingBreakfast.category_id))) {
      toast.error('Invalid category selected');
      return;
    }
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('name', editingBreakfast.name);
      formData.append('description', editingBreakfast.description || '');
      formData.append('price', editingBreakfast.price);
      formData.append('availability', editingBreakfast.availability);
      formData.append('category_id', editingBreakfast.category_id || '');
      if (editingBreakfast.image) formData.append('image', editingBreakfast.image);
      if (editingBreakfast.id) {
        await api.updateBreakfast(editingBreakfast.id, formData);
        toast.success('Breakfast updated');
      } else {
        await api.addBreakfast(formData);
        toast.success('Breakfast added');
      }
      setEditingBreakfast(null);
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save breakfast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this breakfast?')) return;
    try {
      setIsSubmitting(true);
      await api.deleteBreakfast(id, { user_id: userId });
      toast.success('Breakfast deleted');
      const breakfastRes = await api.getBreakfasts();
      const breakfastsWithDetails = await Promise.all(
        breakfastRes.data.map(async (breakfast) => {
          const [optionsRes, groupsRes] = await Promise.all([
            api.getBreakfastOptions(breakfast.id),
            api.getBreakfastOptionGroups(breakfast.id)
          ]);
          return {
            ...breakfast,
            options: (optionsRes.data || []).map(opt => ({
              ...opt,
              additional_price: parseFloat(opt.additional_price) || 0
            })),
            optionGroups: groupsRes.data || []
          };
        })
      );
      setBreakfasts(breakfastsWithDetails || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete breakfast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingBreakfast(null);
    setNewOption({ group_id: '', option_type: '', option_name: '', additional_price: '' });
    setNewOptionGroup({ title: '' });
    setEditingOptionGroup(null);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <Restaurant style={{ fontSize: '48px', marginRight: '16px' }} />
          Loading breakfasts...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          <Coffee />
          Manage Breakfasts
        </h1>
        <p style={styles.headerSubtitle}>
          Create, update, and manage breakfast items, option groups, and their options
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

      <div style={styles.controlsSection}>
        <button
          style={styles.primaryButton}
          onClick={() => setEditingBreakfast({
            id: null,
            name: '',
            description: '',
            price: '',
            availability: true,
            image: null,
            image_url: null,
            category_id: '',
            options: [],
            optionGroups: []
          })}
        >
          <AddCircleOutline />
          Add New Breakfast
        </button>
      </div>

      {breakfasts.length === 0 && !editingBreakfast ? (
        <div style={styles.emptyState}>
          <Coffee style={styles.emptyStateIcon} />
          <h3>No breakfasts found</h3>
          <p>Add a new breakfast to get started.</p>
        </div>
      ) : (
        <div style={styles.itemsGrid}>
          {editingBreakfast && (
            <div style={styles.itemCardEditing}>
              <form onSubmit={handleUpdate}>
                <div style={styles.formSection}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Breakfast Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editingBreakfast.name || ''}
                      onChange={handleInputChange}
                      placeholder="Enter breakfast name"
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editingBreakfast.description || ''}
                      onChange={handleInputChange}
                      placeholder="Enter description"
                      style={styles.formTextarea}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Price *
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0.01"
                      value={editingBreakfast.price || ''}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      <CategoryIcon fontSize="small" />
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={editingBreakfast.category_id || ''}
                      onChange={handleInputChange}
                      style={styles.formSelect}
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
                    {editingBreakfast.image_url && (
                      <img
                        src={`${API_BASE_URL}${editingBreakfast.image_url}`}
                        alt={editingBreakfast.name}
                        style={styles.itemImage}
                      />
                    )}
                    <div style={{ ...styles.noImage, display: editingBreakfast.image_url ? 'none' : 'flex' }}>
                      No Image Available
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <div style={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        name="availability"
                        checked={editingBreakfast.availability}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      <label style={styles.formLabel}>Available</label>
                    </div>
                  </div>
                  {editingBreakfast.id && (
                    <>
                      <div style={styles.optionSection}>
                        <label style={styles.formLabel}>Option Groups</label>
                        <div style={{ ...styles.optionGrid, gridTemplateColumns: '2fr auto auto' }}>
                          <input
                            type="text"
                            value={newOptionGroup.title}
                            onChange={handleOptionGroupChange}
                            placeholder="Option Group Title (e.g., Beverage)"
                            style={styles.formInput}
                          />
                          <button
                            type="button"
                            onClick={handleAddOptionGroup}
                            style={styles.primaryButton}
                            disabled={isSubmitting}
                          >
                            <AddCircleOutline fontSize="small" />
                            Add Group
                          </button>
                        </div>
                        {editingBreakfast.optionGroups.map(group => (
                          <div key={group.id} style={styles.optionItem}>
                            {editingOptionGroup?.id === group.id ? (
                              <>
                                <input
                                  type="text"
                                  value={editingOptionGroup.title}
                                  onChange={handleEditOptionGroupChange}
                                  style={styles.formInput}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOptionGroup(group.id)}
                                  style={styles.primaryButton}
                                  disabled={isSubmitting}
                                >
                                  <Save fontSize="small" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOptionGroup(null)}
                                  style={styles.secondaryButton}
                                  disabled={isSubmitting}
                                >
                                  <Cancel fontSize="small" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span>{group.title}</span>
                                <button
                                  type="button"
                                  onClick={() => handleEditOptionGroup(group)}
                                  style={styles.secondaryButton}
                                  disabled={isSubmitting}
                                >
                                  <Edit fontSize="small" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionGroup(group.id)}
                                  style={styles.dangerButton}
                                  disabled={isSubmitting}
                                >
                                  <DeleteOutline fontSize="small" />
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={styles.optionSection}>
                        <label style={styles.formLabel}>Options</label>
                        <div style={styles.optionGrid}>
                          <select
                            name="group_id"
                            value={newOption.group_id || ''}
                            onChange={handleOptionChange}
                            style={styles.formSelect}
                          >
                            <option value="">Select Option Group</option>
                            {editingBreakfast.optionGroups.map(group => (
                              <option key={group.id} value={group.id}>{group.title}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            name="option_type"
                            value={newOption.option_type}
                            onChange={handleOptionChange}
                            placeholder="Option Type (e.g., Coffee)"
                            style={styles.formInput}
                          />
                          <input
                            type="text"
                            name="option_name"
                            value={newOption.option_name}
                            onChange={handleOptionChange}
                            placeholder="Option Name (e.g., Espresso)"
                            style={styles.formInput}
                          />
                          <input
                            type="number"
                            name="additional_price"
                            step="0.01"
                            min="0"
                            value={newOption.additional_price}
                            onChange={handleOptionChange}
                            placeholder="Additional Price"
                            style={styles.formInput}
                          />
                          <button
                            type="button"
                            onClick={handleAddOption}
                            style={styles.primaryButton}
                            disabled={isSubmitting}
                          >
                            <AddCircleOutline fontSize="small" />
                            Add Option
                          </button>
                        </div>
                        {editingBreakfast.options.map(opt => (
                          <div key={opt.id} style={styles.optionItem}>
                            <span>{opt.group_title}: {opt.option_type}: {opt.option_name}</span>
                            <span>${(parseFloat(opt.additional_price) || 0).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(opt.id)}
                              style={styles.dangerButton}
                              disabled={isSubmitting}
                            >
                              <DeleteOutline fontSize="small" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.buttonGroup}>
                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={isSubmitting}
                  >
                    <Save fontSize="small" />
                    {isSubmitting ? 'Saving...' : editingBreakfast.id ? 'Update Breakfast' : 'Add Breakfast'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={styles.secondaryButton}
                    disabled={isSubmitting}
                  >
                    <Cancel fontSize="small" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {breakfasts.map(breakfast => (
            <div key={breakfast.id} style={styles.itemCard}>
              {breakfast.image_url ? (
                <img
                  src={`${API_BASE_URL}${breakfast.image_url}`}
                  alt={breakfast.name}
                  style={styles.itemImage}
                />
              ) : (
                <div style={styles.noImage}>No Image Available</div>
              )}
              <h3 style={styles.itemTitle}>{breakfast.name}</h3>
              <div style={styles.priceContainer}>
                <span style={styles.salePrice}>${(parseFloat(breakfast.price) || 0).toFixed(2)}</span>
              </div>
              <div style={styles.itemMeta}>
                <span
                  style={{
                    ...styles.badge,
                    ...(breakfast.availability ? styles.availableBadge : styles.unavailableBadge)
                  }}
                >
                  {breakfast.availability ? 'Available' : 'Unavailable'}
                </span>
                {breakfast.category_id && categories.find(cat => cat.id === breakfast.category_id) && (
                  <span style={{ ...styles.badge, background: '#e0e7ff', color: '#3730a3' }}>
                    {categories.find(cat => cat.id === breakfast.category_id).name}
                  </span>
                )}
              </div>
              {breakfast.description && (
                <p style={styles.itemDescription}>{breakfast.description}</p>
              )}
              {breakfast.optionGroups.length > 0 && (
                <div style={styles.optionsList}>
                  <strong>Option Groups:</strong>
                  {breakfast.optionGroups.map(group => (
                    <div key={group.id} style={styles.optionItemDisplay}>
                      {group.title}
                    </div>
                  ))}
                </div>
              )}
              {breakfast.options.length > 0 && (
                <div style={styles.optionsList}>
                  <strong>Options:</strong>
                  {breakfast.options.map(opt => (
                    <div key={opt.id} style={styles.optionItemDisplay}>
                      {opt.group_title}: {opt.option_type}: {opt.option_name} (+${(parseFloat(opt.additional_price) || 0).toFixed(2)})
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.buttonGroup}>
                <button
                  style={styles.primaryButton}
                  onClick={() => handleEdit(breakfast)}
                >
                  <Edit fontSize="small" />
                  Edit
                </button>
                <button
                  style={styles.dangerButton}
                  onClick={() => handleDelete(breakfast.id)}
                  disabled={isSubmitting}
                >
                  <DeleteOutline fontSize="small" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminBreakfasts;