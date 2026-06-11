import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LeaguePage from './pages/LeaguePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/league/:id" element={<LeaguePage />} />
      </Routes>
    </Layout>
  );
}
