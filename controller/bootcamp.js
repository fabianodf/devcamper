const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');

//@desc     Recupera todos os bootcamps
//@route    GET /api/v1/bootcamps
//access    public 
exports.getBootcamps = async (req, res, next) => {
    try {
        const bootcamps = await Bootcamp.find();
        res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

//@desc     Recupera unico bootcamp
//@route    GET /api/v1/bootcamps/:id
//access    public 
exports.getBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);

        if (!bootcamp) {
            //return res.status(400).json({ success: false });
            next(new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404));
        }

        res.status(200).json({ success: true, data: bootcamp });
    } catch (err) {
        //next(err); //quando era assim o err era tratado no middleware error.js com status padrao 500 e a msg era o err vindo da excecao. Mas abaixo o status e o erro eh customizado atraves da classe util ErrorResponse que extend Error, que eh o que next() espera.
        next(new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404));
    }
}

//@desc     Create bootcamp
//@route    POST /api/v1/bootcamps/
//access    private 
exports.createBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.create(req.body);

        res.status(201).json({
            success: true,
            data: bootcamp
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }

}

//@desc     Atualiza bootcamp
//@route    PUT /api/v1/bootcamps/:id
//access    private 
exports.updateBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!bootcamp) {
            return res.status(400).json({ success: false });
        }

        res.status(200).json({ success: true, data: bootcamp });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

//@desc     Deleta unico bootcamp
//@route    DELETE /api/v1/bootcamps/:id
//access    private 
exports.deleteBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

        if (!bootcamp) {
            return res.status(400).json({ success: false });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

