import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home'; import Events from './pages/Events'; import EventDetails from './pages/EventDetails'; import Clubs from './pages/Clubs'; import ClubDetails from './pages/ClubDetails'; import CreateClub from './pages/CreateClub'; import Calendar from './pages/Calendar'; import About from './pages/About'; import Login from './pages/Login'; import Register from './pages/Register'; import HandleEvent from './pages/HandleEvent'; import PortalEntry from './pages/PortalEntry'; import Dashboard from './pages/Dashboard'; import AdminDashboard from './pages/AdminDashboard'; import Profile from './pages/Profile'; import StudentDashboard from './pages/StudentDashboard'; import AuthCallback from './pages/AuthCallback'; import ProtectedRoute from './components/ProtectedRoute';

export default function App(){return <Routes>
  <Route path="/" element={<Home/>}/><Route path="/events" element={<Events/>}/><Route path="/events/:id" element={<EventDetails/>}/><Route path="/clubs" element={<Clubs/>}/><Route path="/clubs/:id" element={<ClubDetails/>}/><Route path="/clubs/create" element={<ProtectedRoute><CreateClub/></ProtectedRoute>}/><Route path="/clubs/:id/edit" element={<ProtectedRoute><CreateClub/></ProtectedRoute>}/><Route path="/calendar" element={<Calendar/>}/><Route path="/about" element={<About/>}/><Route path="/login" element={<Login/>}/><Route path="/auth/callback" element={<AuthCallback/>}/><Route path="/register" element={<Register/>}/><Route path="/handle-event" element={<HandleEvent/>}/><Route path="/handle-event/:role" element={<PortalEntry/>}/>
  <Route path="/dashboard" element={<Navigate to="/organizer/dashboard" replace/>}/>
  <Route path="/student/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard/></ProtectedRoute>}/>
  <Route path="/organizer/dashboard" element={<ProtectedRoute roles={['organizer']}><Dashboard/></ProtectedRoute>}/>
  <Route path="/organizer/create-event" element={<ProtectedRoute roles={['organizer']}><Dashboard/></ProtectedRoute>}/>
  <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard/></ProtectedRoute>}/>
  <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>}
