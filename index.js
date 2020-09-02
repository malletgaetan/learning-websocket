let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http);
let addedUser = false;
let userCount = 0;

app.get("/", (_, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {
  ++userCount;

  socket.on("typing", username => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop typing", username => {
    socket.broadcast.emit("stop typing", username);
  });

  socket.on("add user", username => {

    if (addedUser) return;

    socket.username = username;
    addedUser = true;
    ++userCount;

    socket.broadcast.emit("user joined", {
      username: socket.username,
      userCount: userCount
    });
  });

  socket.on("disconnect", username => {
    if(!addedUser) return;

    --userCount;
    addedUser = false;
    socket.broadcast.emit("user left", {
      username: socket.username,
      userCount: userCount
    });
  });

  socket.on("chat message", obj => {
    socket.broadcast.emit("new message", obj);
    console.log(JSON.stringify(obj, null, 4));
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});