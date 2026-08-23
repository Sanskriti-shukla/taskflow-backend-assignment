const { getPagination, getPaginationResponse } = require('../../src/common/paginationHelper');

describe('paginationHelper', () => {
    test('returns default page, limit and offset', () => {
        expect(getPagination()).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    test('calculates offset and caps limit at 100', () => {
        expect(getPagination(3, 500)).toEqual({ page: 3, limit: 100, offset: 200 });
    });

    test('returns required response shape', () => {
        expect(getPaginationResponse([{ id: 1 }], 1, 1, 20)).toEqual({
            data: [{ id: 1 }],
            total: 1,
            page: 1,
            limit: 20
        });
    });
});
