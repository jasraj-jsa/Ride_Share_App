var express = require('express');
var router = express.Router();
var Count = require("../models/count");
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.route("/")
    .get((req, res, next) => {
        Count.find({ countId: 1 }).then((countee) => {
            var a = Array();
	    if (countee.length == 0) {
               a.push(0);
               res.statusCode = 200;
               res.send(a);
               next();
            }
            else {
                a.push(countee[0].counter);
                res.statusCode = 200;
                res.send(a);
                next();
            }
        });

    })
    .delete((req, res, next) => {
        Count.find({ countId: 1 }).then((countee) => {
            if (countee.length == 0) {
                res.statusCode = 405;
                res.send();
                next();
            }
            else {
                Count.findByIdAndUpdate(countee[0]._id, { counter: 0 }, { 'new': true }, (err, r) => {
                    if (err)
                        console.log(err);
                    res.statusCode = 200;
                    res.send();
                    next();
                });
            }
        });
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

module.exports = router;
