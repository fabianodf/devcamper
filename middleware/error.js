const errorHandler = (err, req, res, next) => {
    //Log console for dev
    console.log(err.stack.red);

    res.status(err.statusCode || 500).json({
        succes: false,
        error: err.message || 'Server error'
    });
};

module.exports = errorHandler;