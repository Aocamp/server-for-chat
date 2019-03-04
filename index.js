const express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
app.get('/', (req, res) => {

    res.send('Chat Server is running on port 8888')
});

    var room;

io.on('connection', (socket) => {
    console.log('user connected');
socket.on('connection', function(userNickname) {
    socket.on('room', function (roomName) {
        socket.join(roomName);
        console.log(userNickname +" : has joined the " + roomName + "room" );
    });
});

socket.on('new message', (user, roomName, messageContent) => {
    //log the message in console
    console.log(user + ": "+ messageContent);

    //create a message object
    let  message = {"message":messageContent, "user":user};

    io.sockets.in(roomName).emit('message', message)

});

socket.on('reconnect', () => {
        socket.emit('room', room)
    })

socket.on('disconnect', function() {

    console.log('User has left ');

    socket.broadcast.emit( "user disconnect" ,' user has left')

})

});

server.listen(8888,()=>{

    console.log('Node app is running on port 8888')
});