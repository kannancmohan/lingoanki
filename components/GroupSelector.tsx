import React, { useState, useEffect } from 'react';
import { getGroups, addGroup } from '../services/quizService';

interface GroupSelectorProps {
  selectedGroup: string;
  onChange: (group: string) => void;
  label?: React.ReactNode;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({ selectedGroup, onChange, label = 'Group' }) => {
  const [groups, setGroups] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load groups on mount and whenever modal is closed
  const refreshGroups = () => {
    const list = getGroups();
    setGroups(list);
  };

  useEffect(() => {
    refreshGroups();
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__create_new__') {
      setShowModal(true);
      setNewGroupName('');
      setError(null);
      // Reset select back to current value so it doesn't stay on "to create new group" if cancelled
      e.target.value = selectedGroup;
    } else {
      onChange(val);
    }
  };

  const handleCreateGroupSubmit = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      setError('Group name cannot be empty.');
      return;
    }

    if (trimmed.toLowerCase() === '__create_new__') {
      setError('Invalid group name.');
      return;
    }

    // Add to global storage
    addGroup(trimmed);
    refreshGroups();
    
    // Select the newly created group
    onChange(trimmed);
    setShowModal(false);
    setNewGroupName('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateGroupSubmit();
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="group-select" className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <select
        id="group-select"
        value={selectedGroup || 'default'}
        onChange={handleSelectChange}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
      >
        <option value="__create_new__" className="text-sky-400 font-semibold">
          to create new group
        </option>
        {groups.map(g => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>
            <div>
              <div className="mb-4">
                <label htmlFor="newGroupName" className="block text-sm font-medium text-slate-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  id="newGroupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g., Languages"
                  autoFocus
                  required
                />
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-transparent border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroupSubmit}
                  className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 transition-colors shadow-lg shadow-sky-600/30"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
