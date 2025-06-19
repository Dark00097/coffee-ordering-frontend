import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import {
  Add,
  Edit,
  Delete,
  TableRestaurant,
  People,
  Schedule,
  CheckCircle,
  Cancel,
  Close,
  Save,
  GridView,
  ViewList
} from '@mui/icons-material';

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTable, setNewTable] = useState({ table_number: '', capacity: '' });
  const [editTable, setEditTable] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1rem',
      margin: 0
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontWeight: '500',
      color: '#374151',
      fontSize: '0.9rem'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.95rem',
      transition: 'border-color 0.2s',
      outline: 'none',
      backgroundColor: '#fff',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.95rem',
      outline: 'none',
      backgroundColor: '#fff',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    buttonPrimary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '10px 16px',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      justifyContent: 'center'
    },
    buttonSecondary: {
      backgroundColor: '#f8fafc',
      color: '#475569',
      border: '1px solid #d1d5db',
      padding: '10px 16px',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      justifyContent: 'center'
    },
    buttonEdit: {
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    buttonDelete: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    tableGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px'
    },
    tableList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    tableCard: {
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '16px',
      transition: 'box-shadow 0.2s'
    },
    tableCardHover: {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    statusAvailable: {
      backgroundColor: '#dcfce7',
      color: '#16a34a'
    },
    statusOccupied: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
      flexWrap: 'wrap'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc',
      color: '#64748b',
      fontSize: '1rem',
      fontWeight: '500'
    },
    viewToggle: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    },
    addButton: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      color: '#64748b',
      transition: 'background-color 0.2s'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    '@media (max-width: 768px)': {
      tableGrid: {
        gridTemplateColumns: '1fr'
      },
      formRow: {
        gridTemplateColumns: '1fr'
      },
      title: {
        fontSize: '1.5rem'
      }
    }
  };

  useEffect(() => {
    let socketCleanup = () => {};

    const checkAuth = async () => {
      try {
        const res = await api.get('/check-auth');
        if (res.data.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/');
        } else {
          setUser(res.data);
          // Initialize Socket.IO after user is confirmed
          socketCleanup = initSocket({
            onTableStatusUpdate: (data) => {
              setTables((prevTables) =>
                prevTables.map((table) =>
                  table.id === data.table_id ? { ...table, status: data.status } : table
                )
              );
              toast.info(`Table ${data.table_id} status updated to ${data.status}`);
            }
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        toast.error(err.response?.data?.error || 'Please log in');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        const res = await api.getTables();
        setTables(res.data || []);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error(error.response?.data?.error || 'Failed to fetch tables');
      }
    };

    checkAuth();
    fetchData();

    return () => {
      socketCleanup();
    };
  }, [navigate]);

  const addTable = async (e) => {
    e.preventDefault();
    try {
      if (!user || user.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/login');
        return;
      }
      if (!newTable.table_number.trim() || !newTable.capacity) {
        toast.error('Table number and capacity are required');
        return;
      }
      const capacity = parseInt(newTable.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        toast.error('Capacity must be a positive number');
        return;
      }
      await api.addTable({ user_id: user.id, ...newTable });
      toast.success('Table added successfully');
      setNewTable({ table_number: '', capacity: '' });
      setShowAddForm(false);
      const res = await api.getTables();
      setTables(res.data || []);
    } catch (error) {
      console.error('Error adding table:', error);
      toast.error(error.response?.data?.error || 'Failed to add table');
    }
  };

  const updateTable = async (e) => {
    e.preventDefault();
    try {
      if (!user || user.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/login');
        return;
      }
      if (!editTable.table_number.trim() || !editTable.capacity) {
        toast.error('Table number and capacity are required');
        return;
      }
      const capacity = parseInt(editTable.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        toast.error('Capacity must be a positive number');
        return;
      }
      await api.updateTable(editTable.id, {
        user_id: user.id,
        table_number: editTable.table_number,
        capacity,
        status: editTable.status,
        reserved_until: editTable.reserved_until || null,
      });
      toast.success('Table updated successfully');
      setEditTable(null);
      const res = await api.getTables();
      setTables(res.data || []);
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error(error.response?.data?.error || 'Failed to update table');
    }
  };

  const deleteTable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }
    try {
      if (!user || user.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/login');
        return;
      }
      await api.deleteTable(id, { user_id: user.id });
      toast.success('Table deleted successfully');
      const res = await api.getTables();
      setTables(res.data || []);
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error(error.response?.data?.error || 'Failed to delete table');
    }
  };

  if (isLoading || !user) {
    return (
      <div style={styles.loading}>
        <div style={{ textAlign: 'center' }}>
          <TableRestaurant style={{ fontSize: '2rem', marginBottom: '16px' }} />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <TableRestaurant />
          Table Management
        </h1>
        <p style={styles.subtitle}>
          Manage restaurant tables
        </p>
      </div>

      {/* View Toggle */}
      <div style={styles.viewToggle}>
        <button
          onClick={() => setViewMode('grid')}
          style={{
            ...styles.buttonSecondary,
            ...(viewMode === 'grid' ? { backgroundColor: '#3b82f6', color: 'white' } : {})
          }}
        >
          <GridView style={{ fontSize: '1rem' }} />
          Grid
        </button>
        <button
          onClick={() => setViewMode('list')}
          style={{
            ...styles.buttonSecondary,
            ...(viewMode === 'list' ? { backgroundColor: '#3b82f6', color: 'white' } : {})
          }}
        >
          <ViewList style={{ fontSize: '1rem' }} />
          List
        </button>
      </div>

      {/* Tables */}
      <div style={styles.card}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#1e293b',
            margin: 0
          }}>
            Tables ({tables.length})
          </h2>
        </div>
        
        {tables.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#64748b'
          }}>
            <TableRestaurant style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#374151' }}>No tables found</h3>
            <p style={{ margin: 0 }}>Add your first table to get started</p>
          </div>
        ) : (
          <div style={viewMode === 'grid' ? styles.tableGrid : styles.tableList}>
            {tables.map(table => (
              <div 
                key={table.id} 
                style={styles.tableCard}
                onMouseEnter={(e) => {
                  Object.assign(e.target.style, styles.tableCardHover);
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <TableRestaurant style={{ fontSize: '1.2rem' }} />
                    {table.table_number}
                  </h3>
                  <div style={{
                    ...styles.statusBadge,
                    ...(table.status === 'available' ? styles.statusAvailable : styles.statusOccupied)
                  }}>
                    {table.status === 'available' ? <CheckCircle style={{ fontSize: '0.8rem' }} /> : <Cancel style={{ fontSize: '0.8rem' }} />}
                    {table.status}
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px', color: '#64748b', fontSize: '0.9rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    marginBottom: '4px'
                  }}>
                    <People style={{ fontSize: '1rem' }} />
                    <span>Capacity: {table.capacity}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px'
                  }}>
                    <Schedule style={{ fontSize: '1rem' }} />
                    <span>
                      {table.reserved_until ? 
                        `Reserved until: ${new Date(table.reserved_until).toLocaleDateString()}` : 
                        'Not reserved'
                      }
                    </span>
                  </div>
                </div>
                
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => setEditTable(table)}
                    style={styles.buttonEdit}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                  >
                    <Edit style={{ fontSize: '1rem' }} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTable(table.id)}
                    style={styles.buttonDelete}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                  >
                    <Delete style={{ fontSize: '1rem' }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        style={styles.addButton}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.backgroundColor = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.backgroundColor = '#3b82f6';
        }}
      >
        <Add style={{ fontSize: '1.5rem' }} />
      </button>

      {/* Add Modal */}
      {showAddForm && (
        <div style={styles.overlay} onClick={() => setShowAddForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAddForm(false)}
              style={styles.closeButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <Close />
            </button>
            
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Add />
              Add New Table
            </h2>
            
            <form onSubmit={addTable}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Table Number</label>
                  <input
                    type="text"
                    value={newTable.table_number}
                    onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                    placeholder="e.g., T001"
                    required
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Capacity</label>
                  <input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                    placeholder="4"
                    min="1"
                    required
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  <Save />
                  Add Table
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={styles.buttonSecondary}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTable && (
        <div style={styles.overlay} onClick={() => setEditTable(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditTable(null)}
              style={styles.closeButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <Close />
            </button>
            
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Edit />
              Edit Table
            </h2>
            
            <form onSubmit={updateTable}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Table Number</label>
                  <input
                    type="text"
                    value={editTable.table_number}
                    onChange={(e) => setEditTable({ ...editTable, table_number: e.target.value })}
                    required
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Capacity</label>
                  <input
                    type="number"
                    value={editTable.capacity}
                    onChange={(e) => setEditTable({ ...editTable, capacity: e.target.value })}
                    min="1"
                    required
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    value={editTable.status}
                    onChange={(e) => setEditTable({ ...editTable, status: e.target.value })}
                    style={styles.select}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Reserved Until</label>
                  <input
                    type="datetime-local"
                    value={editTable.reserved_until ? editTable.reserved_until.slice(0, 16) : ''}
                    onChange={(e) => setEditTable({ ...editTable, reserved_until: e.target.value })}
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  <Save />
                  Update Table
                </button>
                <button
                  type="button"
                  onClick={() => setEditTable(null)}
                  style={styles.buttonSecondary}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableManagement;