const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const cookieParser = require('cookie-parser');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

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
        return next(new ErrorResponse("User not found", 404));
    }

    res
        .status(200)
        .json({ success: true, user });
});

//@desc      Forgot password
//@route     POST /api/v1/forgotpassword
//@access    public
exports.forgotPassword = asyncHandler(async (req, res, next) => {

    //Check for user
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You or someone else has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        });

        res
            .status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        console.log(error);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse("Email could not be sent", 500));
    }

});

//@desc      Reset password
//@route     PUT /api/v1/auth/resetpassword/:resettoken
//@access    private
exports.resetPassword = asyncHandler(async (req, res, next) => {

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    //Check for user
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse("Invalid token", 400));
    }

    //Set new pass
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
});