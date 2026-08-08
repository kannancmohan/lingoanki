import { isDefaultGroup, editGroup, deleteGroup, addGroup, getGroups, createQuiz, getQuizzes } from '../../services/quizService';
import { expect, TestCase } from '../test-utils';

export const groupManagementTests: TestCase[] = [
    {
        name: 'Default Group Protection: isDefaultGroup checks case-insensitively',
        testFn: () => {
            expect(isDefaultGroup('default')).toBe(true);
            expect(isDefaultGroup('DEFAULT')).toBe(true);
            expect(isDefaultGroup(' Default ')).toBe(true);
            expect(isDefaultGroup('CustomGroup')).toBe(false);
        },
    },
    {
        name: 'Default Group Protection: Cannot edit or delete default group',
        testFn: () => {
            const editResult = editGroup('default', 'General');
            expect(editResult.success).toBe(false);
            expect(editResult.error).toBe("The 'default' group cannot be edited.");

            const editResultUpper = editGroup('DEFAULT', 'General');
            expect(editResultUpper.success).toBe(false);

            const deleteResult = deleteGroup('default');
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.error).toBe("The 'default' group cannot be deleted.");

            const deleteResultUpper = deleteGroup('DEFAULT');
            expect(deleteResultUpper.success).toBe(false);

            expect(getGroups().includes('default')).toBe(true);
        },
    },
    {
        name: 'Custom Group Renaming: Renames group and updates associated quizzes',
        testFn: () => {
            addGroup('Verbs');
            expect(getGroups().includes('Verbs')).toBe(true);

            // Create a quiz assigned to 'Verbs'
            createQuiz('French Verbs', 'parler,to speak', 'Verbs');
            const initialQuizzes = getQuizzes();
            const createdQuiz = initialQuizzes.find(q => q.name === 'French Verbs');
            expect(createdQuiz?.group).toBe('Verbs');

            // Attempting to rename to empty string fails
            const emptyRename = editGroup('Verbs', '   ');
            expect(emptyRename.success).toBe(false);
            expect(emptyRename.error).toBe('Group name cannot be empty.');

            // Attempting to rename to 'default' fails
            const defaultRename = editGroup('Verbs', 'default');
            expect(defaultRename.success).toBe(false);
            expect(defaultRename.error).toBe('Invalid group name.');

            // Attempting to rename to '__create_new__' fails
            const createNewRename = editGroup('Verbs', '__create_new__');
            expect(createNewRename.success).toBe(false);
            expect(createNewRename.error).toBe('Invalid group name.');

            // Successful rename to 'Action Verbs'
            const validRename = editGroup('Verbs', 'Action Verbs');
            expect(validRename.success).toBe(true);

            const groupsAfter = getGroups();
            expect(groupsAfter.includes('Verbs')).toBe(false);
            expect(groupsAfter.includes('Action Verbs')).toBe(true);

            // Quizzes previously in 'Verbs' now have group === 'Action Verbs'
            const updatedQuizzes = getQuizzes();
            const updatedQuiz = updatedQuizzes.find(q => q.name === 'French Verbs');
            expect(updatedQuiz?.group).toBe('Action Verbs');
        },
    },
    {
        name: 'Custom Group Renaming: Fails if target group name already exists',
        testFn: () => {
            addGroup('Nouns');
            addGroup('Adjectives');

            const duplicateRename = editGroup('Nouns', 'Adjectives');
            expect(duplicateRename.success).toBe(false);
            expect(duplicateRename.error).toBe('A group with this name already exists.');
        },
    },
    {
        name: 'Custom Group Deletion & Reassignment: Deletes group and reassigns quizzes to default',
        testFn: () => {
            addGroup('Temporary');
            expect(getGroups().includes('Temporary')).toBe(true);

            createQuiz('Temp Quiz', 'hello,world', 'Temporary');
            const quizzesBefore = getQuizzes();
            const tempQuizBefore = quizzesBefore.find(q => q.name === 'Temp Quiz');
            expect(tempQuizBefore?.group).toBe('Temporary');

            const deleteResult = deleteGroup('Temporary');
            expect(deleteResult.success).toBe(true);

            const groupsAfter = getGroups();
            expect(groupsAfter.includes('Temporary')).toBe(false);

            const quizzesAfter = getQuizzes();
            const tempQuizAfter = quizzesAfter.find(q => q.name === 'Temp Quiz');
            expect(tempQuizAfter?.group).toBe('default');
        },
    },
];
