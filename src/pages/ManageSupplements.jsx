import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import {
  AddCircleOutline,
  DeleteOutline,
  RestaurantMenu,
  AttachMoney,
  Close,
  Edit,
  Assignment,
  MenuBook
} from '@mui/icons-material';

function ManageSupplements() {
  const [supplements, setSupplements] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementPrice, setNewSupplementPrice] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [additionalPrice, setAdditionalPrice] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [supplementsResponse, menuItemsResponse, userResponse] = await Promise.all([
          api.get('/supplements'),
          api.get('/menu-items'),
          api.get('/check-auth')
        ]);
        setSupplements(supplementsResponse.data || []);
        setMenuItems(menuItemsResponse.data || []);
        setUser(userResponse.data || null);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSupplement = async (e) => {
    e.preventDefault();
    if (!newSupplementName.trim() || !newSupplementPrice || isNaN(newSupplementPrice) || parseFloat(newSupplementPrice) < 0) {
      toast.error('Please provide a valid supplement name and price');
      return;
    }
    try {
      const response = await api.post('/supplements', {
        name: newSupplementName,
        price: parseFloat(newSupplementPrice)
      });
      setSupplements([...supplements, response.data]);
      setNewSupplementName('');
      setNewSupplementPrice('');
      setIsAddFormOpen(false);
      toast.success('Supplement added successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add supplement');
    }
  };

  const handleDeleteSupplement = async (supplementId) => {
    if (!user) {
      toast.error('You must be logged in to delete supplements');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this supplement?')) return;
    try {
      await api.delete(`/supplements/${supplementId}`, {
        data: { user_id: user.id }
      });
      setSupplements(supplements.filter(s => s.id !== supplementId));
      toast.success('Supplement deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete supplement');
    }
  };

  const handleAssignSupplement = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to assign supplements');
      return;
    }
    if (!selectedMenuItem || !additionalPrice || isNaN(additionalPrice) || parseFloat(additionalPrice) < 0) {
      toast.error('Please select a menu item and provide a valid additional price');
      return;
    }
    try {
      const selectedSupplement = supplements.find(s => s.id === parseInt(selectedMenuItem.split('-')[1]));
      const menuItemId = parseInt(selectedMenuItem.split('-')[0]);
      await api.post(`/menu-items/${menuItemId}/supplements`, {
        supplement_id: selectedSupplement.id,
        name: selectedSupplement.name,
        additional_price: parseFloat(additionalPrice),
        user_id: user.id
      });
      const updatedSupplements = await api.get('/supplements');
      setSupplements(updatedSupplements.data || []);
      setSelectedMenuItem('');
      setAdditionalPrice('');
      setIsAssignFormOpen(false);
      toast.success('Supplement assigned successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign supplement');
    }
  };

  const handleRemoveAssignment = async (menuItemId, supplementId) => {
    if (!user) {
      toast.error('You must be logged in to remove supplement assignments');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this supplement assignment?')) return;
    try {
      await api.delete(`/menu-items/${menuItemId}/supplements/${supplementId}`, {
        data: { user_id: user.id }
      });
      const updatedSupplements = await api.get('/supplements');
      setSupplements(updatedSupplements.data || []);
      toast.success('Supplement assignment removed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove supplement assignment');
    }
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    titleSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0,
      '@media (max-width: 768px)': {
        fontSize: '24px'
      }
    },
    titleIcon: {
      fontSize: '36px',
      color: '#6366f1',
      '@media (max-width: 768px)': {
        fontSize: '28px'
      }
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      whiteSpace: 'nowrap',
      ':hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 6px 8px -1px rgba(0, 0, 0, 0.15)'
      }
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    },
    formContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    },
    formTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
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
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      color: '#1f2937',
      backgroundColor: '#ffffff',
      transition: 'all 0.2s ease',
      ':focus': {
        outline: 'none',
        borderColor: '#6366f1',
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
      }
    },
    select: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      color: '#1f2937',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
      transition: 'all 0.2s ease'
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '8px',
      flexWrap: 'wrap'
    },
    secondaryButton: {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #cbd5e1',
      padding: '12px 20px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    tableContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      padding: '20px 24px',
      borderBottom: '1px solid #e2e8f0'
    },
    tableHeaderTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '16px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0'
    },
    td: {
      padding: '16px 24px',
      fontSize: '14px',
      color: '#1f2937',
      borderBottom: '1px solid #f1f5f9',
      verticalAlign: 'top'
    },
    supplementName: {
      fontWeight: '500',
      color: '#1e293b'
    },
    price: {
      fontWeight: '600',
      color: '#059669',
      fontSize: '15px'
    },
    assignmentList: {
      margin: 0,
      padding: 0,
      listStyle: 'none'
    },
    assignmentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '8px',
      fontSize: '13px',
      gap: '8px'
    },
    assignmentText: {
      flex: 1,
      color: '#475569'
    },
    removeButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#dc2626'
      }
    },
    deleteButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#dc2626'
      }
    },
    loading: {
      textAlign: 'center',
      padding: '48px 24px',
      color: '#6b7280',
      fontSize: '16px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
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
      color: '#9ca3af'
    },
    // Mobile responsive styles
    '@media (max-width: 768px)': {
      container: {
        padding: '16px'
      },
      header: {
        flexDirection: 'column',
        alignItems: 'stretch'
      },
      buttonGroup: {
        width: '100%',
        justifyContent: 'stretch'
      },
      primaryButton: {
        flex: 1,
        justifyContent: 'center'
      },
      formContainer: {
        padding: '20px'
      },
      tableContainer: {
        overflowX: 'auto'
      },
      th: {
        padding: '12px 16px',
        fontSize: '11px'
      },
      td: {
        padding: '12px 16px',
        fontSize: '13px'
      },
      assignmentItem: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '8px'
      }
    }
  };

  // Apply responsive styles
  const applyResponsiveStyles = (baseStyles) => {
    if (window.innerWidth <= 768) {
      return { ...baseStyles, ...styles['@media (max-width: 768px)'] };
    }
    return baseStyles;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <MenuBook style={styles.titleIcon} />
          <h1 style={styles.title}>Supplement Management</h1>
        </div>
        <div style={styles.buttonGroup}>
          <button 
            style={styles.primaryButton} 
            onClick={() => setIsAddFormOpen(true)}
          >
            <AddCircleOutline fontSize="small" />
            Add Supplement
          </button>
          <button 
            style={styles.primaryButton} 
            onClick={() => setIsAssignFormOpen(true)}
          >
            <Assignment fontSize="small" />
            Assign to Menu
          </button>
        </div>
      </div>

      {isAddFormOpen && (
        <div style={styles.formContainer}>
          <h3 style={styles.formTitle}>
            <AddCircleOutline fontSize="small" />
            Add New Supplement
          </h3>
          <form style={styles.form} onSubmit={handleAddSupplement}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Supplement Name</label>
              <input
                type="text"
                placeholder="Enter supplement name..."
                value={newSupplementName}
                onChange={(e) => setNewSupplementName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Base Price ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={newSupplementPrice}
                onChange={(e) => setNewSupplementPrice(e.target.value)}
                style={styles.input}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>
                <AddCircleOutline fontSize="small" />
                Add Supplement
              </button>
              <button 
                type="button" 
                style={styles.secondaryButton} 
                onClick={() => setIsAddFormOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isAssignFormOpen && (
        <div style={styles.formContainer}>
          <h3 style={styles.formTitle}>
            <Assignment fontSize="small" />
            Assign Supplement to Menu Item
          </h3>
          <form style={styles.form} onSubmit={handleAssignSupplement}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Menu Item & Supplement</label>
              <select
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">Select menu item and supplement...</option>
                {menuItems.map(item => 
                  supplements.map(supplement => (
                    <option key={`${item.id}-${supplement.id}`} value={`${item.id}-${supplement.id}`}>
                      {item.name} → {supplement.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Additional Price ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={additionalPrice}
                onChange={(e) => setAdditionalPrice(e.target.value)}
                style={styles.input}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>
                <Assignment fontSize="small" />
                Assign Supplement
              </button>
              <button 
                type="button" 
                style={styles.secondaryButton} 
                onClick={() => setIsAssignFormOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h2 style={styles.tableHeaderTitle}>
            <RestaurantMenu fontSize="small" />
            Supplements Overview
          </h2>
        </div>
        
        {isLoading ? (
          <div style={styles.loading}>
            Loading supplements...
          </div>
        ) : supplements.length === 0 ? (
          <div style={styles.emptyState}>
            <RestaurantMenu style={styles.emptyStateIcon} />
            <div style={styles.emptyStateText}>No supplements available</div>
            <div style={styles.emptyStateSubtext}>
              Create your first supplement to get started
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Supplement</th>
                  <th style={styles.th}>Base Price</th>
                  <th style={styles.th}>Menu Assignments</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supplements.map(supplement => (
                  <tr key={supplement.id}>
                    <td style={styles.td}>
                      <div style={styles.supplementName}>{supplement.name}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.price}>
                        ${parseFloat(supplement.price).toFixed(2)}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {supplement.menu_items && supplement.menu_items.length > 0 ? (
                        <ul style={styles.assignmentList}>
                          {supplement.menu_items.map(item => (
                            <li key={item.menu_item_id} style={styles.assignmentItem}>
                              <span style={styles.assignmentText}>
                                {item.name} <strong>(+${parseFloat(item.additional_price).toFixed(2)})</strong>
                              </span>
                              <button
                                style={styles.removeButton}
                                onClick={() => handleRemoveAssignment(item.menu_item_id, supplement.id)}
                                title="Remove Assignment"
                              >
                                <Close fontSize="small" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                          No assignments
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDeleteSupplement(supplement.id)}
                        title="Delete Supplement"
                      >
                        <DeleteOutline fontSize="small" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageSupplements;