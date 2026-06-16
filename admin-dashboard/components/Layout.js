import { useRouter } from 'next/router';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function Layout({ children, title }) {
  const router = useRouter();

  function logout() {
    Cookies.remove('admin_user');
    router.push('/');
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard',  icon: '📊' },
    { href: '/clients',   label: 'Dossiers KYC', icon: '📋' },
    { href: '/agents',    label: 'Agents',      icon: '👤' },
    { href: '/agences',   label: 'Agences',     icon: '🏢' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">KYC Manager</p>
              <p className="text-xs text-gray-500">Administration</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                router.pathname === item.href
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
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
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
}