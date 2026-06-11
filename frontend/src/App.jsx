import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LeaguePage from './pages/LeaguePage';
import WorldCupPage from './pages/WorldCupPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/world-cup" element={<WorldCupPage />} />
        <Route path="/league/:id" element={<LeaguePage />} />
      </Routes>
    </Layout>
  );
}
