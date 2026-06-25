import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FolderOpen, MessageSquareText, Sparkles, ClipboardList,
  NotebookPen, Layers, CalendarRange, LogOut, Brain
} from "lucide-react";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true, testid: "nav-dashboard" },
  { to: "/app/materials", icon: FolderOpen, label: "Materials", testid: "nav-materials" },
  { to: "/app/chat", icon: MessageSquareText, label: "Chat", testid: "nav-chat" },
  { to: "/app/questions", icon: Sparkles, label: "AI Questions", testid: "nav-questions" },
  { to: "/app/tests", icon: ClipboardList, label: "Tests & Mocks", testid: "nav-tests" },
  { to: "/app/notes", icon: NotebookPen, label: "Notes", testid: "nav-notes" },
  { to: "/app/flashcards", icon: Layers, label: "Flashcards", testid: "nav-flashcards" },
  { to: "/app/planner", icon: CalendarRange, label: "Revision Plan", testid: "nav-planner" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-border">
          <Link to="/app" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="size-9 rounded-md bg-slate-900 dark:bg-slate-50 flex items-center justify-center">
              <Brain className="size-5 text-orange-500" />
            </div>
            <div>
              <div className="font-heading font-bold text-lg leading-tight">PrepMind</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">AI · {user?.target_exam}</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end, testid }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground truncate">{user?.name}</div>
            <div className="truncate">{user?.email}</div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={logout}
            data-testid="logout-btn"
          >
            <LogOut className="size-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 glass-nav bg-white/80 dark:bg-slate-900/80 border-b border-border h-14 flex items-center justify-between px-4">
        <Link to="/app" className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-slate-900 dark:bg-slate-50 flex items-center justify-center">
            <Brain className="size-4 text-orange-500" />
          </div>
          <span className="font-heading font-bold">PrepMind</span>
        </Link>
        <Button size="sm" variant="ghost" onClick={logout} data-testid="logout-btn-mobile">
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto fade-in">
          {children || <Outlet />}
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-border flex justify-around py-2">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label, end, testid }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`${testid}-mobile`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                  isActive ? "text-orange-600" : "text-slate-500"
                }`
              }
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
}
