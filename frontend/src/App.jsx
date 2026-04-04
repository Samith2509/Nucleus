import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FeatureAnalyticsPage from './pages/FeatureAnalyticsPage';
import JourneyAnalyticsPage from './pages/JourneyAnalyticsPage';
import JourneyBuilderPage from './pages/JourneyBuilderPage';
import CustomerAnalyticsPage from './pages/CustomerAnalyticsPage';
import LicenseInsightsPage from './pages/LicenseInsightsPage';
import PredictionsPage from './pages/PredictionsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/feature-analytics" element={<FeatureAnalyticsPage />} />
        <Route path="/journey-analytics" element={<JourneyAnalyticsPage />} />
        <Route path="/journey-builder" element={<JourneyBuilderPage />} />
        <Route path="/customers" element={<CustomerAnalyticsPage />} />
        <Route path="/license-insights" element={<LicenseInsightsPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
