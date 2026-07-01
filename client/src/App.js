import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CoachDashboard from './pages/CoachDashboard';
import ClientDetail from './pages/ClientDetail';
import ClientHome from './pages/ClientHome';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      
      <Route path="/coach" element={
        <ProtectedRoute allowedRole="coach">
          <CoachDashboard />
        </ProtectedRoute>
      } />

      <Route path="/client" element={
        <ProtectedRoute allowedRole="client">
          <ClientHome />
        </ProtectedRoute>
      } />
      <Route path="client/:id" element = {<ClientDetail/>}/>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;