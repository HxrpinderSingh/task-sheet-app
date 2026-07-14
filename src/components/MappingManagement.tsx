import React, { useState } from 'react';
import { DeptMapping } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  Save, 
  FileSpreadsheet, 
  ChevronRight, 
  Layers, 
  Radio 
} from 'lucide-react';

interface MappingManagementProps {
  mappings: DeptMapping[];
  onSaveMappings: (updatedMappings: DeptMapping[]) => Promise<void>;
  isUpdating: boolean;
}

export default function MappingManagement({
  mappings,
  onSaveMappings,
  isUpdating
}: MappingManagementProps) {
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editSources, setEditSources] = useState('');
  const [editModules, setEditModules] = useState('');

  const [newDeptName, setNewDeptName] = useState('');
  const [newSources, setNewSources] = useState('');
  const [newModules, setNewModules] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleStartEdit = (m: DeptMapping) => {
    setEditingDept(m.department);
    setEditSources(m.sources.join(', '));
    setEditModules(m.modules.join(', '));
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingDept(null);
    setEditSources('');
    setEditModules('');
  };

  const handleSaveEdit = async (m: DeptMapping) => {
    if (!editSources.trim()) {
      showFeedback('error', 'Sources list cannot be empty. Enter at least one option.');
      return;
    }
    if (!editModules.trim()) {
      showFeedback('error', 'Modules list cannot be empty. Enter at least one option.');
      return;
    }

    const parsedSources = editSources
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const parsedModules = editModules
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const updated = mappings.map(item => {
      if (item.department.toLowerCase() === m.department.toLowerCase()) {
        return {
          ...item,
          sources: parsedSources,
          modules: parsedModules
        };
      }
      return item;
    });

    try {
      await onSaveMappings(updated);
      setEditingDept(null);
      showFeedback('success', `Successfully updated mappings for ${m.department}!`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save mappings.');
    }
  };

  const handleAddNewMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      showFeedback('error', 'Department name is required.');
      return;
    }

    const deptNormal = newDeptName.trim();
    if (mappings.some(m => m.department.toLowerCase() === deptNormal.toLowerCase())) {
      showFeedback('error', `A mapping for department "${deptNormal}" already exists.`);
      return;
    }

    const parsedSources = newSources
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const parsedModules = newModules
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (parsedSources.length === 0) parsedSources.push('General');
    if (parsedModules.length === 0) parsedModules.push('General');

    const newMapping: DeptMapping = {
      department: deptNormal,
      sources: parsedSources,
      modules: parsedModules
    };

    const updated = [...mappings, newMapping];

    try {
      await onSaveMappings(updated);
      setNewDeptName('');
      setNewSources('');
      setNewModules('');
      showFeedback('success', `Created mapping schema for "${deptNormal}"!`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to add mapping schema.');
    }
  };

  const handleDeleteMapping = async (deptName: string) => {
    if (window.confirm(`Are you sure you want to delete the mapping schema for "${deptName}"?\nThis will remove the filtered list options during task creation.`)) {
      const updated = mappings.filter(m => m.department !== deptName);
      try {
        await onSaveMappings(updated);
        showFeedback('success', `Mapping for "${deptName}" removed successfully.`);
      } catch (err: any) {
        showFeedback('error', err.message || 'Failed to delete mapping.');
      }
    }
  };

  return (
    <div id="mapping_management_panel" className="space-y-6 text-xs">
      {/* Overview Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex items-start space-x-3 backdrop-blur-md">
        <Layers className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Dynamic Field Mappings & Associations</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Define mappings that auto-filter dropdowns when creating/updating tasks. When a user selects a mapped Department, the form dynamically constrains the Source and Module options to the mapped items. <strong className="text-amber-400">Strict Validation Rule:</strong> A built-in validation check prevents saving a task if the chosen Source/Module combination is not explicitly mapped to the chosen Department.
          </p>
        </div>
      </div>

      {/* Alert feedback banners */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl flex items-start space-x-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-xl flex items-start space-x-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-400" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mappings List Container (Cols: 2) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="font-mono font-bold uppercase tracking-wider text-slate-400">Current Map Schemas ({mappings.length})</h4>
            {isUpdating && <span className="text-indigo-400 text-[10px] animate-pulse font-medium">Writing to Spreadsheet...</span>}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {mappings.map((m) => {
              const isEditing = editingDept === m.department;

              return (
                <div 
                  key={m.department} 
                  className={`bg-[#0f172a]/70 border rounded-2xl p-4 transition-all ${
                    isEditing ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                        <span>{m.department}</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-tight">
                        Department Domain
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(m)}
                            disabled={isUpdating}
                            className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-all cursor-pointer"
                            title="Apply Changes"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                            title="Discard Edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                            title="Edit Mapping"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMapping(m.department)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                            title="Delete Mapping"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
                          Mapped Sources (Comma Separated)
                        </label>
                        <input
                          type="text"
                          value={editSources}
                          onChange={(e) => setEditSources(e.target.value)}
                          placeholder="ATS, Linkedin, HRMS"
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0f172a] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
                          Mapped Modules (Comma Separated)
                        </label>
                        <input
                          type="text"
                          value={editModules}
                          onChange={(e) => setEditModules(e.target.value)}
                          placeholder="Dashboard, Employee, Recruitment"
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0f172a] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-[11px] leading-relaxed">
                      <div>
                        <span className="block text-slate-500 font-bold font-mono text-[9px] uppercase tracking-wider mb-1">Allowed Sources</span>
                        <div className="flex flex-wrap gap-1">
                          {m.sources.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300 font-medium text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-slate-500 font-bold font-mono text-[9px] uppercase tracking-wider mb-1">Allowed Modules</span>
                        <div className="flex flex-wrap gap-1">
                          {m.modules.map(mod => (
                            <span key={mod} className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium text-[10px]">
                              {mod}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Mapping Form Container */}
        <div className="space-y-3">
          <h4 className="font-mono font-bold uppercase tracking-wider text-slate-400 px-1">Configure New Domain Map</h4>
          <form onSubmit={handleAddNewMapping} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-md">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Department Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="mapping_form_dept_name"
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Operations, Marketing, Product"
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold"
                disabled={isUpdating}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Allowed Sources <span className="text-slate-500">(comma-separated)</span>
              </label>
              <textarea
                id="mapping_form_sources"
                value={newSources}
                onChange={(e) => setNewSources(e.target.value)}
                placeholder="e.g. LinkedIn, Reach, ATS, HRMS"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold resize-none"
                disabled={isUpdating}
              />
              <p className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
                Enter multiple source values separated by commas.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Allowed Modules <span className="text-slate-500">(comma-separated)</span>
              </label>
              <textarea
                id="mapping_form_modules"
                value={newModules}
                onChange={(e) => setNewModules(e.target.value)}
                placeholder="e.g. Dashboard, Employee, Settings"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold resize-none"
                disabled={isUpdating}
              />
              <p className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
                Enter multiple module names separated by commas.
              </p>
            </div>

            <button
              id="mapping_form_submit_btn"
              type="submit"
              disabled={isUpdating || !newDeptName.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{isUpdating ? 'Synchronizing...' : 'Save Mapping Schema'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
