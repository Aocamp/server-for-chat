let cluster = require('cluster');
let cpuCount = require('os').cpus().length;//Количество ядер процессора
let io = [];
//В мастере создаем worker'ов равное количеству ядер процессоров
if (cluster.isMaster) {
    for (let i = 0; i < cpuCount; i += 1) {
        let worker = cluster.fork();
    }
}
if(cluster.isWorker) {
    let mysql = require('mysql');

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

    let worker_id = cluster.worker.id;
    let express = require('express');
    http = require('http');
    app = express();
    server = http.createServer(app);
    io[worker_id] = require('socket.io')(server);
    server.listen(8888 + worker_id);



    app.get('/', (req, res) => {
        res.send('Chat Server is running on port 8888')
    });

    io[worker_id].on('connection', (socket) => {
        console.log('user connected');
        console.log( "WORKER ID :"+worker_id );

        socket.on('connection', function (userNickname) {
            socket.on('room', function (roomName) {
                db.query('SELECT id FROM users WHERE user_login = ?', userNickname, function (err, rows) {
                    if (err)
                        return console.log(err);
                    if (!rows.length) {
                        db.query('INSERT INTO users (user_login) VALUES (?)', userNickname);
                    }
                    else {
                        console.log("user exist");
                        let s = JSON.stringify(rows[0].id);
                        let data = JSON.parse(s);
                        idOfUser = data;

                        db.query('SELECT id FROM rooms WHERE user_id = ?', data, function (err, roomId) {
                            if (err) {
                                return console.log(err);
                            }
                            if (!roomId.length) {
                                socket.join(roomName);
                                nameOfRoom = roomName;
                                let params = [roomName, data];
                                db.query('INSERT INTO rooms (room_name, user_id) VALUES (?, ?)', params);
                                db.query('SELECT id FROM room where room_name = ?', roomName, function (err, response) {
                                    let toString = JSON.stringify(response[0].id);
                                    let idOfRoom = JSON.parse(s);
                                    let idMessage = {"id": idOfRoom};
                                    socket.emit('roomId', idMessage);
                                })
                            }
                            else {
                                console.log("room exist");
                                let a = JSON.stringify(roomId[0].id);
                                let roomData = JSON.parse(a);
                                idOfRoom = roomData;
                                db.query('SELECT room_name FROM rooms where id = ?', roomData, function (err, room) {
                                    if (err)
                                        return console.log(err);
                                    else {
                                        let name = JSON.stringify(room[0].room_name);
                                        let userRoom = JSON.parse(name);
                                        socket.join(userRoom);
                                        console.log(userNickname + " : has joined the " + userRoom + " room");
                                        nameOfRoom = userRoom;
                                        let idMessage = {"id": idOfRoom};
                                        // io.sockets.in(nameOfRoom).emit('roomId', idMessage);
                                        socket.emit('roomId', idMessage);
                                        console.log(idMessage);
                                    }
                                });
                            }
                        });
                    }
                });
            });
        });

        socket.on('new message', (user, messageContent, messageDate) => {
            console.log(user + ": " + messageContent);

            let params = [messageContent, messageDate, idOfRoom, idOfUser];

            db.query('INSERT INTO messages (message_text, message_date, room_id, user_id) VALUES(?, ?, ?, ?)', params);

            let message = {"message": messageContent, "user": user, "date": messageDate};

            socket.broadcast.to(nameOfRoom).emit('message', message)
        });

        socket.on('disconnect', function () {

            console.log('User has left ');

            socket.broadcast.emit("user disconnect", ' user has left')
        })
    });

    server.listen(8888,()=>{
        console.log('Node app is running on port 8888')
    });
}