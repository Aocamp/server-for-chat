const express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

let mysql = require('mysql');

let nameOfExistingRoom;
let nameOfRoom;
let idOfRoom;
let idOfUser;

let db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'server_db'
});

db.connect(function(err){
    if (err) console.log(err);
    console.log("database connected")
});

app.get('/', (req, res) => {
    res.send('Chat Server is running on port 8888')
});

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('connection', function(userNickname) {
        socket.on('room', function (roomName) {
            db.query('SELECT id FROM users WHERE user_login = ?', userNickname,function(err,rows){
                if(err)
                    return console.log(err);
                if (!rows.length)
                {
                    db.query('INSERT INTO users (user_login) VALUES (?)', userNickname);
                }
                else
                {
                    console.log("user exist");
                    let s = JSON.stringify(rows[0].id);
                    let data = JSON.parse(s);
                    idOfUser = data;

                    db.query('SELECT id FROM rooms WHERE user_id = ?', data, function (err,roomId) {
                        if(err)
                        {
                            return console.log(err);
                        }
                        if(!roomId.length)
                        {
                            socket.join(roomName);
                            nameOfRoom = roomName;
                            let params = [roomName, data];
                            db.query('INSERT INTO rooms (room_name, user_id) VALUES (?, ?)', params);
                            db.query('SELECT id FROM room where room_name = ?', roomName, function (err, response) {
                                let toString = JSON.stringify(response[0].id);
                                let roomId = JSON.parse(s);
                                let  idMessage = {"id":roomId};
                                io.sockets.in(nameOfRoom).emit('roomId', idMessage)
                            })
                        }
                        else {
                            console.log("room exist");
                            let a = JSON.stringify(roomId[0].id);
                            let roomData = JSON.parse(a);
                            idOfRoom = roomData;
                            console.log(idOfRoom);
                            db.query('SELECT room_name FROM rooms where id = ?', roomData, function (err, room) {
                                if(err)
                                    return console.log(err);
                                else {
                                    let name = JSON.stringify(room[0].room_name);
                                    let userRoom = JSON.parse(name);
                                    socket.join(userRoom);
                                    console.log(userNickname +" : has joined the " + userRoom + " room" );
                                    //console.log(io.sockets.sockets[userRoom]);
                                    nameOfExistingRoom = userRoom;
                                    let  idMessage = {"id":idOfRoom};
                                    io.sockets.in(nameOfExistingRoom).emit('roomId', idMessage)
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    socket.on('new message', (user, messageContent, messageDate) => {
        console.log(user + ": "+ messageContent);

        let params = [messageContent, messageDate, idOfRoom, idOfUser];

        db.query('INSERT INTO messages (message_text, message_date, room_id, user_id) VALUES(?, ?, ?, ?)', params);

        let  message = {"message":messageContent, "user":user};

        if(!nameOfExistingRoom.length){
            io.sockets.in(nameOfRoom).emit('message', message)
        }else {
            io.sockets.in(nameOfExistingRoom).emit('message', message)
        }
    });

    socket.on('disconnect', function() {

        console.log('User has left ');

        socket.broadcast.emit( "user disconnect" ,' user has left')
    })
});

server.listen(8888,()=>{
    console.log('Node app is running on port 8888')
});