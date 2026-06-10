'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getDocuments, deleteDocument } from '@/app/shared/actions/documents';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, X, Search, File, Image, Film, FileText, Download, Trash2, 
  Loader2, Calendar, User, ChevronDown, ChevronUp, CheckCircle, HardDrive,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCenterProps {
  role: 'admin' | 'employee';
}

function getFileIcon(type: string, name: string) {
  const t = type.toLowerCase();
  const n = name.toLowerCase();
  if (t.includes('image') || n.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
    return <Image className="h-5 w-5 text-pink-500" />;
  }
  if (t.includes('video') || n.match(/\.(mp4|mov|avi)$/i)) {
    return <Film className="h-5 w-5 text-blue-500" />;
  }
  if (t.includes('pdf') || n.endsWith('.pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-gray-400" />;
}

export function DocumentCenter({ role }: DocumentCenterProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error('Error fetching logs for Document Center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter documents by search query
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.task_title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [documents, searchQuery]);

  // Group filtered documents by Project and then by Task
  const groupedStructure = useMemo(() => {
    const projGroups: Record<string, {
      name: string;
      tasks: Record<string, {
        title: string;
        docs: any[];
      }>;
      totalFiles: number;
    }> = {};

    filteredDocs.forEach((doc) => {
      const pid = doc.project_id || 'none';
      const pname = doc.project_name || 'Individual Initiatives';
      const tid = doc.task_id || 'none';
      const ttitle = doc.task_title || 'General Initiative';

      if (!projGroups[pid]) {
        projGroups[pid] = { name: pname, tasks: {}, totalFiles: 0 };
      }

      if (!projGroups[pid].tasks[tid]) {
        projGroups[pid].tasks[tid] = { title: ttitle, docs: [] };
      }

      projGroups[pid].tasks[tid].docs.push(doc);
      projGroups[pid].totalFiles += 1;
    });

    return projGroups;
  }, [filteredDocs]);

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Are you certain you wish to purge this proof document from the database and storage?')) return;
    try {
      const res = await deleteDocument(id, fileUrl);
      if (res?.error) {
        alert(`Deletion failed: ${res.error}`);
      } else {
        fetchDocs();
      }
    } catch (err: any) {
      alert(`Deletion error: ${err.message || err}`);
    }
  };

  const handleDownload = async (fileUrl: string, name: string) => {
    try {
      console.log(`Downloading proof file from logs bucket: ${fileUrl}`);
      const { data, error } = await supabase.storage
        .from('logs') // Proof files are stored in the logs bucket
        .download(fileUrl);

      if (error) throw error;

      const blobUrl = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Failed to retrieve file from logs vault.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Header card */}
      <div className="dark-card p-6 border-emerald-500/10 bg-emerald-500/5 shadow-[0_4px_24px_rgba(16,185,129,0.05)]">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Synchronized Deliverable Proof Center
        </h3>
        <p className="mt-2 text-xs text-[var(--foreground-muted)] leading-relaxed">
          Files and media assets shown below are automatically populated from logs uploaded by employees during task completion. 
          Only admins and employees assigned to the respective projects have authorization to view and download these proofs.
        </p>
      </div>

      {/* Vault Toolbar */}
      <div className="dark-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
          <input
            type="search"
            placeholder="Search documents or tasks..."
            className="dark-input w-full py-2.5 pl-10 pr-4 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] border border-[var(--surface-border)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground-subtle)]">
          <HardDrive className="h-4 w-4 text-[var(--brand-primary)]" />
          <span>Active Registry: {filteredDocs.length} Deployed Proofs</span>
        </div>
      </div>

      {/* Scrollable Project Folders */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface-1)] border border-[var(--surface-border)]" />
          ))}
        </div>
      ) : Object.keys(groupedStructure).length === 0 ? (
        <div className="dark-card py-16 text-center">
          <Folder className="h-10 w-10 text-[var(--foreground-subtle)] mx-auto mb-4 opacity-55" />
          <h4 className="font-bold text-[var(--foreground)]">No Proof Deliverables Found</h4>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">No uploaded proof documents match your access credentials or search parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedStructure).map(([pid, proj]) => {
            const isExpanded = !!expandedProjects[pid];

            return (
              <div 
                key={pid}
                className={cn(
                  "dark-card overflow-hidden transition-all duration-300 bg-[var(--surface-1)]/45",
                  isExpanded ? "border-[var(--brand-primary)] shadow-[0_12px_36px_rgba(99,102,241,0.05)]" : "hover:border-[var(--surface-border-hover)]"
                )}
              >
                {/* Project Folder Header */}
                <div 
                  onClick={() => toggleProject(pid)}
                  className="flex items-center justify-between p-5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Folder className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[var(--foreground)] truncate">
                        {proj.name}
                      </h4>
                      <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5 font-bold uppercase tracking-wider">
                        Project Category
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="badge badge-green text-[10px] py-1 font-bold">
                      {proj.totalFiles} Deployed Proof{proj.totalFiles !== 1 ? 's' : ''}
                    </span>
                    <div className="text-[var(--foreground-subtle)] shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Tasks & Documents View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="border-t border-[var(--surface-border)]/50 bg-[var(--surface-2)]/30 overflow-hidden"
                    >
                      <div className="p-5 space-y-6">
                        {Object.entries(proj.tasks).map(([tid, task]) => (
                          <div key={tid} className="space-y-3 bg-[var(--surface-1)]/40 p-4 rounded-xl border border-[var(--surface-border)]/50">
                            {/* Task Name Sub-header */}
                            <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-2">
                              <CheckCircle className="h-4 w-4 text-[var(--brand-primary)]" />
                              <h5 className="text-xs font-black tracking-tight text-[var(--foreground)]">
                                Initiative: {task.title}
                              </h5>
                            </div>

                            {/* List of proofs inside this task */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {task.docs.map((doc) => (
                                <div 
                                  key={doc.id}
                                  className="dark-card group p-4 bg-[var(--surface-1)]/90 flex flex-col justify-between hover:border-[var(--brand-primary)]/20 transition-all duration-300 relative overflow-hidden"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)] border border-[var(--surface-border)] shrink-0">
                                        {getFileIcon(doc.file_type, doc.name)}
                                      </div>
                                      <div className="min-w-0">
                                        <h6 className="text-xs font-bold text-[var(--foreground)] truncate break-all" title={doc.name}>
                                          {doc.name}
                                        </h6>
                                        <p className="text-[9px] text-[var(--foreground-muted)] truncate flex items-center gap-1.5 mt-0.5">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleDownload(doc.file_url, doc.name)}
                                        className="rounded p-1 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors"
                                        title="Download Proof File"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </button>
                                      
                                      {(role === 'admin' || doc.uploaded_by === currentUserId) && (
                                        <button
                                          onClick={() => handleDelete(doc.id, doc.file_url)}
                                          className="rounded p-1 text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                          title="De-allocate Proof"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Uploader Details */}
                                  <div className="mt-3.5 border-t border-[var(--surface-border)]/50 pt-2.5 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[var(--foreground-subtle)]">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3 text-[var(--foreground-muted)]" /> Uploaded By</span>
                                    <span className="text-[var(--brand-accent)] truncate max-w-[120px]" title={doc.uploaded_by_name}>
                                      {doc.uploaded_by_name} ({doc.employee_id})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
