import { Suspense, lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Loading from './pages/Loading';
import Welcome from './pages/Welcome';
import Goal from './pages/Goal';
import Frequency from './pages/Frequency';
import Schedule from './pages/Schedule';
import Username from './pages/Username';
import Workouts from './pages/Workouts';
import Models from './pages/Models';

// Heavy routes (Leaflet maps, MediaPipe pose, marketing page) load on demand
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Verify = lazy(() => import('./pages/Verify'));
const Website = lazy(() => import('./pages/Website'));

function Fallback() {
  return (
    <div className="fox-stage flex items-center justify-center">
      <img src="./foxit-logo.png" alt="Foxit loading" className="h-20 w-20 animate-pulse object-contain" />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/goal" element={<Goal />} />
        <Route path="/frequency" element={<Frequency />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/username" element={<Username />} />
        <Route path="/dashboard" element={<Suspense fallback={<Fallback />}><Dashboard /></Suspense>} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/verify" element={<Suspense fallback={<Fallback />}><Verify /></Suspense>} />
        <Route path="/models" element={<Models />} />
        <Route path="/site" element={<Suspense fallback={<Fallback />}><Website /></Suspense>} />
      </Routes>
    </HashRouter>
  );
}
