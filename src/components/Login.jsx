// IMPORTANT: Login component with authentication
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import { authAPI } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // NOTE: Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  // IMPORTANT: Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // NOTE: Call login API
      const response = await authAPI.login(formData);
      
      // NOTA BENE: Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // IMPORTANT: Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      // NOTE: Display appropriate error message
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container mx-auto">
      <Container>
        <Card className="auth-card shadow">
          <Card.Body>
            {/* IMPORTANT: Application title */}
            <h2 className="text-center mb-4" style={{ fontWeight: 700, color: '#333' }}>
              User Management App
            </h2>
            <h5 className="text-center mb-4 text-muted">Sign in</h5>

            {/* NOTE: Display error alert if login fails */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* IMPORTANT: Login form */}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoFocus
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>

              {/* NOTE: Submit button with loading state */}
              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-3"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Form>

            {/* IMPORTANT: Link to registration page */}
            <div className="text-center mt-4">
              <p className="mb-0">
                Don't have an account?{' '}
                <Link to="/register" style={{ fontWeight: 600 }}>
                  Register here
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Login;