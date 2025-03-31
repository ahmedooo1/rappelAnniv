
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Home from './pages/home';
import { GroupPage } from './pages/group-page';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/group/:id" element={<GroupPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
