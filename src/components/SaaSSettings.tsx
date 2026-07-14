import React, { useState } from 'react';
import { SaaSBrandSettings } from '../types';
import { 
  Sparkles, 
  Layers, 
  Palette, 
  Globe, 
  CreditCard, 
  Check, 
  RotateCcw,
  ShieldAlert,
  Sliders,
  DollarSign,
  Briefcase,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface SaasSettingsProps {
  settings: SaaSBrandSettings;
  onSave: (newSettings: SaaSBrandSettings) => void;
}

export default function SaasSettings({ settings, onSave }: SaasSettingsProps) {
  const [localSettings, setLocalSettings] = useState<SaaSBrandSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [customDomain, setCustomDomain] = useState('tasks.mycompany.com');
  const [stripeConnected, setStripeConnected] = useState(false);

  const themePresets = [
    { id: 'indigo-purple', name: 'Indigo Dream (Default)', colors: 'from-indigo-500 to-purple-600', text: 'text-indigo-400' },
    { id: 'emerald-teal', name: 'Emerald Workspace', colors: 'from-emerald-400 to-teal-600', text: 'text-emerald-400' },
    { id: 'sunset-orange', name: 'Sunset Orange', colors: 'from-rose-500 to-amber-500', text: 'text-amber-400' },
    { id: 'cyberpunk-cyan', name: 'Cyberpunk Cyan', colors: 'from-cyan-400 to-blue-600', text: 'text-cyan-400' },
    { id: 'minimalist-slate', name: 'Minimalist Slate', colors: 'from-slate-400 to-slate-600', text: 'text-slate-300' },
  ] as const;

  const logoOptions = [
    { emoji: '🦾', name: 'Cybernetic Hand' },
    { emoji: '⚡', name: 'Lightning Bolt' },
    { emoji: '📊', name: 'Analytics Bar' },
    { emoji: '🚀', name: 'SaaS Rocket' },
    { emoji: '📂', name: 'Database Stack' },
    { emoji: '🛡️', name: 'Security Shield' },
    { emoji: '📈', name: 'Flowing Growth' },
    { emoji: '⚙️', name: 'Automation Gear' }
  ];

  const handleSave = () => {
    onSave(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults: SaaSBrandSettings = {
      appName: 'sheetflow.',
      appTagline: 'task engine',
      themePreset: 'indigo-purple',
      logoIcon: '🦾',
      loginGreeting: 'collaborative automation for high-throughput workspaces.',
      footerNotice: 'SHEETFLOW TASK MATRIX • AUTOMATIC GOOGLE WORKSPACE PROTOCOL',
      enablePublicSignups: true,
      pricingTierActive: 'enterprise'
    };
    setLocalSettings(defaults);
    onSave(defaults);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Get dynamic background gradient for preview
  const activePreset = themePresets.find(p => p.id === localSettings.themePreset) || themePresets[0];

  return (
    <div className="space-y-6">
      
      {/* Visual Live Branding Preview Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-tr ${activePreset.colors} rounded-full blur-[100px] opacity-15 pointer-events-none`}></div>
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white font-display">live brand mockup.</h3>
            <p className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-widest mt-0.5">real-time preview of your white-labeled application</p>
          </div>
          <span className="text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full uppercase">
            SaaS ACTIVE
          </span>
        </div>

        {/* Live App Header Preview Mockup */}
        <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4.5 shadow-inner">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className={`bg-gradient-to-tr ${activePreset.colors} text-white h-9 w-9 rounded-xl flex items-center justify-center font-bold shadow-md`}>
                <span className="text-base leading-none">{localSettings.logoIcon}</span>
              </div>
              <div>
                <h1 className="text-base font-display font-black tracking-tight text-white flex items-center gap-1.5 lowercase">
                  {localSettings.appName || 'sheetflow.'}
                </h1>
                <p className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  {localSettings.appTagline || 'task engine'}
                </p>
              </div>
            </div>

            {/* Navigation Simulator */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-white/5 p-1 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">
              <span className={`px-2.5 py-1 bg-white/10 text-white rounded-lg shadow-sm border border-white/10`}>my tasks</span>
              <span className="px-2.5 py-1">overdue 🚨</span>
              <span className="px-2.5 py-1">done ✅</span>
            </div>
          </div>
        </div>

        {/* Footer info preview */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
          <span>{localSettings.footerNotice || 'SHEETFLOW TASK MATRIX • AUTOMATIC PROTOCOL'}</span>
          <span>© 2026 SaaS Portal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Branding Panel */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-5 shadow-xl">
          <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
            <div className="bg-indigo-500/10 text-indigo-300 p-2 rounded-xl">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">tenant identity.</h3>
              <p className="text-[10px] text-slate-400 font-medium">Configure customized branding, layouts, and white-label text assets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* App Name */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                SaaS Brand Name
              </label>
              <input
                type="text"
                value={localSettings.appName}
                onChange={(e) => setLocalSettings({ ...localSettings, appName: e.target.value })}
                placeholder="e.g. sheetflow."
                className="w-full px-4 py-2.5 rounded-[16px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-semibold bg-black/20 text-white placeholder:text-slate-500"
              />
            </div>

            {/* App Tagline */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                Sub-header Tagline
              </label>
              <input
                type="text"
                value={localSettings.appTagline}
                onChange={(e) => setLocalSettings({ ...localSettings, appTagline: e.target.value })}
                placeholder="e.g. task engine"
                className="w-full px-4 py-2.5 rounded-[16px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-semibold bg-black/20 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Theme Gradient Presets */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-2 pl-1">
              Primary SaaS Color Palette
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setLocalSettings({ ...localSettings, themePreset: preset.id })}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    localSettings.themePreset === preset.id 
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_4px_12px_rgba(99,102,241,0.15)]' 
                      : 'border-white/5 bg-black/10 hover:border-white/10'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{preset.name}</p>
                    <div className={`h-1.5 w-12 bg-gradient-to-r ${preset.colors} rounded-full mt-1.5`}></div>
                  </div>
                  {localSettings.themePreset === preset.id && (
                    <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* App Logo / Icon Select */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-2 pl-1">
              Brand Logo Mark (Icon)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {logoOptions.map((opt) => (
                <button
                  key={opt.emoji}
                  title={opt.name}
                  onClick={() => setLocalSettings({ ...localSettings, logoIcon: opt.emoji })}
                  className={`h-11 rounded-xl border text-lg flex items-center justify-center transition-all cursor-pointer ${
                    localSettings.logoIcon === opt.emoji
                      ? 'border-indigo-500 bg-indigo-500/25 scale-105 shadow-md'
                      : 'border-white/5 bg-black/20 hover:bg-black/35 hover:border-white/10'
                  }`}
                >
                  <span>{opt.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Login Greeting */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                Custom Landing Page Slogan
              </label>
              <textarea
                value={localSettings.loginGreeting}
                onChange={(e) => setLocalSettings({ ...localSettings, loginGreeting: e.target.value })}
                placeholder="Custom message on login gate"
                rows={2}
                className="w-full px-4 py-2.5 rounded-[16px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-semibold bg-black/20 text-white placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Custom Footer Notice */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                Custom Footer Notice
              </label>
              <textarea
                value={localSettings.footerNotice}
                onChange={(e) => setLocalSettings({ ...localSettings, footerNotice: e.target.value })}
                placeholder="White-label copy at bottom"
                rows={2}
                className="w-full px-4 py-2.5 rounded-[16px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-semibold bg-black/20 text-white placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>

          {/* Toggle features */}
          <div className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setLocalSettings({ ...localSettings, enablePublicSignups: !localSettings.enablePublicSignups })}
                className="text-slate-400 hover:text-white transition-all focus:outline-none"
              >
                {localSettings.enablePublicSignups ? (
                  <ToggleRight className="h-7 w-7 text-indigo-400" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-600" />
                )}
              </button>
              <div>
                <p className="text-[11px] font-bold text-white leading-none">Enable Tenant Self-Service Registration</p>
                <p className="text-[9px] text-slate-400 mt-1">Allow customers to register their workspace databases on your landing page</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setStripeConnected(!stripeConnected)}
                className="text-slate-400 hover:text-white transition-all focus:outline-none"
              >
                {stripeConnected ? (
                  <ToggleRight className="h-7 w-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-600" />
                )}
              </button>
              <div>
                <p className="text-[11px] font-bold text-white leading-none">Stripe Subscription Metering</p>
                <p className="text-[9px] text-slate-400 mt-1">Require monthly stripe payment configuration to unlock admin command seats</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-white/5 pt-4.5 flex items-center justify-end space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300 animate-bounce" />
                  <span>Branding Applied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Save SaaS Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Multi-Tenant SaaS Hosting & Subscriptions Card */}
        <div className="space-y-6">
          {/* Custom domain white labeling */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4.5 shadow-xl">
            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
              <div className="bg-purple-500/10 text-purple-300 p-2 rounded-xl">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">SaaS custom domains.</h3>
                <p className="text-[10px] text-slate-400 font-medium">Point your tenant's custom URL routing to the cluster</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1.5 pl-1">
                White-label Custom Domain URL
              </label>
              <div className="flex rounded-xl bg-black/20 border border-white/10 overflow-hidden text-xs">
                <span className="bg-white/5 border-r border-white/5 px-3 py-2 text-slate-500 font-mono flex items-center select-none text-[10px]">
                  https://
                </span>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-white focus:outline-none font-semibold"
                />
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed pl-1">
                Configure your CNAME record to point to <code className="text-indigo-300 font-semibold font-mono">ingress.sheetflow.saas</code>. Our server automatically provisions Let's Encrypt SSL.
              </p>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3.5">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-indigo-300 leading-normal font-semibold">
                  <span>SSL State: Verified ✅</span>
                  <p className="text-[9px] text-indigo-400 mt-0.5 font-normal leading-relaxed">
                    Edge CDN nodes are active. Content is securely proxied through white-labeled network routes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing tier subscription simulations */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
              <div className="bg-emerald-500/10 text-emerald-300 p-2 rounded-xl">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">tenant monetization.</h3>
                <p className="text-[10px] text-slate-400 font-medium">Select tier to simulate limits & monthly recurring revenue (MRR)</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'free', name: 'Lite Starter Plan', price: '$0/mo', desc: 'Up to 2 departments, 25 tasks per sheet sync cycle.' },
                { id: 'growth', name: 'Professional Tier', price: '$49/mo', desc: 'Up to 10 departments, 500 tasks, standard analytics reports.' },
                { id: 'enterprise', name: 'Custom Enterprise Core', price: '$249/mo', desc: 'Unlimited workspace roster seats, custom branding & domain.' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setLocalSettings({ ...localSettings, pricingTierActive: tier.id as any })}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                    localSettings.pricingTierActive === tier.id 
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' 
                      : 'border-white/5 bg-black/20 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white">{tier.name}</span>
                      {localSettings.pricingTierActive === tier.id && (
                        <span className="text-[8px] bg-emerald-500 text-slate-950 font-black uppercase px-1.5 py-0.2 rounded-full font-mono">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-medium leading-snug">{tier.desc}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-400 whitespace-nowrap">{tier.price}</span>
                </button>
              ))}
            </div>

            {/* Simulated SaaS stats */}
            <div className="border-t border-white/5 pt-3.5 grid grid-cols-2 gap-3 text-center">
              <div className="bg-black/20 border border-white/5 rounded-2xl p-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Simulated MRR</span>
                <p className="text-sm font-black text-white mt-1">
                  {localSettings.pricingTierActive === 'free' ? '$1,420.00' : localSettings.pricingTierActive === 'growth' ? '$8,450.00' : '$24,900.00'}
                </p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-2xl p-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Active Tenants</span>
                <p className="text-sm font-black text-white mt-1">
                  {localSettings.pricingTierActive === 'free' ? '45 Workspaces' : localSettings.pricingTierActive === 'growth' ? '182 Companies' : '31 Enterprises'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
