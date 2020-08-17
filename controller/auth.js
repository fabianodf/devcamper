const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const cookieParser = require('cookie-parser');

//@desc      Register user
//@route     POST /api/v1/register
//@access    public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    //Create user
    const user = await User.create({ name, email, password, role });

    sendTokenResponse(user, 200, res);
});


//@desc      Login user
//@route     POST /api/v1/login
//@access    public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse("Please provide an email and password", 400));
    }

    //Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {

    //Create token
    const token = user.getSignJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({ success: true, token });
};

//@desc      Get current logged in user
//@route     GET /api/v1/getMe
//@access    private
exports.getMe = asyncHandler(async (req, res, next) => {

    //Check for user
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new ErrorResponse("User not found", 401));
    }

    res
        .status(200)
        .json({ success: true, user });
});