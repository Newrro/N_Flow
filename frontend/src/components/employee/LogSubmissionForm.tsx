'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { submitWorkLog, getAssignedTasks } from '@/app/employee/actions/logs';
import { useSearchParams } from 'next/navigation';

interface LogSubmissionFormProps {
  onSuccess?: () => void;
}

export default function LogSubmissionForm({ onSuccess }: LogSubmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    task_id: '',
    start_time: '',
    end_time: '',
    description: '',
  });

  const searchParams = useSearchParams();
  const taskParam = searchParams.get('task');

  useEffect(() => {
    getAssignedTasks().then((fetchedTasks) => {
      setTasks(fetchedTasks);
      if (taskParam) {
        setFormData((prev) => ({
          ...prev,
          task_id: taskParam
        }));
      }
    }).catch(console.error);
  }, [taskParam]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const generateHash = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please upload proof of work');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const hash = await generateHash(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logs')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      await submitWorkLog({ ...formData, proof_url: uploadData.path, file_hash: hash });

      alert('Work log submitted successfully!');
      setFile(null);
      setFormData({ task_id: '', start_time: '', end_time: '', description: '' });
      onSuccess?.();
    } catch (error: any) {
      alert(error.message || 'Failed to submit log');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'dark-input w-full py-3 px-4 text-sm';
  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)] mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Task select */}
      <div>
        <label className={labelClass}>Mission Objective</label>
        <select
          required
          className={fieldClass + ' appearance-none'}
          value={formData.task_id}
          onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
        >
          <option value="">Select an active assignment</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
      </div>

      {/* Time range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start time</label>
          <input
            required
            type="datetime-local"
            className={fieldClass}
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>End time</label>
          <input
            required
            type="datetime-local"
            className={fieldClass}
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Work Narrative</label>
        <textarea
          required
          placeholder="Detail your accomplishments during this window..."
          className={fieldClass + ' min-h-[120px] resize-none'}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* File upload */}
      <div>
        <label className={labelClass}>Evidence of Impact (Image / PDF)</label>
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${file
              ? 'border-[rgba(99,102,241,0.4)] bg-[var(--brand-primary-dim)]'
              : 'border-[var(--surface-border)] hover:border-[rgba(99,102,241,0.3)] bg-[var(--surface-2)]'
            }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-[var(--brand-primary)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">{file.name}</p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex items-center gap-1 text-xs text-[var(--foreground-subtle)] hover:text-[var(--status-danger)] transition-colors"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--brand-primary)]">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Click to upload</p>
                <p className="text-xs text-[var(--foreground-subtle)]">Max 10MB — image or PDF</p>
              </div>
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Commit Record
          </>
        )}
      </button>
    </form>
  );
}