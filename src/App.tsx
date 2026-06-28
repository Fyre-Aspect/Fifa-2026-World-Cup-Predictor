import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

// Route-level code splitting: heavy deps (recharts on the dashboard) only
// download when their view is actually visited.
const GroupStageView = lazy(() => import('@/views/GroupStageView').then((m) => ({ default: m.GroupStageView })));
const BracketView = lazy(() => import('@/views/BracketView').then((m) => ({ default: m.BracketView })));
const MatchView = lazy(() => import('@/views/MatchView').then((m) => ({ default: m.MatchView })));
const TeamView = lazy(() => import('@/views/TeamView').then((m) => ({ default: m.TeamView })));
const DashboardView = lazy(() => import('@/views/DashboardView').then((m) => ({ default: m.DashboardView })));
const NotFoundView = lazy(() => import('@/views/NotFoundView').then((m) => ({ default: m.NotFoundView })));

function ViewFallback() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16">
      <div className="skeleton h-8 w-48 rounded-md" />
      <div className="skeleton mt-4 h-64 w-full rounded-xl" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<ViewFallback />}>
        <Routes>
          <Route path="/" element={<GroupStageView />} />
          {/* Legacy routes kept as redirects so old links/bookmarks still work. */}
          <Route path="/groups" element={<Navigate to="/" replace />} />
          <Route path="/knockouts" element={<Navigate to="/bracket" replace />} />
          <Route path="/bracket" element={<BracketView />} />
          <Route path="/match/:matchId" element={<MatchView />} />
          <Route path="/team/:teamId" element={<TeamView />} />
          <Route path="/model" element={<DashboardView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
