const mysql = require('mysql');

const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;
let choices = [];

//db conneciton
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'codev'
});

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {

    //signin
    socket.on('find', function(data) {
        console.log(data.username);console.log(data.password);
        connection.query("SELECT user_name FROM users WHERE user_name = '" + data.username + "'" + "AND password = '" + data.password + "'"  , (err, res) => {
            console.log(res);
            socket.emit('result', { res: res, username : data.username})
        });
    });

    //signup
    socket.on('insertUser', function(data) {
        connection.query("INSERT INTO users(first_name,last_name,user_name,password,win) VALUES( '" + data.firstname + "'" + ",'" + data.lastname + "','" + data.username + "','" + data.password + "',"+ 0 + ")", (err, res) => {
            console.log("res "+res);
            // if (Array.from(res).length === null)
            socket.emit('checkSignUp', { res: res })
        })
    });

    // Create a new game room and notify the creator of game.
    socket.on('createGame', (data) => {
        socket.join(`room-${++rooms}`);
        socket.emit('newGame', { name: data.name, room: `room-${rooms}` });
    });

    // Connect the Player 2 to the room he requested. Show error if room full.
    socket.on('joinGame', (data) => {
        const room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('player1', {});
            socket.emit('player2', { name: data.name, room: data.room });
        } else {
            socket.emit('err', { message: 'Sorry, The room is full!' });
        }
    });

    socket.on('player choice', (data) => {
        if(data.username != null) {
            if (data.type === "X") {
                choices[0] = {
                    'user': data.username,
                    'choice': data.choice
                };
                console.log('%s chose %s.', data.username, data.choice);
            }
            else {
                choices[1] = {
                    'user': data.username,
                    'choice': data.choice
                };
                console.log('%s chose %s.', data.username, data.choice);
            }
        }

        if (choices.length === 2 && choices[0] != null && choices[1] != null) {
            console.log('[socket.io] Both players have made choices.');
            console.log(choices);

            switch (choices[0].choice) {
                case 'shoot':
                    switch (choices[1].choice) {
                        case 'shoot':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            break;

                        case 'reload':
                            socket.broadcast.to(data.room).emit('player 1 win', choices);
                            socket.emit('player 1 win', choices);
                            break;

                        case 'hedge':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            break;

                        default:
                            break;
                    }
                    break;

                case 'reload':
                    switch (choices[1].choice) {
                        case 'shoot':
                            socket.broadcast.to(data.room).emit('player 2 win', choices);
                            socket.emit('player 2 win', choices);
                            break;

                        case 'reload':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            // socket.to(data.room).emit('tie', choices);
                            break;

                        case 'hedge':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            break;

                        default:
                            break;
                    }
                    break;

                case 'hedge':
                    switch (choices[1].choice) {
                        case 'shoot':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            break;

                        case 'reload':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            break;

                        case 'hedge':
                            socket.broadcast.to(data.room).emit('tie', choices);
                            socket.emit('tie', choices);
                            break;

                        default:
                            break;
                    }
                    break;

                default:
                    break;
            }

            choices = [];
            console.log(choices);
        }
    });

});

server.listen(process.env.PORT || 3000);
