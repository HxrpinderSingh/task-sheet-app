import { Task } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart2, 
  CheckSquare, 
  Clock, 
  FileSpreadsheet, 
  TrendingUp,
  Briefcase,
  Activity
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
}

export default function AnalyticsView({ tasks }: AnalyticsViewProps) {
  // 1. Core aggregates
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const overdueCount = tasks.filter(t => {
    const isOverdue = new Date(t.dueDate) < new Date() && t.status === 'Pending';
    return isOverdue;
  }).length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 2. Department/Source breakdown
  const sources: string[] = ['HRMS', 'ATS', 'Strategy', 'Management', 'Personal'];
  const departmentData = sources.map(source => {
    const deptTasks = tasks.filter(t => t.source === source);
    const completed = deptTasks.filter(t => t.status === 'Completed').length;
    const pending = deptTasks.filter(t => t.status === 'Pending').length;
    const overdue = deptTasks.filter(t => new Date(t.dueDate) < new Date() && t.status === 'Pending').length;
    
    return {
      name: source,
      Completed: completed,
      Pending: pending,
      Overdue: overdue,
      Total: deptTasks.length
    };
  });

  // 3. Pie Chart source distribution data
  const COLORS = ['#6366f1', '#14b8a6', '#a855f7', '#3b82f6', '#ec4899']; // Indigo, Teal, Purple, Blue, Pink
  const pieData = departmentData
    .filter(d => d.Total > 0)
    .map((d, index) => ({
      name: d.name,
      value: d.Total,
      color: COLORS[index % COLORS.length]
    }));

  // 4. Priority breakdown data
  const priorityLevels = ['High', 'Medium', 'Low'];
  const priorityData = priorityLevels.map(p => {
    const matching = tasks.filter(t => t.priority === p);
    return {
      name: `${p} Priority`,
      count: matching.length,
      Completed: matching.filter(t => t.status === 'Completed').length,
      Pending: matching.filter(t => t.status === 'Pending').length,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Visual KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Tasks Card */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg flex items-center space-x-4 backdrop-blur-md">
          <div className="bg-indigo-500/20 text-indigo-300 p-3 rounded-xl border border-indigo-500/20 shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Total Pool</p>
            <p className="text-xl font-display font-bold text-white">{totalCount}</p>
            <span className="text-[9px] text-slate-400 font-medium">Tasks in Sheets</span>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg flex items-center space-x-4 backdrop-blur-md">
          <div className="bg-emerald-500/20 text-emerald-300 p-3 rounded-xl border border-emerald-500/20 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Completion Rate</p>
            <p className="text-xl font-display font-bold text-white">{completionRate}%</p>
            <div className="w-20 bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Pending Active Card */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg flex items-center space-x-4 backdrop-blur-md">
          <div className="bg-sky-500/20 text-sky-300 p-3 rounded-xl border border-sky-500/20 shrink-0">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Pending Active</p>
            <p className="text-xl font-display font-bold text-white">{pendingCount}</p>
            <span className="text-[9px] text-slate-400 font-medium">{completedCount} Completed</span>
          </div>
        </div>

        {/* Overdue Urgent Card */}
        <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl shadow-lg flex items-center space-x-4 backdrop-blur-md">
          <div className="bg-rose-500/20 text-rose-300 p-3 rounded-xl border border-rose-500/20 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-semibold">Overdue Tasks</p>
            <p className="text-xl font-display font-bold text-rose-300">{overdueCount}</p>
            <span className="text-[9px] text-rose-400/80 font-medium">Requires follow-up</span>
          </div>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Bar Chart Department Breakdowns (takes 7 cols) */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg lg:col-span-7 flex flex-col justify-between backdrop-blur-md text-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <BarChart2 className="h-4 w-4 text-slate-300" />
              <h3 className="text-sm font-semibold text-white">Department Status Comparison</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Real-time synchronization breakdown across HRMS, ATS, Strategy, and Personal streams.
            </p>
          </div>

          <div className="h-[260px] w-full text-[10px] font-semibold">
            {totalCount === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic font-normal">
                No departmental tasks found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f1f5f9', fontFamily: 'Inter' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Pending" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Side: Pie Chart Source Share (takes 5 cols) */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg lg:col-span-5 flex flex-col justify-between backdrop-blur-md text-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Briefcase className="h-4 w-4 text-slate-300" />
              <h3 className="text-sm font-semibold text-white">Task Source Distribution</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Percentage split of all entries logged across your Google Sheet backend.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="h-[180px] w-[180px] shrink-0 text-[10px]">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 italic font-normal">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f1f5f9', fontFamily: 'Inter' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Custom Legend */}
            <div className="space-y-2 flex-1">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-mono text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Priority Analytics Strip */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg backdrop-blur-md text-slate-100">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-4 w-4 text-slate-300" />
          <h3 className="text-sm font-semibold text-white">Priority Pool Breakdowns</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityData.map((item) => {
            const ratio = item.count > 0 ? Math.round((item.Completed / item.count) * 100) : 0;
            return (
              <div key={item.name} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{item.count} Tasks</span>
                </div>
                
                <div className="flex items-center justify-between text-[11px] mb-2 text-slate-400">
                  <span>Completion Rate</span>
                  <span className="font-semibold text-indigo-300">{ratio}%</span>
                </div>

                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${ratio}%` }}></div>
                  <div className="bg-sky-400 h-full" style={{ width: `${100 - ratio}%` }}></div>
                </div>
                
                <div className="flex items-center space-x-3 mt-3 text-[10px] text-slate-300">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{item.Completed} Completed</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    <span>{item.Pending} Pending</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
