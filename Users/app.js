var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
/*const mongoose = require("mongoose");
const url = "mongodb://user_db:27017/cloud";*/
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//var dbRouter = require("./routes/dbRouter");
//var Count = require("./models/count");
//var countRouter = require("./routes/count");

/*Count.find({ countId: 1 }).then((countee) => {
  if (countee.length == 0) {
    Count.create({ countId: 1, counter: 0 })
      .then((count) => {
        console.log("Success!!\n");
      });
  }
});

const connect = mongoose.connect(url);
connect.then((db) => {
  console.log("\n\n\t\t\t\t\tCorrectly connected to the server!");
});
*/
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
//app.use('/api/v1/db', dbRouter);
//app.use('/api/v1/_count', countRouter);
// catch 404 and forward to error handler
/*app.use(function (req, res, next) {
  next(createError(404));
});*/

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
});

module.exports = app;
