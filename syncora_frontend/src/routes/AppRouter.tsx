import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import ChatPage from '../pages/ChatPage';
import NotesPage from '../pages/NotesPage';
import TasksPage from '../pages/TasksPage';
import CollabPage from '../pages/CollabPage';
import ContactsPage from '../pages/ContactsPage';
import Dashboard from '../pages/Dashboard';

const AppRouter = () => {
  return (
    <HistoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }} history={undefined}    >
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/collab" element={<CollabPage />} />
      </Routes>
    </HistoryRouter>
  );
};

export default AppRouter;

