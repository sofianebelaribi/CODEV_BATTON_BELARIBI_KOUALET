const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;
let choices = [];


app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
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
            console.log(choices)

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
