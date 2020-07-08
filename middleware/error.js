const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    //Faz uma copia do obj err, se a copia 'error' for sobrescrita com um erro tratado aqui tudo bem, se nao for tratado entao usa o err original.
    let error = { ...err };
    error.message = err.message;

    //Log console for dev
    console.log(err.stack.red);

    //Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id: ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    res.status(error.statusCode || 500).json({
        succes: false,
        error: error.message || 'Server error'
    });
};

module.exports = errorHandler;