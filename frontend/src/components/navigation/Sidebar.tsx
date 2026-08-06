import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import {
  LayoutDashboard,
  BookOpen,
  Newspaper,
  CalendarDays,
  UtensilsCrossed,
  ShieldCheck,
  Building2,
  UserCog,
  Compass,
  Users,
  CalendarCheck,
  Contact,
  QrCode,
  ScanLine,
  Settings,
  CircleUser,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'provider';
  isOpen?: boolean;
  onClose?: () => void;
}

const adminGroups = [
  {
    title: 'Overview',
    links: [{ path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
  },
  {
    title: 'Content',
    links: [
      { path: 'stories', label: 'Stories', icon: BookOpen },
      { path: 'news', label: 'News', icon: Newspaper },
      { path: 'events', label: 'Events', icon: CalendarDays },
      { path: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed },
      { path: 'safety-tips', label: 'Safety tips', icon: ShieldCheck }
    ]
  },
  {
    title: 'Marketplace',
    links: [
      { path: 'providers', label: 'Providers', icon: Building2 },
      { path: 'provider-users', label: 'Provider users', icon: UserCog },
      { path: 'offerings', label: 'Offerings', icon: Compass }
    ]
  },
  {
    title: 'User Management',
    links: [
      { path: 'users', label: 'All Users', icon: Users },
      { path: 'customers', label: 'Customers', icon: Users },
      { path: 'provider-users', label: 'Provider Users', icon: UserCog }
    ]
  },
  {
    title: 'Operations',
    links: [
      { path: 'bookings', label: 'Bookings', icon: CalendarCheck },
      { path: 'participants', label: 'Participants', icon: Contact },
      { path: 'qr-codes', label: 'QR codes', icon: QrCode },
      { path: 'scan-logs', label: 'Scan logs', icon: ScanLine }
    ]
  },
  {
    title: 'System',
    links: [
      { path: 'settings', label: 'Settings', icon: Settings },
      { path: 'profile', label: 'Profile', icon: CircleUser }
    ]
  }
];

const providerGroups = [
  {
    title: 'Overview',
    links: [{ path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
  },
  {
    title: 'Operations',
    links: [
      { path: 'bookings', label: 'Bookings', icon: CalendarCheck },
      { path: 'scanner', label: 'Scan QR Code', icon: QrCode },
      { path: 'scan-history', label: 'Scan history', icon: ScanLine }
    ]
  },
  {
    title: 'Account',
    links: [{ path: 'profile', label: 'Profile', icon: CircleUser }]
  }
];

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const groups = role === 'admin' ? adminGroups : providerGroups;
  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'Z';

  return (
    <>
      {isOpen && onClose && (
        <div className="sidebar-overlay d-lg-none" onClick={onClose} />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to={`/${role}/dashboard`} className="sidebar-brand" onClick={onClose}>
            <div className="sidebar-brand-icon">
              <Compass size={20} />
            </div>
            <span>Zeera</span>
            <span className="sidebar-portal-badge">{role}</span>
          </NavLink>
          {onClose && (
            <button
              className="btn btn-link text-white p-0 d-lg-none"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-content">
          {groups.map((group) => (
            <div key={group.title} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              <nav className="nav flex-column gap-1">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      className="sidebar-link"
                      to={`/${role}/${link.path}`}
                      onClick={onClose}
                    >
                      <Icon />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-summary">
            <div className="user-avatar">{initial}</div>
            <div className="user-details">
              <span className="user-name">{user?.full_name || 'Super Admin'}</span>
              <span className="user-role">{role} Portal</span>
            </div>
            <button
              className="btn btn-link text-white-50 p-0 ms-auto hover-white"
              onClick={() => void logout()}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
