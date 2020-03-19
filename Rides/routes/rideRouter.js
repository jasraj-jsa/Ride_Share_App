var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");
var request = require("request");
router.use(bodyParser.json());
var u = "http://localhost:3000/api/v1/db/"
var Count = require("../models/count");
var Rides = require("../models/rides");
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
    .post((req, res, next) => {
        if (req.body.length == 0) {
            res.statusCode = 400;
            res.send();
            next();
        }
        else {
            request.post({ url: u + "write", body: { operation: "add", table: "rides", created_by: req.body.created_by, source: req.body.source, destination: req.body.destination, timestamp: req.body.timestamp }, json: true }, (err, Response, body) => {
                if (err)
                    console.log(err);
                res.statusCode = Response.statusCode;
                res.send(body);
                next();
            })
        }
    })
    .get((req, res, next) => {
        if (!req.query || req.query.length == 0) {
            res.statusCode = 405;
            res.send();
            next();
        }
        else {
            request.post({ url: u + "read", body: { operation: "upcoming", table: "rides", source: req.query.source, destination: req.query.destination }, json: true }, (err, Response, body) => {
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
    .put((req, res, next) => {
        res.statusCode = 405;
        res.send({});
        next();
    })
router.route("/count")
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
        Rides.countDocuments({}, (err, c) => {
            var a = Array();
            a.push(c);
            res.statusCode = 200;
            res.send(a);
            next();
        });
    })
    .post((req,res,next) => {
        res.statusCode = 405;
        res.send();
        next();
    })
    .put((req,res,next) => {
        res.statusCode = 405;
        res.send();
        next();
    })
    .delete((req,res,next) => {
        res.statusCode = 405;
        res.send();
        next();
    })
router.route("/:rideId")
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
        request.post({ url: u + "read", body: { operation: "display", table: "rides", rideId: req.params.rideId }, json: true }, (err, Response, body) => {
            if (err)
                console.log(err);
	    console.log(Response);
            res.statusCode = Response.statusCode;
            res.send(body);
            next();
        })
    })
    .post((req, res, next) => {
        if (req.body.length == 0) {
            res.statusCode = 400;
            res.send();
            next();
        }
        else {
            request.post({ url: u + "write", body: { operation: "join", table: "rides", rideId: req.params.rideId, username: req.body.username }, json: true }, (err, Response, body) => {
                if (err)
                    console.log(err);
                res.statusCode = Response.statusCode;
                res.send(body);
                next();
            })
        }
    })
    .delete((req, res, next) => {
        request.post({ url: u + "read", body: { operation: "delete", table: "rides", rideId: req.params.rideId }, json: true }, (err, Response, body) => {
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

module.exports = router;
