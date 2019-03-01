const express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
app.get('/', (req, res) => {

    res.send('Chat Server is running on port 8888')
});
io.on('connection', (socket) => {

    console.log('user connected');

socket.on('connection', function(userNickname) {

    console.log(userNickname +" : has joined the chat "  );

    socket.broadcast.emit('userjoinedthechat',userNickname +" : has joined the chat ");
});


socket.on('new message', (user, messageContent) => {

    //log the message in console

    console.log(user + ": "+ messageContent);

//create a message object

let  message = {"message":messageContent, "user":user};

// send the message to all users including the sender  using io.emit()

socket.broadcast.emit('message', message)

});

socket.on('disconnect', function() {

    console.log('User has left ');

    socket.broadcast.emit( "user disconnect" ,' user has left')

})

});

server.listen(8888,()=>{

    console.log('Node app is running on port 8888')
});