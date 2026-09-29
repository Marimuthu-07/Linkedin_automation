import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { NetworkingPage } from './pages/NetworkingPage.js';
import { ContentPage } from './pages/ContentPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { LeadsPage } from './pages/LeadsPage.js';
import { InternshipsPage } from './pages/InternshipsPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="networking" element={<NetworkingPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="internships" element={<InternshipsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
