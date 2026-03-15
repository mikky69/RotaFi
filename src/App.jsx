import React from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppStateProvider, useAppState } from './hooks/useAppState.jsx';
import { Toast } from './components/ui.jsx';
import AppShell          from './components/AppShell.jsx';
import CreateModal       from './components/CreateModal.jsx';
import LandingPage       from './pages/LandingPage.jsx';
import OverviewPage      from './pages/OverviewPage.jsx';
import MyCirclesPage     from './pages/MyCirclesPage.jsx';
import JoinCirclePage    from './pages/JoinCirclePage.jsx';
import HistoryPage       from './pages/HistoryPage.jsx';
import CircleDetailPage  from './pages/CircleDetailPage.jsx';
import ProfilePage       from './pages/ProfilePage.jsx';
import NotFoundPage      from './pages/NotFoundPage.jsx';
import ConnectPrompt     from './components/ConnectPrompt.jsx';

function Protected({ children }) {
  const { connected } = useAppState();
  return connected ? children : <ConnectPrompt />;
}

function AppLayout({ children }) {
  const { showCreate, setShowCreate, handleCreate, toast, setToast } = useAppState();
  const navigate = useNavigate();
  return (
    <>
      <AppShell>
        {children}
      </AppShell>
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={async (params) => {
            const id = await handleCreate(params);
            setShowCreate(false);
            navigate(`/app/circle/${id}`);
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function OverviewRoute() {
  const { account, circles } = useAppState();
  const navigate = useNavigate();
  return <OverviewPage account={account} circles={circles} onNavigate={navigate} onViewCircle={id => navigate(`/app/circle/${id}`)} />;
}
function MyCirclesRoute() {
  const { circles, setShowCreate } = useAppState();
  const navigate = useNavigate();
  return <MyCirclesPage circles={circles} onViewCircle={id => navigate(`/app/circle/${id}`)} onCreateCircle={() => setShowCreate(true)} />;
}
function JoinRoute() {
  const { available, circles, handleJoin, setShowCreate } = useAppState();
  return <JoinCirclePage availableCircles={available} myCircleIds={circles.map(c=>c.id)} onJoin={handleJoin} onCreateCircle={() => setShowCreate(true)} />;
}
function HistoryRoute() {
  const { circles } = useAppState();
  return <HistoryPage circles={circles} />;
}
function CircleDetailRoute() {
  const { id } = useParams();
  const { circles, available, handleDeposit, handleTriggerPayout, handleJoin, connected } = useAppState();
  const navigate = useNavigate();
  const circle  = circles.find(c=>c.id===id) || available.find(c=>c.id===id);
  if (!circle) return <NotFoundPage />;
  const isMember = circles.some(c=>c.id===id);
  return (
    <CircleDetailPage
      circle={circle} isMember={isMember} connected={connected}
      onBack={() => navigate(-1)}
      onDeposit={handleDeposit} onTriggerPayout={handleTriggerPayout} onJoin={handleJoin}
    />
  );
}

function Router() {
  const { connected, handleConnect, isConnecting, walletError } = useAppState();
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/"
        element={connected
          ? <Navigate to="/app" replace />
          : <LandingPage onConnect={async()=>{ await handleConnect(); navigate('/app'); }} isConnecting={isConnecting} error={walletError} />
        }
      />
      <Route path="/app/*" element={
        <AppLayout>
          <Routes>
            <Route path="/"           element={<Protected><OverviewRoute /></Protected>} />
            <Route path="/circles"    element={<Protected><MyCirclesRoute /></Protected>} />
            <Route path="/join"       element={<Protected><JoinRoute /></Protected>} />
            <Route path="/history"    element={<Protected><HistoryRoute /></Protected>} />
            <Route path="/profile"    element={<Protected><ProfilePage /></Protected>} />
            <Route path="/circle/:id" element={<CircleDetailRoute />} />
            <Route path="*"           element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      } />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return <AppStateProvider><Router /></AppStateProvider>;
}
