import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { useAuth } from '../auth/AuthProvider';
import { Menu, CircleUser, LogOut } from 'lucide-react';

export function DashboardLayout({ role }: { role: 'admin' | 'provider' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = () => {
    void logout().then(() => navigate(`/${role}/login`));
  };

  // Simple breadcrumbs generation based on path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.replace(/-/g, ' ');
    const isLast = index === pathSegments.length - 1;

    return (
      <span key={path} className="breadcrumb-item text-capitalize">
        {isLast ? (
          <span>{label}</span>
        ) : (
          <Link to={path}>{label}</Link>
        )}
      </span>
    );
  });

  return (
    <div className="app-container">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <header className="app-header">
          <div className="header-left">
            <button
              className="btn btn-link text-dark p-0 d-lg-none me-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={24} />
            </button>
            <div className="breadcrumb-container d-none d-sm-flex mb-0">
              <span className="breadcrumb-item text-capitalize">
                <Link to={`/${role}/dashboard`}>Home</Link>
              </span>
              {breadcrumbs.slice(1)}
            </div>
          </div>

          <div className="header-right">
            <div className="dropdown">
              <button
                className="btn btn-link text-dark p-0 d-flex align-items-center gap-2 text-decoration-none dropdown-toggle"
                type="button"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'Z'}
                </div>
                <span className="d-none d-md-inline fw-500 font-size-09">{user?.full_name}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-md border-0 mt-2 p-2" aria-labelledby="userDropdown">
                <li>
                  <Link className="dropdown-item rounded d-flex align-items-center gap-2 py-2" to={`/${role}/profile`}>
                    <CircleUser size={16} />
                    <span>My Profile</span>
                  </Link>
                </li>
                <li><hr className="dropdown-divider my-1" /></li>
                <li>
                  <button className="dropdown-item rounded text-danger d-flex align-items-center gap-2 py-2 w-100" onClick={handleSignOut}>
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
