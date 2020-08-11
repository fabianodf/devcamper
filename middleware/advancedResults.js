const asyncHandler = require("./async");

const advancedResults = (model, populate) => asyncHandler(async (req, res, next) => {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach(item => delete reqQuery[item]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(lte|lt|gte|gt|in)\b/g, match => `$${match}`);
    query = model.find(JSON.parse(queryStr));

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (req.query.sort) {
        const fields = req.query.sort.split(',').join(' ');
        query = query.sort(fields);
    } else {
        query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    if (populate) {
        query = query.populate(populate);
    }

    //Executing query
    const results = await query;

    //Pagination result
    const pagination = {};

    if (endIndex < total) { //(MEU) if (page + 1 < total / limit) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    };

    next();
});

module.exports = advancedResults;