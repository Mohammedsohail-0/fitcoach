import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CoachDashboard from './pages/CoachDashboard';
import ClientDetail from './pages/ClientDetail';
import ClientHome from './pages/ClientHome';
import CreatePlanPage from './pages/CreatePlan';
import EditPlanPage from './pages/EditPlan';
import TemplateList from './pages/TemplateList';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
    <ToastContainer position="top-right" autoClose={4000} />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />


      <Route path="/coach" element={
        <ProtectedRoute allowedRole="coach">
          <Layout><CoachDashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/client" element={
        <ProtectedRoute allowedRole="client">
          <Layout><ClientHome /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/client/:id" element={
        <ProtectedRoute allowedRole="coach">
          <Layout><ClientDetail /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/client/:clientId/plan/create" element={
        <ProtectedRoute allowedRole="coach">
          <CreatePlanPage />
        </ProtectedRoute> 
      }/>
      <Route path="/client/:clientId/plan/:planId/edit" element={
        <ProtectedRoute allowedRole="coach">
          <EditPlanPage />
        </ProtectedRoute>
      }/>
      <Route path="/coach/templates/:planId/edit" element={
        <ProtectedRoute allowedRole="coach">
          <EditPlanPage />
        </ProtectedRoute>
      }/>
      <Route path="/coach/templates" element={
        <ProtectedRoute allowedRole="coach">
          <Layout><TemplateList /></Layout>
        </ProtectedRoute>
      }/>
      <Route path="/coach/templates/create" element={
        <ProtectedRoute allowedRole="coach">
          <CreatePlanPage />
        </ProtectedRoute>
      }/>
        <Route path="*" element={<NotFound />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;