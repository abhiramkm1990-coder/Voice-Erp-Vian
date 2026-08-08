import React, { useState } from 'react';
import { Announcement, Employee } from '../../types';
import { Megaphone, Plus, Trash2, X, Send, Pin, CheckCircle2 } from 'lucide-react';

interface AnnouncementManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  currentUser: Employee;
  onPostAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementManagerModal: React.FC<AnnouncementManagerModalProps> = ({
  isOpen,
  onClose,
  announcements,
  currentUser,
  onPostAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onPostAnnouncement({
      title: title.trim(),
      content: content.trim(),
      priority,
      author: `${currentUser.name} (${currentUser.designation})`,
    });

    setTitle('');
    setContent('');
    setPriority('normal');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Post Company Announcement Bulletin</h3>
              <p className="text-xs text-slate-500">Announcements will instantly display on all employee dashboards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Announcement Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Create Office-Wide Notice
          </h4>

          <div>
            <input
              type="text"
              required
              placeholder="Announcement Title (e.g. Q3 Townhall Meeting / New Policy)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <textarea
              rows={3}
              required
              placeholder="Announcement content details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-amber-500"
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-600">Priority Level:</span>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-slate-700 font-medium">Normal</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="urgent"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="text-rose-700 font-bold">Urgent</span>
              </label>
            </div>

            <button
              type="submit"
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all self-end"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </form>

        {/* Existing Announcements List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Active Office Bulletins ({announcements.length})
          </h4>

          <div className="space-y-2">
            {announcements.map((anc) => (
              <div
                key={anc.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{anc.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        anc.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {anc.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{anc.content}</p>
                  <p className="text-[10px] text-slate-400">
                    By {anc.author} on {anc.date}
                  </p>
                </div>

                <button
                  onClick={() => onDeleteAnnouncement(anc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
