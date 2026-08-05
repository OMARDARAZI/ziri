import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { useAuth } from '../auth/AuthProvider';
import { Menu, CircleUser, LogOut, Search, Bell, Mail } from 'lucide-react';

export function DashboardLayout({ role }: { role: 'admin' | 'provider' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = () => {
    void logout().then(() => navigate(`/${role}/login`));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/${role}/bookings?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'Z';
  const userDetail = user?.phone || user?.email || '';

  return (
    <div className="app-container">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <header className="app-header">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-link text-dark p-0 d-lg-none me-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={24} />
            </button>

            {/* Pill Search Bar matching Donezo screenshot */}
            <form className="header-search-bar d-none d-sm-flex" onSubmit={handleSearchSubmit}>
              <Search size={16} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search task or booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="shortcut-kbd">⌘ F</span>
            </form>
          </div>

          <div className="header-actions">
            <div className="icon-btn-pill d-none d-md-flex" title="Messages">
              <Mail size={18} />
            </div>
            <div className="icon-btn-pill d-none d-md-flex" title="Notifications">
              <Bell size={18} />
            </div>

            {/* User Profile Pill Widget matching Donezo screenshot */}
            <div className="dropdown">
              <div
                className="header-user-profile dropdown-toggle"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="user-avatar-circle">
                  {initial}
                </div>
                <div className="user-info-text d-none d-md-flex">
                  <span className="user-info-name">{user?.full_name || 'Totok Michael'}</span>
                  <span className="user-info-email">{userDetail}</span>
                </div>
              </div>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border mt-2 p-1.5" style={{ borderColor: '#E2E8F0', borderRadius: '0.85rem' }} aria-labelledby="userDropdown">
                <li>
                  <Link className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2 fw-600" to={`/${role}/profile`}>
                    <CircleUser size={16} />
                    <span>My Profile</span>
                  </Link>
                </li>
                <li><hr className="dropdown-divider my-1" style={{ borderColor: '#E2E8F0' }} /></li>
                <li>
                  <button className="dropdown-item rounded-3 text-danger d-flex align-items-center gap-2 py-2 w-100 fw-600" onClick={handleSignOut}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
