import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ServicePage } from './components/ServicePage';
import { OrderPage } from './components/OrderPage';
import { ProfilePage } from './components/ProfilePage';
import { ChatPage } from './components/ChatPage';
import { LoginPage } from './components/LoginPage';
import { ApiDocsPage } from './components/ApiDocsPage';
import { AdminPanelPage } from './components/AdminPanelPage';
import { RulesPage } from './components/RulesPage';
import { getCurrentUser, getUserById } from './api/userService';
import { useAuthStore, type AuthSession } from './store/authStore';
import { useI18n } from './i18n/useI18n';

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const hideFooter = location.pathname === '/rules';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      (
        <Header
          onNavigateHome={() => navigate('/')}
          onNavigateProfile={() => navigate('/profile')}
          onNavigateChat={(chatId, state) => navigate(chatId ? `/chat/${chatId}` : '/chat', { state })}
          onNavigateAdmin={() => navigate('/admin')}
        />
      )
      <div className="flex-1">
        <Outlet />
      </div>
      {!hideFooter && (
        <footer className="border-t border-gray-100">
          <div className="max-w-[1440px] mx-auto px-8 py-4 text-xs text-gray-500 text-center">
            <button
              type="button"
              onClick={() => navigate('/rules')}
              className="hover:text-gray-700 transition-colors"
            >
              правила платформы
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function PublicLayout() {
  return <AppLayout />;
}

function LoginRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();

  const handleLogin = (session: AuthSession) => {
    login(session);
    navigate('/', { replace: true });
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

function HomeRoute() {
  const navigate = useNavigate();

  return (
    <HomePage
      onNavigateToService={(serviceId) => navigate(`/services/${serviceId}`)}
      onNavigateToOrder={(orderId) => navigate(`/orders/${orderId}`)}
    />
  );
}

function ServiceRoute() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  if (!serviceId) {
    return <Navigate to="/" replace />;
  }

  return (
    <ServicePage
      serviceId={serviceId}
      onBack={() => navigate('/')}
      onNavigateToChat={(chatId, state) => navigate(chatId ? `/chat/${chatId}` : '/chat', { state })}
    />
  );
}

function OrderRoute() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <OrderPage
      orderId={orderId}
      onBack={() => navigate('/')}
      onNavigateToChat={(chatId, state) => navigate(chatId ? `/chat/${chatId}` : '/chat', { state })}
    />
  );
}

function ProfileRoute() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <ProfilePage
      onNavigateToService={(serviceId) => navigate(`/services/${serviceId}`)}
      onNavigateToOrder={(orderId) => navigate(`/orders/${orderId}`)}
      onLogout={handleLogout}
    />
  );
}

function ChatRoute() {
  const { chatId } = useParams();

  return <ChatPage selectedChatId={chatId ?? null} />;
}

function AdminRoute() {
  const { user } = useAuthStore();

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return <Navigate to="/" replace />;
  }

  return <AdminPanelPage />;
}

export default function App() {
  const { token, isAuthenticated, setUser } = useAuthStore();
  const { locale } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      return;
    }

    let active = true;

    const loadUser = async () => {
      try {
        const user = await getCurrentUser(token);
        if (!active || !user || !user.id) {
          return;
        }
        if (!user.profile) {
          try {
            const fullUser = await getUserById(token, user.id);
            if (!active) {
              return;
            }
            setUser(fullUser);
            return;
          } catch {
            if (!active) {
              return;
            }
          }
        }
        setUser(user);
      } catch {
        if (!active) {
          return;
        }
        setUser(null);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [isAuthenticated, setUser, token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/rules" element={<RulesPage />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/services/:serviceId" element={<ServiceRoute />} />
          <Route path="/orders/:orderId" element={<OrderRoute />} />
          <Route path="/profile" element={<ProfileRoute />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:chatId" element={<ChatRoute />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/docs" element={<ApiDocsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
