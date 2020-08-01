const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');

//@desc     Recupera todos os bootcamps
//@route    GET /api/v1/bootcamps
//access    public 
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    const bootcamps = await Bootcamp.find();
    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
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

