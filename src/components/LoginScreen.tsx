import { useState, FormEvent } from 'react';
import { 
  Database, 
  ShieldCheck, 
  FileSpreadsheet,
  Users,
  Mail,
  Lock,
  LogIn,
  KeyRound
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onCustomLogin: (email: string, password: string) => Promise<boolean>;
  isLoggingIn: boolean;
  error: string | null;
}

export default function LoginScreen({ 
  onLogin, 
  onCustomLogin, 
  isLoggingIn, 
  error 
}: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'credentials'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customLoginError, setCustomLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCustomLoginError(null);

    const formattedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!formattedEmail || !cleanPassword) {
      setCustomLoginError('Both email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onCustomLogin(formattedEmail, cleanPassword);
      if (!success) {
        setCustomLoginError('Account not found or password incorrect. Contact your admin.');
      }
    } catch (err: any) {
      setCustomLoginError(err.message || 'An error occurred during sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      
      {/* Dynamic Backlight Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      
      {/* Main Container Card (iOS-style glass + heavy rounded corner) */}
      <div className="max-w-md w-full mx-auto space-y-7 bg-slate-900/40 backdrop-blur-3xl p-8 sm:p-10 rounded-[28px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] transition-all relative z-10 text-slate-100">
        
        {/* Clean Professional Header */}
        <div className="text-center relative">
          <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.4)] transition-all duration-300">
            <Database className="h-6 w-6" />
          </div>
          
          <h2 className="mt-6 text-3xl font-display font-black tracking-tight text-white">
            Task Manager
          </h2>
          
          <p className="mt-2 text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            Role-based task tracking with real-time <span className="text-emerald-400 font-bold bg-emerald-400/5 px-1.5 py-0.5 rounded-md border border-emerald-500/10">Google Sheets</span> sync
          </p>
        </div>

        {/* Tab Toggle - iOS Segmented Control */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 border border-white/5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setCustomLoginError(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'google'
                ? 'bg-white/10 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Google Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              setCustomLoginError(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white/10 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Team Login</span>
          </button>
        </div>

        {/* Auth Error Banner */}
        {(error || customLoginError) && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-2xl text-xs flex items-start space-x-2">
            <span className="font-semibold shrink-0">💀</span>
            <span className="font-medium leading-relaxed">{error || customLoginError}</span>
          </div>
        )}

        {/* Dynamic Tab View Content */}
        {activeTab === 'google' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl border border-white/5 bg-white/2">
                <div className="bg-emerald-500/10 text-emerald-300 p-2.5 rounded-xl shrink-0 border border-emerald-500/10">
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">sheets as your DB</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    realtime bidirectional sync. update columns directly in sheets and watch it stream!
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl border border-white/5 bg-white/2">
                <div className="bg-indigo-500/10 text-indigo-300 p-2.5 rounded-xl shrink-0 border border-indigo-500/10">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">role permissions locked 🔒</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    automatic partition limits. employees, managers, and admins only see what they own.
                  </p>
                </div>
              </div>
            </div>

            {/* iOS Styled Google Login Button */}
            <button
              id="google-signin-btn"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-3 border border-white/10 rounded-2xl bg-white/10 px-5 py-3.5 hover:bg-white/15 active:scale-[0.98] transition-all cursor-pointer shadow-lg font-bold text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent"></div>
                  <span className="text-[11px] font-mono text-slate-300">AUTHORIZING ACCESS...</span>
                </div>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google Account</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4.5 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                team email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/5 bg-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/50 text-xs font-semibold text-white placeholder:text-slate-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                secure key / password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/5 bg-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/50 text-xs font-semibold text-white placeholder:text-slate-500 font-mono transition-all"
                  required
                />
              </div>
            </div>

            {/* Custom Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-[0_8px_24px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{isSubmitting ? 'VERIFYING...' : 'SIGN IN TO PORTAL'}</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
            🛡️ secure database • encrypted portal
          </p>
        </div>

      </div>
    </div>
  );
}
