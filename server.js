const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileUpload = require('express-fileupload');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

//Load env vars
dotenv.config({ path: './config/config.env' });

//Connect to database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamp');
const courses = require('./routes/course');
const auth = require('./routes/auth');

const app = express();

//Body parser
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// File upload
app.use(fileUpload());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);

//Tem que ir depois do routers, pois middleware executa numa ordem linear e essa linha depende da router ter rodado antes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running on ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

// Handle unhandle promise exception
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    //Close server and exit proccess
    server.close(() => process.exit(1));
})
