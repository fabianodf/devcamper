const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');

//@desc     Recupera todos os bootcamps
//@route    GET /api/v1/bootcamps
//access    public 
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach(item => delete reqQuery[item]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(lte|lt|gte|gt|in)\b/g, match => `$${match}`);
    query = Bootcamp.find(JSON.parse(queryStr));

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

    const total = await Bootcamp.countDocuments();

    query = query.skip(startIndex).limit(limit);

    //Executing query
    const bootcamps = await query;

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

    res.status(200).json({ success: true, count: bootcamps.length, pagination, data: bootcamps });
});

//@desc     Recupera unico bootcamp
//@route    GET /api/v1/bootcamps/:id
//access    public 
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        //return res.status(400).json({ success: false });
        return next(new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: bootcamp });
});

//@desc     Create bootcamp
//@route    POST /api/v1/bootcamps/
//access    private 
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        data: bootcamp
    });
});

//@desc     Atualiza bootcamp
//@route    PUT /api/v1/bootcamps/:id
//access    private 
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: bootcamp });
});

//@desc     Deleta unico bootcamp
//@route    DELETE /api/v1/bootcamps/:id
//access    private 
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

    if (!bootcamp) {
        //return res.status(400).json({ success: false });
        return next(new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
});


//@desc     Deleta unico bootcamp
//@route    GET /api/v1/bootcamps/radius/:zipcode/:distance
//access    public 
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;

    const loc = await geocoder.geocode(zipcode);

    const lon = loc[0].longitude;
    const lat = loc[0].latitude;

    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: { $centerSphere: [[lon, lat], radius] }
        }
    });
    res.status(200).json({ success: true, count: bootcamps.length, data: { bootcamps } });
});