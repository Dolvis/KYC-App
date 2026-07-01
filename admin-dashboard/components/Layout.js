import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function Layout({ children, title }) {
  const router   = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    try {
      const admin = Cookies.get('admin_user');
      if (admin) {
        const parsed = JSON.parse(admin);
        setTimeout(() => setUserRole(parsed.role), 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, []); /// eslint-disable-line react-hooks/exhaustive-deps

  function logout() {
    Cookies.remove('admin_user');
    router.push('/');
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard',    icon: '📊', roles: ['admin','super_admin'] },
    { href: '/clients',   label: 'Dossiers KYC', icon: '📋', roles: ['admin','super_admin'] },
    { href: '/agents',    label: 'Agents',        icon: '👤', roles: ['admin','super_admin'] },
    { href: '/agences',   label: 'Agences',       icon: '🏢', roles: ['admin','super_admin'] },
    { href: '/admins',    label: 'Admins',         icon: '🔐', roles: ['super_admin'] },
  ];

  const filteredNav = userRole
    ? nav.filter(item => item.roles.includes(userRole))
    : nav.filter(item => item.roles.includes('admin'));

  return (
    <div className="min-h-screen w-full flex bg-gray-100 overflow-x-hidden">

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-opacity-40 z-20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 min-h-screen w-64 bg-white shadow-sm flex flex-col z-30
        transform transition-transform duration-300
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex
      `}>
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">KYC Manager</p>
              <p className="text-xs text-gray-500">Administration</p>
              {userRole && (
                <span className={`
                  inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${userRole === 'super_admin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'}
                `}>
                  {userRole === 'super_admin' ? '⭐ Super Admin' : '🔑 Admin'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition
                ${item.href === '/admins' ? 'border-l-4 border-amber-400 pl-3' : ''}
                ${router.pathname === item.href ||
                  router.pathname.startsWith(item.href + '/')
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden bg-gray-100">

        {/* Topbar mobile */}
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-gray-600 text-xl p-1 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <div className="w-8" />
        </div>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-x-hidden overflow-y-auto overflow-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}