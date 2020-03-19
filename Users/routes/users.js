var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");
var request = require("request");
router.use(bodyParser.json());
var u = "http://localhost:3000/api/v1/db/"
const Users = require("../models/users");
var Count = require("../models/count");
router.route("/")
  .all((req, res, next) => {
        Count.find({ countId: 1 }).then((countee) => {
            if (countee.length == 0) {
                console.log("No counter\n");
                next();
            }
            else {
                Count.findByIdAndUpdate(countee[0]._id, { $inc: { counter: 1 } }, { 'new': true }, (err, r) => {
                    if (err)
                        console.log(err);
                    next();
                });
            }
        });
    })
  .get((req, res, next) => {
    request.post({ url: u + "read", body: { operation: "display", table: "users" }, json: true }, (err, Response, body) => {
      if (err)
        console.log(err);
      res.statusCode = Response.statusCode;
      res.send(body);
      next();
    });
  })
  .put((req, res, next) => {
    if (req.body.length == 0) {
      res.statusCode = 400;
      res.send();
      next();
    }
    else {
      request.post({ url: u + "write", body: { operation: "add", table: "users", username: req.body.username, password: req.body.password }, json: true }, (err, Response, body) => {
        if (err)
          console.log(err);
        res.statusCode = Response.statusCode;
        res.send(body);
        next();
      })
    }
  })
  .delete((req, res, next) => {
    res.statusCode = 405;
    res.send({});
    next();
  })
  .post((req, res, next) => {
    res.statusCode = 405;
    res.send({});
    next();
  })

router.route("/:username")
  .all((req, res, next) => {
        Count.find({ countId: 1 }).then((countee) => {
            if (countee.length == 0) {
                console.log("No counter\n");
                next();
            }
            else {
                Count.findByIdAndUpdate(countee[0]._id, { $inc: { counter: 1 } }, { 'new': true }, (err, r) => {
                    if (err)
                        console.log(err);
                    next();
                });
            }
        });
    })
  .delete((req, res, next) => {
    request.post({ url: u + "read", body: { operation: "delete", table: "users", username: req.params.username }, json: true }, (err, Response, body) => {
      if (err)
        console.log(err);
      res.statusCode = Response.statusCode;
      res.send(body);
      next();
    })
  })
  .put((req, res, next) => {
    res.statusCode = 405;
    res.send({});
    next();
  })
  .post((req, res, next) => {
    res.statusCode = 405;
    res.send({});
    next();
  })
  .get((req, res, next) => {
    res.statusCode = 405;
    res.send({});
    next();
  })

module.exports = router;
