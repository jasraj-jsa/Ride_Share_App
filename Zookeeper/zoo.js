var zookeeper = require("node-zookeeper-client");

var client = zookeeper.createClient("localhost:2181");
var path = process.argv[2];

function listChildren(client, path) {
  client.getChildren(
    path,
    function (event) {
      console.log("Got watcher event: %s", event);
      listChildren(client, path);
    },
    function (error, children, stat) {
      if (error) {
        console.log("Failed to list children of %s due to: %s.", path, error);
        return;
      }

      console.log("Children of %s are: %j.", path, children);
    }
  );
}

client.once("connected", function () {
  console.log("Connected to ZooKeeper.");
  client.getData(
    "/puppy/puppy",
    function (event) {
      console.log("HERE1");
      console.log("Got event: %s.", event);
    },
    function (error, data, stat) {
      if (error) {
        console.log(error.stack);
        return;
      }

      console.log("Got data: %s", data.toString("utf8"));
    }
  );
  client.remove("/puppy/puppy", -1, function (error) {
    if (error) {
      console.log(error.stack);
      return;
    }

    console.log("Node is deleted.");
  });
});

client.connect();
