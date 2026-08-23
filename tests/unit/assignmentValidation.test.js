const { validateAssigneeMembership } = require('../../src/common/assignmentHelper');

describe('task assignment validation', () => {
    test('accepts a membership from the same organization', () => {
        expect(validateAssigneeMembership({ id: 'membership-id' })).toBe(true);
    });

    test('rejects user who is not a member of the task organization', () => {
        expect(() => validateAssigneeMembership(null)).toThrow(
            'Assigned user must belong to the same organization as the task'
        );
    });
});
