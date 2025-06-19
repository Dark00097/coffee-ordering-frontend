import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

function UserManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'server' });
  const [editUser, setEditUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Moved the useEffect for CSS styles into the component body
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .user-management-input:focus, .user-management-select:focus {
        border-color: #4f46e5 !important;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
      }
      
      .user-management-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .user-management-staff-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      
      @media (max-width: 768px) {
        .user-management-content {
          grid-template-columns: 1fr !important;
          padding: 20px 16px !important;
          gap: 24px !important;
        }
        
        .user-management-header-content {
          padding: 0 16px !important;
        }
        
        .user-management-title {
          font-size: 24px !important;
        }
        
        .user-management-staff-card {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 16px !important;
        }
        
        .user-management-staff-actions {
          align-self: flex-end !important;
        }
        
        .user-management-staff-meta {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 8px !important;
        }
        
        .user-management-modal-actions {
          flex-direction: column !important;
          gap: 8px !important;
        }
      }
      
      @media (max-width: 480px) {
        .user-management-modal {
          margin: 16px !important;
          padding: 16px !important;
        }
        
        .user-management-card {
          padding: 16px !important;
        }
        
        .user-management-primary-button, .user-management-secondary-button {
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, []);

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
        console.error('Auth check failed:', err.response?.data || err.message);
        toast.error(err.response?.data?.error || 'Please log in');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data || []);
      } catch (err) {
        console.error('Failed to load users:', err.response?.data || err.message);
        toast.error(err.response?.data?.error || 'Failed to load users');
      }
    };

    checkAuth();
    fetchUsers();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    try {
      await api.post('/staff', { user_id: user.id, ...form });
      setForm({ email: '', password: '', role: 'server' });
      const res = await api.get('/users');
      setUsers(res.data || []);
      toast.success('Staff added successfully');
    } catch (err) {
      console.error('Failed to add user:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to add staff');
    }
  };

  const handleEdit = (u) => {
    setEditUser({ id: u.id, email: u.email, password: '', role: u.role });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser.email.trim()) {
      toast.error('Email is required');
      return;
    }
    try {
      await api.updateUser(editUser.id, { user_id: user.id, ...editUser });
      setEditUser(null);
      const res = await api.get('/users');
      setUsers(res.data || []);
      toast.success('User updated successfully');
    } catch (err) {
      console.error('Failed to update user:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id, { user_id: user.id });
      const res = await api.get('/users');
      setUsers(res.data || []);
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Failed to delete user:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Failed to delete user');
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
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>
            <PeopleIcon style={{ fontSize: 32, color: '#4f46e5' }} />
          </div>
          <div>
            <h1 style={styles.title}>User Management</h1>
            <p style={styles.subtitle}>Manage your restaurant staff and administrators</p>
          </div>
        </div>
      </div>

      <div style={styles.content} className="user-management-content">
        {/* Add Staff Card */}
        <div style={styles.card} className="user-management-card">
          <div style={styles.cardHeader}>
            <PersonAddIcon style={styles.cardIcon} />
            <h2 style={styles.cardTitle}>Add New Staff Member</h2>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <EmailIcon style={styles.inputIcon} />
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={styles.input}
                className="user-management-input"
                placeholder="Enter email address"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <LockIcon style={styles.inputIcon} />
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={styles.input}
                className="user-management-input"
                placeholder="Enter password"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <PersonIcon style={styles.inputIcon} />
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={styles.select}
                className="user-management-select"
              >
                <option value="server">Server</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <button type="submit" style={styles.primaryButton} className="user-management-button user-management-primary-button">
              <PersonAddIcon style={styles.buttonIcon} />
              Add Staff Member
            </button>
          </form>
        </div>

        {/* Staff List Card */}
        <div style={styles.card} className="user-management-card">
          <div style={styles.cardHeader}>
            <PeopleIcon style={styles.cardIcon} />
            <h2 style={styles.cardTitle}>Current Staff ({users.length})</h2>
          </div>
          
          {users.length === 0 ? (
            <div style={styles.emptyState}>
              <PeopleIcon style={styles.emptyIcon} />
              <p style={styles.emptyText}>No staff members found</p>
              <p style={styles.emptySubText}>Add your first staff member to get started</p>
            </div>
          ) : (
            <div style={styles.staffList}>
              {users.map((u) => (
                <div key={u.id} style={styles.staffCard} className="user-management-staff-card">
                  <div style={styles.staffInfo}>
                    <div style={styles.staffAvatar}>
                      {u.role === 'admin' ? (
                        <AdminPanelSettingsIcon style={styles.avatarIcon} />
                      ) : (
                        <RestaurantIcon style={styles.avatarIcon} />
                      )}
                    </div>
                    <div style={styles.staffDetails}>
                      <h3 style={styles.staffEmail}>{u.email}</h3>
                      <div style={styles.staffMeta} className="user-management-staff-meta">
                        <span style={{
                          ...styles.roleBadge,
                          backgroundColor: u.role === 'admin' ? '#dc2626' : '#059669',
                        }}>
                          {u.role === 'admin' ? 'Administrator' : 'Server'}
                        </span>
                        <span style={styles.dateText}>
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.staffActions} className="user-management-staff-actions">
                    <button
                      onClick={() => handleEdit(u)}
                      style={styles.editButton}
                      title="Edit user"
                    >
                      <EditIcon style={styles.actionIcon} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      style={styles.deleteButton}
                      title="Delete user"
                    >
                      <DeleteIcon style={styles.actionIcon} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} className="user-management-modal">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Staff Member</h2>
              <button
                onClick={() => setEditUser(null)}
                style={styles.closeButton}
              >
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <EmailIcon style={styles.inputIcon} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  required
                  style={styles.input}
                  className="user-management-input"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <LockIcon style={styles.inputIcon} />
                  Password
                </label>
                <input
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  style={styles.input}
                  className="user-management-input"
                  placeholder="Leave blank to keep unchanged"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <PersonIcon style={styles.inputIcon} />
                  Role
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  style={styles.select}
                  className="user-management-select"
                >
                  <option value="server">Server</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div style={styles.modalActions} className="user-management-modal-actions">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={styles.secondaryButton}
                  className="user-management-button user-management-secondary-button"
                >
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} className="user-management-button user-management-primary-button">
                  <SaveIcon style={styles.buttonIcon} />
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '0',
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  
  loadingText: {
    color: '#6b7280',
    fontSize: '16px',
    fontWeight: '500',
  },
  
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '24px 0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  
  headerIcon: {
    backgroundColor: '#eef2ff',
    padding: '12px',
    borderRadius: '12px',
  },
  
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0',
  },
  
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '32px',
  },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    height: 'fit-content',
  },
  
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f3f4f6',
  },
  
  cardIcon: {
    fontSize: '24px',
    color: '#4f46e5',
  },
  
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: '0',
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  
  inputIcon: {
    fontSize: '18px',
    color: '#6b7280',
  },
  
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  
  select: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },
  
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  buttonIcon: {
    fontSize: '20px',
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  
  emptyIcon: {
    fontSize: '64px',
    color: '#d1d5db',
    marginBottom: '16px',
  },
  
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  
  emptySubText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  
  staffList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  
  staffCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
  },
  
  staffInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  
  staffAvatar: {
    width: '48px',
    height: '48px',
    backgroundColor: '#eef2ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarIcon: {
    fontSize: '24px',
    color: '#4f46e5',
  },
  
  staffDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  
  staffEmail: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0',
  },
  
  staffMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  dateText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  
  staffActions: {
    display: 'flex',
    gap: '8px',
  },
  
  editButton: {
    padding: '8px',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  deleteButton: {
    padding: '8px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionIcon: {
    fontSize: '18px',
  },
  
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: '0',
  },
  
  closeButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
};

export default UserManagement;