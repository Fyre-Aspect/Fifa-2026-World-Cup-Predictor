import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

// Route-level code splitting: heavy deps (recharts on the dashboard, three.js in
// the scenes) only download when their view is actually visited.
const GlobeView = lazy(() => import('@/views/GlobeView').then((m) => ({ default: m.GlobeView })));
const GroupStageView = lazy(() => import('@/views/GroupStageView').then((m) => ({ default: m.GroupStageView })));
const KnockoutsView = lazy(() => import('@/views/KnockoutsView').then((m) => ({ default: m.KnockoutsView })));
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
          <Route path="/" element={<GlobeView />} />
          <Route path="/groups" element={<GroupStageView />} />
          <Route path="/knockouts" element={<KnockoutsView />} />
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
