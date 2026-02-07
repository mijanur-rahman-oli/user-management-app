// IMPORTANT: Registration component for new users
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // NOTE: Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  // IMPORTANT: Handle registration form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // NOTA BENE: Password can be any non-empty string (even 1 character)
      if (!formData.password) {
        setError('Password cannot be empty');
        setLoading(false);
        return;
      }

      // NOTE: Call registration API
      const response = await authAPI.register(formData);
      
      // IMPORTANT: Show success message
      setSuccess(response.data.message);
      
      // NOTE: Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // NOTA BENE: Display appropriate error message
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Container>
        <Card className="auth-card shadow">
          <Card.Body>
            {/* IMPORTANT: Application title */}
            <h2 className="text-center mb-4" style={{ fontWeight: 700, color: '#333' }}>
              User Management System
            </h2>
            <h5 className="text-center mb-4 text-muted">Create your account</h5>

            {/* NOTE: Display error or success alerts */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
                <br />
                <small>Redirecting to login...</small>
              </Alert>
            )}

            {/* IMPORTANT: Registration form */}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                  disabled={loading || success}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
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
                  disabled={loading || success}
                />
                {/* NOTA BENE: Password can be any non-empty string */}
                <Form.Text className="text-muted">
                  Password must be at least 1 character long
                </Form.Text>
              </Form.Group>

              {/* NOTE: Submit button with loading state */}
              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-3"
                disabled={loading || success}
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating account...
                  </>
                ) : success ? (
                  'Registration Successful!'
                ) : (
                  'Create Account'
                )}
              </Button>
            </Form>

            {/* IMPORTANT: Link to login page */}
            <div className="text-center mt-4">
              <p className="mb-0">
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 600 }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Register;