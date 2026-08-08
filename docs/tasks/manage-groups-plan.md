# Plan: Edit and Remove Custom Quiz Groups

This document outlines the detailed strategy and specifications to implement the feature for editing and removing existing custom quiz groups while preventing modifications to the default system group (`default`). This is designed for an AI agent or developer to implement independently without requiring further user intervention.

---

## 1. Core Requirements & Constraints

1. **Default Group Protection**:
   * The system default group (`'default'`, case-insensitive) **MUST NOT** be editable or deletable under any circumstances.
   * UI controls (edit/delete buttons or options) for the `'default'` group must be hidden or disabled with a lock icon/badge indicating it is a system default group.
2. **Editing Custom Groups**:
   * Users can rename any custom group (any group other than `'default'`).
   * **Validation**:
     * Group name cannot be empty or whitespace-only.
     * Group name cannot be `'default'` or `'__create_new__'`.
     * Group name must be unique (case-insensitive check against existing groups).
   * **Cascading Update**:
     * When a custom group is renamed from `oldName` to `newName`, all existing quizzes assigned to `oldName` must have their `group` field updated to `newName` in storage (`localStorage`) and active state.
     * The list of groups saved in `localStorage` under `lingoAnkiGroups` must be updated to replace `oldName` with `newName`.
3. **Deleting Custom Groups**:
   * Users can delete any custom group (any group other than `'default'`).
   * **Confirmation**:
     * Must show a confirmation dialog warning the user about the deletion and indicating that any associated quizzes will be reassigned to the `'default'` group.
   * **Cascading Reassignment**:
     * When a custom group is deleted, all quizzes currently in that group must automatically be moved to the `'default'` group.
   * **Cleanup**:
     * The deleted group name is removed from the `lingoAnkiGroups` array in `localStorage`.

---

## 2. Service Layer Specifications (`services/quizService.ts`)

Add utility functions to `services/quizService.ts`:

### A. `isDefaultGroup(groupName: string): boolean`
```typescript
export const isDefaultGroup = (groupName: string): boolean => {
  return groupName.trim().toLowerCase() === 'default';
};
```

### B. `editGroup(oldName: string, newName: string): { success: boolean; error?: string }`
1. Check if `isDefaultGroup(oldName)` is `true`. If so, return `{ success: false, error: "The 'default' group cannot be edited." }`.
2. Clean `trimmedNewName = newName.trim()`. If empty, return `{ success: false, error: "Group name cannot be empty." }`.
3. If `trimmedNewName.toLowerCase() === 'default'` or `trimmedNewName.toLowerCase() === '__create_new__'`, return `{ success: false, error: "Invalid group name." }`.
4. Check if `getGroups()` already contains `trimmedNewName` (case-insensitive, ignoring `oldName`). If so, return `{ success: false, error: "A group with this name already exists." }`.
5. Update `lingoAnkiGroups` in `localStorage`: replace `oldName` with `trimmedNewName`.
6. Update all saved quizzes in `localStorage` (`lingoAnkiQuizzes` key):
   * For each quiz where `quiz.group.trim().toLowerCase() === oldName.trim().toLowerCase()`, set `quiz.group = trimmedNewName`.
7. Return `{ success: true }`.

### C. `deleteGroup(groupName: string): { success: boolean; error?: string }`
1. Check if `isDefaultGroup(groupName)` is `true`. If so, return `{ success: false, error: "The 'default' group cannot be deleted." }`.
2. Remove `groupName` from `lingoAnkiGroups` in `localStorage`.
3. Update all saved quizzes in `localStorage` (`lingoAnkiQuizzes` key):
   * For each quiz where `quiz.group.trim().toLowerCase() === groupName.trim().toLowerCase()`, set `quiz.group = 'default'`.
4. Return `{ success: true }`.

---

## 3. UI Component Specifications

### A. Group Selector Component (`/components/GroupSelector.tsx`)
Enhance the group management interface:
1. **Dropdown & Action Controls**:
   * Beside or within the group selector, provide options/buttons to Edit and Delete the currently selected group (or list groups with individual action items).
   * For the `'default'` group, disable or hide the Edit and Delete buttons (optionally showing a lock icon or tool-tip indicating `'default'` cannot be modified).
2. **Inline Edit Modal / Dialog**:
   * Input field pre-filled with the group's current name.
   * Save & Cancel buttons.
   * Displays validation error messages.
   * On save, calls `editGroup(oldName, newName)`, updates current selection to `newName`, and triggers group list refresh.
3. **Delete Confirmation Dialog**:
   * Prompt: *"Are you sure you want to delete the group '[GroupName]'? Quizzes in this group will be moved to 'default'."*
   * Delete & Cancel buttons.
   * On confirmation, calls `deleteGroup(groupName)`, switches active selection to `'default'`, and triggers group list refresh.

---

## 4. Test Specifications & Verification Plan

Create a dedicated unit test file `/test/unit/groupManagement.test.ts` and register it in `/test/test-runner.tsx`.

### Test Cases Checklist:

1. **Default Group Protection**:
   * `isDefaultGroup('default')` and `isDefaultGroup('DEFAULT')` return `true`.
   * `isDefaultGroup('CustomGroup')` returns `false`.
   * `editGroup('default', 'General')` fails with error and does not rename `'default'`.
   * `deleteGroup('default')` fails with error and does not remove `'default'`.

2. **Custom Group Renaming**:
   * Creating a custom group `'Verbs'`.
   * Renaming `'Verbs'` to `'Action Verbs'` succeeds.
   * Attempting to rename `'Action Verbs'` to `""` fails.
   * Attempting to rename `'Action Verbs'` to `'default'` fails.
   * Quizzes previously in group `'Verbs'` now have `group === 'Action Verbs'`.

3. **Custom Group Deletion & Reassignment**:
   * Creating custom group `'Temporary'` and a quiz in `'Temporary'`.
   * Deleting custom group `'Temporary'` succeeds.
   * Group list no longer contains `'Temporary'`.
   * The quiz originally in `'Temporary'` now has `group === 'default'`.

---

## 5. Implementation Step-by-Step Checklist for AI / Developer

1. **Service Layer Updates**:
   * Open `/services/quizService.ts`.
   * Implement `isDefaultGroup`, `editGroup`, and `deleteGroup`.
2. **UI Updates**:
   * Open `/components/GroupSelector.tsx` (and any group filter/tabs in `/App.tsx` or `/components/QuizList.tsx`).
   * Add Edit and Delete action controls, ensuring they are disabled/hidden for `'default'`.
   * Add Edit Modal and Delete Confirmation Dialog.
   * Wire state updates so UI re-renders updated group lists immediately.
3. **Unit Tests Creation**:
   * Create `/test/unit/groupManagement.test.ts`.
   * Register test suite in `/test/test-runner.tsx`.
4. **Validation**:
   * Run compilation and tests to ensure 100% test pass rate.
