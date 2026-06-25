import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import ChatPage from "@/pages/ChatPage";
import QuestionGen from "@/pages/QuestionGen";
import TestsSetup from "@/pages/TestsSetup";
import TestEngine from "@/pages/TestEngine";
import TestResult from "@/pages/TestResult";
import NotesPage from "@/pages/NotesPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import PlannerPage from "@/pages/PlannerPage";
import AppShell from "@/components/AppShell";

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          <Route element={<Protected><AppShell /></Protected>}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/materials" element={<Materials />} />
            <Route path="/app/chat/:materialId?" element={<ChatPage />} />
            <Route path="/app/questions" element={<QuestionGen />} />
            <Route path="/app/tests" element={<TestsSetup />} />
            <Route path="/app/notes" element={<NotesPage />} />
            <Route path="/app/flashcards" element={<FlashcardsPage />} />
            <Route path="/app/planner" element={<PlannerPage />} />
          </Route>

          {/* Test engine fullscreen (no shell) */}
          <Route path="/app/test/:testId" element={<Protected><TestEngine /></Protected>} />
          <Route path="/app/result/:resultId" element={<Protected><AppShell><TestResult /></AppShell></Protected>} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
