const getPagination = (pageValue, limitValue) => {
    const page = Math.max(Number(pageValue) || 1, 1);
    const limit = Math.min(Math.max(Number(limitValue) || 20, 1), 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

const getPaginationResponse = (rows, total, page, limit) => ({
    data: rows,
    total,
    page,
    limit
});

module.exports = {
    getPagination,
    getPaginationResponse
};
