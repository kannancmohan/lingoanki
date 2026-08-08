import React, { useState, useEffect } from 'react';
import { getGroups, addGroup, isDefaultGroup, editGroup, deleteGroup } from '../services/quizService';
import { PencilIcon, TrashIcon } from './icons';

interface GroupSelectorProps {
  selectedGroup: string;
  onChange: (group: string) => void;
  label?: React.ReactNode;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({ selectedGroup, onChange, label = 'Group' }) => {
  const [groups, setGroups] = useState<string[]>([]);
  const [showManageModal, setShowManageModal] = useState(false);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Group State
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Group State
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      setShowManageModal(true);
      setNewGroupName('');
      setCreateError(null);
      setEditingGroup(null);
      setDeletingGroup(null);
      // Reset select back to current value
      e.target.value = selectedGroup || 'default';
    } else {
      onChange(val);
    }
  };

  const handleCreateGroupSubmit = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      setCreateError('Group name cannot be empty.');
      return;
    }

    if (trimmed.toLowerCase() === 'default' || trimmed.toLowerCase() === '__create_new__') {
      setCreateError('Invalid group name.');
      return;
    }

    const currentGroups = getGroups();
    if (currentGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
      setCreateError('A group with this name already exists.');
      return;
    }

    addGroup(trimmed);
    refreshGroups();
    onChange(trimmed);
    setNewGroupName('');
    setCreateError(null);
  };

  const handleStartEdit = (groupName: string) => {
    setEditingGroup(groupName);
    setEditingName(groupName);
    setEditError(null);
    setDeletingGroup(null);
  };

  const handleSaveEdit = (groupName: string) => {
    const result = editGroup(groupName, editingName);
    if (!result.success) {
      setEditError(result.error || 'Failed to edit group.');
      return;
    }

    const newGroupTrimmed = editingName.trim();
    refreshGroups();

    if (selectedGroup === groupName) {
      onChange(newGroupTrimmed);
    }

    setEditingGroup(null);
    setEditError(null);
  };

  const handleStartDelete = (groupName: string) => {
    setDeletingGroup(groupName);
    setDeleteError(null);
    setEditingGroup(null);
  };

  const handleConfirmDelete = (groupName: string) => {
    const result = deleteGroup(groupName);
    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete group.');
      return;
    }

    refreshGroups();

    if (selectedGroup === groupName) {
      onChange('default');
    }

    setDeletingGroup(null);
    setDeleteError(null);
  };

  const customGroups = groups.filter(g => !isDefaultGroup(g));

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
          to create/edit group
        </option>
        {groups.map(g => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      {/* Unified Manage Groups Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Manage Groups</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create a new group or edit/delete existing custom groups.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg font-bold p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-6 flex-1">
              {/* Section 1: Create New Group */}
              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">Create New Group</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    id="newGroupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateGroupSubmit();
                      }
                    }}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., Languages"
                  />
                  <button
                    type="button"
                    onClick={handleCreateGroupSubmit}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-sky-600/30 shrink-0"
                  >
                    Create Group
                  </button>
                </div>
                {createError && <p className="text-red-400 text-xs mt-2">{createError}</p>}
              </div>

              {/* Section 2: Existing Custom Groups */}
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                  Existing Custom Groups ({customGroups.length})
                </h4>

                {customGroups.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-2">
                    No custom groups created yet. Use the field above to create one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customGroups.map((g) => {
                      const isEditing = editingGroup === g;
                      const isDeleting = deletingGroup === g;

                      return (
                        <div
                          key={g}
                          className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-2"
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEdit(g);
                                    }
                                  }}
                                  className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-2.5 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(g)}
                                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingGroup(null)}
                                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                              {editError && <p className="text-red-400 text-xs">{editError}</p>}
                            </div>
                          ) : isDeleting ? (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-300">
                                Delete <span className="font-semibold text-white">'{g}'</span>? Quizzes in this group will be moved to 'default'.
                              </p>
                              {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setDeletingGroup(null)}
                                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDelete(g)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-white truncate mr-2">{g}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(g)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                                  title={`Edit '${g}'`}
                                  aria-label={`Edit ${g}`}
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartDelete(g)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                                  title={`Delete '${g}'`}
                                  aria-label={`Delete ${g}`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
