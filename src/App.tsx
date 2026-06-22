import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { GlobeView } from '@/views/GlobeView';
import { BracketView } from '@/views/BracketView';
import { MatchView } from '@/views/MatchView';
import { TeamView } from '@/views/TeamView';
import { DashboardView } from '@/views/DashboardView';
import { NotFoundView } from '@/views/NotFoundView';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GlobeView />} />
        <Route path="/bracket" element={<BracketView />} />
        <Route path="/match/:matchId" element={<MatchView />} />
        <Route path="/team/:teamId" element={<TeamView />} />
        <Route path="/model" element={<DashboardView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </Layout>
  );
}
