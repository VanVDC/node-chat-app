const path = require("path");
const http = require("http"); //socket needs a server

const express = require("express");
const socketio = require("socket.io");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
const app = express();
const server = http.createServer(app); //socket needs a server
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

//server(emit) ->client(receive)- countUpdated
//client(emit) ->server(receive)- increment
//socket.emit, io.emit, socket.broadcast.emit
//io.to.emit , socket.broadcast.to.emit ..to everyone in a specific room
//connect to client
io.on("connection", (socket) => {
  console.log("New websocket connection");

  //1.join event
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room); //join the room
    socket.emit("message", generateMessage("Admin", "Welcome")); //send data to client
    socket.broadcast //send to the room
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  //2. send message event
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback("Delivered");
  }); //listen to the client and send to every clients

  //3. send location
  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    //location
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback("Location recieved!");
  });
  //4. send message a user has left
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("Listening on port " + port);
});
