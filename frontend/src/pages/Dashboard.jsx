import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from "recharts";
import { Flame, BookOpen, ClipboardList, NotebookPen, TrendingUp, TrendingDown, ArrowRight, Upload, Sparkles } from "lucide-react";

const Stat = ({ icon: Icon, label, value, hint, color = "text-orange-600", testid }) => (
  <Card className="p-5 border-border" data-testid={testid}>
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">{label}</div>
      <Icon className={`size-5 ${color}`} />
    </div>
    <div className="text-3xl font-bold font-heading mt-3">{value}</div>
    {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/dashboard").then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );
  }

  const s = data?.stats || {};
  const recent = data?.recent_tests || [];
  const subjAcc = data?.subject_accuracy || [];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="bg-slate-900 dark:bg-card text-white rounded-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold">Welcome back</div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading mt-2">{data?.user?.name}</h1>
          <p className="text-slate-300 mt-1 text-sm">Targeting: <span className="font-semibold text-white">{data?.user?.target_exam}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/materials"><Button className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="dash-upload-btn"><Upload className="size-4 mr-2" />Upload material</Button></Link>
          <Link to="/app/tests"><Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" data-testid="dash-mock-btn"><Sparkles className="size-4 mr-2" />Start mock test</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat icon={BookOpen} label="Materials" value={s.materials || 0} color="text-slate-700 dark:text-slate-300" testid="stat-materials" />
        <Stat icon={ClipboardList} label="Tests" value={s.tests_taken || 0} color="text-slate-700 dark:text-slate-300" testid="stat-tests" />
        <Stat icon={NotebookPen} label="Notes" value={s.notes_generated || 0} color="text-slate-700 dark:text-slate-300" testid="stat-notes" />
        <Stat icon={TrendingUp} label="Avg score" value={`${s.avg_score || 0}%`} testid="stat-avg-score" />
        <Stat icon={TrendingUp} label="Accuracy" value={`${s.avg_accuracy || 0}%`} color="text-emerald-600" testid="stat-accuracy" />
        <Stat icon={Flame} label="Streak" value={`${s.study_streak || 0}d`} color="text-orange-600" testid="stat-streak" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent tests chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg">Recent test scores</h3>
              <p className="text-xs text-muted-foreground">Last 10 attempts (% score)</p>
            </div>
            <Link to="/app/tests"><Button size="sm" variant="ghost" data-testid="dash-view-tests">View all <ArrowRight className="size-3 ml-1" /></Button></Link>
          </div>
          {recent.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground">
              <ClipboardList className="size-10 mb-2 opacity-50" />
              <p className="text-sm">No tests yet. Take your first mock test.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={recent}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} hide />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#EA580C" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#15803D" strokeWidth={2} dot={{ r: 3 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Weak / Strong */}
        <Card className="p-6">
          <h3 className="font-heading font-semibold text-lg mb-4">Focus areas</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-red-600 mb-2"><TrendingDown className="size-4" /> Weak topics</div>
              {data?.weak_topics?.length ? data.weak_topics.map(t => (
                <div key={t.subject} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span>{t.subject}</span>
                  <span className="font-semibold text-red-600">{t.accuracy}%</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Take tests to identify weak areas.</p>}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-emerald-600 mb-2"><TrendingUp className="size-4" /> Strong topics</div>
              {data?.strong_topics?.length ? data.strong_topics.map(t => (
                <div key={t.subject} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span>{t.subject}</span>
                  <span className="font-semibold text-emerald-600">{t.accuracy}%</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">No data yet.</p>}
            </div>
          </div>
        </Card>
      </div>

      {/* Subject accuracy */}
      {subjAcc.length > 0 && (
        <Card className="p-6">
          <h3 className="font-heading font-semibold text-lg mb-4">Subject accuracy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjAcc}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#EA580C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
