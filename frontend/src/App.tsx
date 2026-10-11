import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import CreateHuntPage from './pages/CreateHuntPage';
import HuntPreviewPage from './pages/HuntPreviewPage';
import PlayHuntPage from './pages/PlayHuntPage';
import ResultsPage from './pages/ResultsPage';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(() => {
    try {
      const saved = localStorage.getItem('questforge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('questforge_user', JSON.stringify(user));
    }
  }, [user]);

  return (
    <BrowserRouter>
      <AppShell user={user} setUser={setUser}>
        <Routes>
          <Route path="/" element={<LandingPage user={user} setUser={setUser} />} />
          <Route path="/create" element={<CreateHuntPage />} />
          <Route path="/preview/:huntId" element={<HuntPreviewPage user={user} />} />
          <Route path="/play/:sessionId" element={<PlayHuntPage />} />
          <Route path="/results/:sessionId" element={<ResultsPage />} />
          <Route path="/analysis/:huntId" element={<AnalysisPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
