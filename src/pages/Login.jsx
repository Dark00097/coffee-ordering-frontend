import { useState } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await api.post('/login', { email, password });
      const { user } = res.data;
      toast.success('Logged in successfully');
      onLogin(user);
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={styles.container}>
      {/* Animated background circles */}
      <div style={styles.backgroundCircle1}></div>
      <div style={styles.backgroundCircle2}></div>
      <div style={styles.backgroundCircle3}></div>

      <div style={styles.loginCard} className="login-card">
        {/* Header with animated icon */}
        <div style={styles.header}>
          <div style={styles.iconContainer} className="icon-container">
            <LoginIcon style={styles.headerIcon} />
          </div>
          <h1 style={styles.title} className="fade-in-title">Welcome Back</h1>
          <p style={styles.subtitle} className="fade-in-subtitle">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email Input */}
          <div style={styles.inputGroup} className="input-group">
            <div 
              style={{
                ...styles.inputContainer,
                ...(focusedField === 'email' ? styles.inputContainerFocused : {})
              }}
              className="input-container"
            >
              <EmailIcon style={{
                ...styles.inputIcon,
                ...(focusedField === 'email' || email ? styles.inputIconActive : {})
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Email address"
                required
                style={styles.input}
                className="animated-input"
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={styles.inputGroup} className="input-group">
            <div 
              style={{
                ...styles.inputContainer,
                ...(focusedField === 'password' ? styles.inputContainerFocused : {})
              }}
              className="input-container"
            >
              <LockIcon style={{
                ...styles.inputIcon,
                ...(focusedField === 'password' || password ? styles.inputIconActive : {})
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                required
                style={styles.input}
                className="animated-input"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={styles.visibilityButton}
                className="visibility-btn"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              ...styles.submitButton,
              ...(isLoading ? styles.submitButtonDisabled : {})
            }}
            className="submit-btn"
          >
            <span style={styles.buttonContent}>
              {isLoading && <div style={styles.spinner}></div>}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </span>
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
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

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
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
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .login-card {
          animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .icon-container {
          animation: bounce 2s infinite;
        }

        .fade-in-title {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .fade-in-subtitle {
          animation: fadeInUp 0.6s ease-out 0.4s both;
        }

        .input-group {
          animation: fadeInUp 0.5s ease-out both;
        }

        .input-group:nth-child(1) { animation-delay: 0.6s; }
        .input-group:nth-child(2) { animation-delay: 0.8s; }

        .submit-btn {
          animation: fadeInUp 0.5s ease-out 1s both;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .animated-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animated-input:focus {
          transform: translateY(-1px);
        }

        .input-container {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .visibility-btn {
          transition: all 0.2s ease;
        }

        .visibility-btn:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
          transform: scale(1.1);
        }

        @media (max-width: 480px) {
          .login-card {
            margin: 20px;
            padding: 32px 24px !important;
          }
          
          .fade-in-title {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },
  
  // Animated background elements
  backgroundCircle1: {
    position: 'absolute',
    top: '10%',
    right: '10%',
    width: '300px',
    height: '300px',
    background: 'linear-gradient(45deg, rgba(148, 163, 184, 0.1), rgba(203, 213, 225, 0.1))',
    borderRadius: '50%',
    animation: 'float 6s ease-in-out infinite',
    zIndex: 0
  },
  
  backgroundCircle2: {
    position: 'absolute',
    bottom: '20%',
    left: '5%',
    width: '200px',
    height: '200px',
    background: 'linear-gradient(45deg, rgba(203, 213, 225, 0.1), rgba(148, 163, 184, 0.1))',
    borderRadius: '50%',
    animation: 'float 8s ease-in-out infinite reverse',
    zIndex: 0
  },
  
  backgroundCircle3: {
    position: 'absolute',
    top: '60%',
    right: '60%',
    width: '150px',
    height: '150px',
    background: 'linear-gradient(45deg, rgba(148, 163, 184, 0.05), rgba(203, 213, 225, 0.05))',
    borderRadius: '50%',
    animation: 'pulse 4s ease-in-out infinite',
    zIndex: 0
  },

  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5)',
    padding: '48px',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    zIndex: 1
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  
  iconContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    borderRadius: '50%',
    marginBottom: '24px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.8)'
  },
  
  headerIcon: {
    fontSize: '36px',
    color: '#475569',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
  },
  
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px'
  },
  
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0',
    fontWeight: '400'
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: '16px',
    border: '2px solid rgba(226, 232, 240, 0.5)',
    overflow: 'hidden'
  },
  
  inputContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(30, 41, 59, 0.3)',
    boxShadow: '0 0 0 4px rgba(30, 41, 59, 0.05)'
  },
  
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#94a3b8',
    fontSize: '20px',
    zIndex: 1,
    transition: 'all 0.3s ease'
  },
  
  inputIconActive: {
    color: '#475569',
    transform: 'scale(1.1)'
  },
  
  input: {
    width: '100%',
    padding: '16px 16px 16px 52px',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    backgroundColor: 'transparent',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1e293b',
    fontWeight: '500'
  },
  
  visibilityButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    borderRadius: '8px',
    width: '32px',
    height: '32px'
  },
  
  submitButton: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(30, 41, 59, 0.2)'
  },
  
  submitButtonDisabled: {
    background: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)',
    cursor: 'not-allowed'
  },
  
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default Login;