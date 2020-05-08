var express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
var request = require("request");
router.use(bodyParser.json());
var u = "http://localhost:3000/";
//var Count = require("../models/count");

router.route("/clear").post((req, res, next) => {
  request.post(
    {
      url: "http://localhost:3000/write",
      body: {
        operation: "clear",
      },
      json: true,
    },
    (err, Response, body) => {
      if (err) console.log(err);
      res.statusCode = Response.statusCode;
      res.send();
    }
  );
});

router
  .route("/")
  // .all((req, res, next) => {
  //   Count.find({ countId: 1 }).then((countee) => {
  //     if (countee.length == 0) {
  //       Count.create({ countId: 1, counter: 1 }).then((count) => {
  //         console.log("Success!!\n");
  //       });
  //     } else {
  //       Count.findByIdAndUpdate(
  //         countee[0]._id,
  //         { $inc: { counter: 1 } },
  //         { new: true },
  //         (err, r) => {
  //           if (err) console.log(err);
  //           next();
  //         }
  //       );
  //     }
  //   });
  // })
  .post((req, res, next) => {
    if (req.body.length == 0) {
      res.statusCode = 400;
      res.send();
      next();
    } else {
      var cb = req.body.created_by;
      var time = req.body.timestamp;
      var s = req.body.source;
      var d = req.body.destination;
      if (
        cb.length == 0 ||
        time.length == 0 ||
        s.length == 0 ||
        d.length == 0
      ) {
        res.statusCode = 400;
        res.send();
        next();
      } else {
        request.get(
          {
            url: "http://localhost:8080/api/v1/users",
            // "http://CC-1969773605.us-east-1.elb.amazonaws.com/api/v1/users",
          },
          (err, Response, body) => {
            if (err) console.log(err);
            //res.statusCode = Response.statusCode;
            //res.send(body);
            //next();
            if (Response.statusCode == 204) {
              res.statusCode = 400;
              res.send();
            } else {
              var user_array = JSON.parse(body);
              //console.log(user_array);
              var flag = 0;
              for (var i = 0; i < user_array.length; i++) {
                if (user_array[i] == cb) {
                  flag = 1;
                  break;
                }
              }
              if (flag == 0) {
                res.statusCode = 400;
                res.send();
              } else {
                if (
                  req.body.source < 1 ||
                  req.body.source > 198 ||
                  req.body.destination < 1 ||
                  req.body.destination > 198
                ) {
                  res.statusCode = 400;
                  res.send();
                  next();
                } else {
                  request.post(
                    {
                      url: u + "write",
                      body: {
                        operation: "add",
                        table: "rides",
                        created_by: req.body.created_by,
                        source: req.body.source,
                        destination: req.body.destination,
                        timestamp: req.body.timestamp,
                      },
                      json: true,
                    },
                    (err, Response, body) => {
                      if (err) console.log(err);
                      res.statusCode = Response.statusCode;
                      res.send(body);
                      next();
                    }
                  );
                }
              }
            }
          }
        );
      }
    }
  })
  .get((req, res, next) => {
    if (!req.query || req.query.length == 0) {
      res.statusCode = 405;
      res.send();
      next();
    } else {
      request.post(
        {
          url: u + "read",
          body: {
            operation: "upcoming",
            table: "rides",
            source: req.query.source,
            destination: req.query.destination,
          },
          json: true,
        },
        (err, Response, body) => {
          if (err) console.log(err);
          res.statusCode = Response.statusCode;
          res.send(body);
        }
      );
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
  });

router
  .route("/count")
  // .all((req, res, next) => {
  //   Count.find({ countId: 1 }).then((countee) => {
  //     if (countee.length == 0) {
  //       Count.create({ countId: 1, counter: 1 }).then((count) => {
  //         console.log("Success!!\n");
  //       });
  //     } else {
  //       Count.findByIdAndUpdate(
  //         countee[0]._id,
  //         { $inc: { counter: 1 } },
  //         { new: true },
  //         (err, r) => {
  //           if (err) console.log(err);
  //           next();
  //         }
  //       );
  //     }
  //   });
  // })
  .get((req, res, next) => {
    request.post(
      {
        url: u + "read",
        body: {
          operation: "count",
          table: "rides",
        },
        json: true,
      },
      (err, Response, body) => {
        if (err) console.log(err);
        res.statusCode = Response.statusCode;
        res.send(body);
      }
    );
  })
  .post((req, res, next) => {
    res.statusCode = 405;
    res.send();
    return next();
  })
  .put((req, res, next) => {
    res.statusCode = 405;
    res.send();
    return next();
  })
  .delete((req, res, next) => {
    res.statusCode = 405;
    res.send();
    return next();
  });
router
  .route("/:rideId")
  // .all((req, res, next) => {
  //   Count.find({ countId: 1 }).then((countee) => {
  //     if (countee.length == 0) {
  //       Count.create({ countId: 1, counter: 1 }).then((count) => {
  //         console.log("Success!!\n");
  //       });
  //     } else {
  //       Count.findByIdAndUpdate(
  //         countee[0]._id,
  //         { $inc: { counter: 1 } },
  //         { new: true },
  //         (err, r) => {
  //           if (err) console.log(err);
  //           next();
  //         }
  //       );
  //     }
  //   });
  // })
  .get((req, res, next) => {
    request.post(
      {
        url: u + "read",
        body: {
          operation: "display",
          table: "rides",
          rideId: req.params.rideId,
        },
        json: true,
      },
      (err, Response, body) => {
        if (err) console.log(err);
        res.statusCode = Response.statusCode;
        res.send(body);
        next();
      }
    );
  })
  .post((req, res, next) => {
    var id = req.params.rideId;
    var cb = req.body.username;
    if (id.length == 0 || cb.length == 0) {
      res.statusCode = 400;
      res.send();
      next();
    } else {
      request.get(
        {
          url: "http://localhost:8080/api/v1/users",
          // "http://CC-1969773605.us-east-1.elb.amazonaws.com/api/v1/users",
        },
        (err, Response, body) => {
          if (err) console.log(err);
          if (Response.statusCode == 204) {
            res.statusCode = 400;
            res.send();
            next();
          } else {
            var user_array = JSON.parse(body);
            var flag = 0;
            for (var i = 0; i < user_array.length; i++) {
              if (user_array[i] == cb) {
                flag = 1;
                break;
              }
            }
            if (flag == 0) {
              res.statusCode = 400;
              res.send();
              next();
            } else {
              request.post(
                {
                  url: u + "read",
                  body: {
                    operation: "display",
                    table: "rides",
                    rideId: req.params.rideId,
                  },
                  json: true,
                },
                (e, Res, body) => {
                  if (e) {
                    console.log(e);
                  }
                  if (Res.statusCode == 400) {
                    res.statusCode = 400;
                    res.send();
                    next();
                  } else {
                    request.post(
                      {
                        url: u + "write",
                        body: {
                          operation: "join",
                          table: "rides",
                          rideId: id,
                          username: cb,
                        },
                        json: true,
                      },
                      (err, Response, body) => {
                        if (err) console.log(err);
                        res.statusCode = Response.statusCode;
                        res.send(body);
                        next();
                      }
                    );
                  }
                }
              );
            }
          }
        }
      );
    }
  })
  .delete((req, res, next) => {
    if (req.params.rideId.length == 0) {
      res.statusCode = 400;
      res.send();
      next();
    } else {
      request.post(
        {
          url: u + "read",
          body: {
            operation: "display",
            table: "rides",
            rideId: req.params.rideId,
          },
          json: true,
        },
        (err, Response, body) => {
          if (err) console.log(err);
          if (Response.statusCode == 400) {
            res.statusCode = 400;
            res.send();
            next();
          } else {
            request.post(
              {
                url: u + "write",
                body: {
                  operation: "delete",
                  table: "rides",
                  rideId: req.params.rideId,
                },
                json: true,
              },
              (err, Response, body) => {
                if (err) console.log(err);
                res.statusCode = 200;
                res.send(body);
                next();
              }
            );
          }
        }
      );
    }
  })
  .put((req, res, next) => {
    res.statusCode = 405;
    res.send({});
    next();
  });

module.exports = router;
