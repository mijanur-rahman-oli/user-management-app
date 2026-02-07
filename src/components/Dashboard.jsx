// IMPORTANT: Dashboard component with user management table
// REQUIREMENT #2: Table should look like a table, toolbar should look like a toolbar
// REQUIREMENT #3: Data sorted by last login time
// REQUIREMENT #4: Multiple selection with checkboxes
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Navbar, Nav, Alert, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { userAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentUser, setCurrentUser] = useState(null);

  // NOTE: Load current user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  // IMPORTANT: Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // NOTE: Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users);
      setSelectedUsers([]); // Clear selection after refresh
    } catch (error) {
      showMessage('danger', 'Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // NOTA BENE: Show temporary message to user
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // IMPORTANT: Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // NOTE: Handle select all checkbox (REQUIREMENT #4)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all user IDs
      setSelectedUsers(users.map(user => user.id));
    } else {
      // Deselect all
      setSelectedUsers([]);
    }
  };

  // NOTE: Handle individual checkbox selection
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // IMPORTANT: Block selected users
  const handleBlock = async () => {
    if (selectedUsers.length === 0) {
      showMessage('warning', 'Please select users to block');
      return;
    }

    try {
      setActionLoading(true);
      await userAPI.blockUsers(selectedUsers);
      showMessage('success', `${selectedUsers.length} user(s) blocked successfully`);
      await fetchUsers();
    } catch (error) {
      showMessage('danger', 'Failed to block users');
    } finally {
      setActionLoading(false);
    }
  };

  // IMPORTANT: Unblock selected users
  const handleUnblock = async () => {
    if (selectedUsers.length === 0) {
      showMessage('warning', 'Please select users to unblock');
      return;
    }

    try {
      setActionLoading(true);
      await userAPI.unblockUsers(selectedUsers);
      showMessage('success', `${selectedUsers.length} user(s) unblocked successfully`);
      await fetchUsers();
    } catch (error) {
      showMessage('danger', 'Failed to unblock users');
    } finally {
      setActionLoading(false);
    }
  };

  // IMPORTANT: Delete selected users (actual deletion, not soft delete)
  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      showMessage('warning', 'Please select users to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await userAPI.deleteUsers(selectedUsers);
      showMessage('success', `${selectedUsers.length} user(s) deleted successfully`);
      await fetchUsers();
    } catch (error) {
      showMessage('danger', 'Failed to delete users');
    } finally {
      setActionLoading(false);
    }
  };

  // IMPORTANT: Delete all unverified users
  const handleDeleteUnverified = async () => {
    if (!window.confirm('Are you sure you want to delete all unverified users?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await userAPI.deleteUnverified();
      showMessage('success', response.data.message);
      await fetchUsers();
    } catch (error) {
      showMessage('danger', 'Failed to delete unverified users');
    } finally {
      setActionLoading(false);
    }
  };

  // NOTE: Format date/time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // NOTE: Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'blocked': return 'danger';
      case 'unverified': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <>
      {/* IMPORTANT: Navigation bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-0">
        <Container fluid>
          <Navbar.Brand href="#" style={{ fontWeight: 700 }}>
            <i className="bi bi-people-fill me-2"></i>
            User Management System
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Navbar.Text className="me-3">
                Signed in as: <strong>{currentUser?.name}</strong>
              </Navbar.Text>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        {/* NOTE: Status message display */}
        {message.text && (
          <Alert 
            variant={message.type} 
            dismissible 
            onClose={() => setMessage({ type: '', text: '' })}
            className="mb-3"
          >
            {message.text}
          </Alert>
        )}

        {/* IMPORTANT: Toolbar with action buttons (REQUIREMENT #2) */}
        <div className="toolbar mb-0">
          {/* NOTE: Block button with text */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Block selected users</Tooltip>}
          >
            <Button
              variant="warning"
              onClick={handleBlock}
              disabled={actionLoading || selectedUsers.length === 0}
              className="d-flex align-items-center"
            >
              <i className="bi bi-lock-fill me-2"></i>
              Block
            </Button>
          </OverlayTrigger>

          {/* NOTE: Unblock button with icon */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Unblock selected users</Tooltip>}
          >
            <Button
              variant="success"
              onClick={handleUnblock}
              disabled={actionLoading || selectedUsers.length === 0}
              className="d-flex align-items-center"
            >
              <i className="bi bi-unlock-fill"></i>
            </Button>
          </OverlayTrigger>

          {/* NOTE: Delete button with icon */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Delete selected users</Tooltip>}
          >
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={actionLoading || selectedUsers.length === 0}
              className="d-flex align-items-center"
            >
              <i className="bi bi-trash-fill"></i>
            </Button>
          </OverlayTrigger>

          {/* NOTE: Delete unverified button with icon */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Delete all unverified users</Tooltip>}
          >
            <Button
              variant="outline-danger"
              onClick={handleDeleteUnverified}
              disabled={actionLoading}
              className="d-flex align-items-center"
            >
              <i className="bi bi-person-x-fill"></i>
            </Button>
          </OverlayTrigger>

          {/* NOTE: Selection counter */}
          {selectedUsers.length > 0 && (
            <span className="ms-auto text-muted">
              {selectedUsers.length} user(s) selected
            </span>
          )}
        </div>

        {/* IMPORTANT: User management table (REQUIREMENT #2, #3, #4) */}
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading users...</p>
            </div>
          ) : (
            <Table hover className="mb-0">
              <thead>
                <tr>
                  {/* NOTA BENE: Select all checkbox without label (REQUIREMENT #4) */}
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      disabled={actionLoading}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Last Login</th>
                  <th>Registration Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      {/* NOTE: Individual selection checkbox */}
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          disabled={actionLoading}
                        />
                      </td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{formatDateTime(user.last_login_time)}</td>
                      <td>{formatDateTime(user.registration_time)}</td>
                      <td>
                        <span className={`badge bg-${getStatusVariant(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </div>
      </Container>
    </>
  );
}

export default Dashboard;