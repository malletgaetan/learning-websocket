
let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let userList = [];
let userIdList = new Map();
let count = 0;

const array2Json = arr => {
  let json = {};
  arr.forEach((e, i) => json[i] = e);
  return json;
}

app.get("/", (_, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {
  let addedUser = false;

  
  socket.on("typing", username => {
    clearTimeout(socket.timeout)
    socket.timeout = setTimeout(() => {
      socket.broadcast.emit("stop typing", username);
    }, 5000);
    socket.broadcast.emit("typing", username);
  });
  
  socket.on("private message", infos => {
    const target = userIdList.get(infos.to);
    console.log(infos);
    io.to(target).emit("private message", infos);
  });

  socket.on("add user", username => {
    if (addedUser) return;
    
    count++;
    socket.username = username;
    addedUser = true;
    userList.push(socket.username);
    userIdList.set(socket.username, socket.id);
    socket.emit("userlist", userList);
    socket.broadcast.emit('user joined', {
      username: socket.username,
      userList: userList
    });
  });

  socket.on("disconnect", username => {
    if(!addedUser) return;

    userList.splice(userList.indexOf(socket.username), 1);
    userIdList.delete(socket.username);
    addedUser = false;
    socket.broadcast.emit("user left", {
      username: socket.username,
      userList: userList
    });
  });

  socket.on("chat message", obj => {
    socket.broadcast.emit("new message", obj);
    // console.log(JSON.stringify(obj, null, 4));
  });
  console.log(userList);
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
