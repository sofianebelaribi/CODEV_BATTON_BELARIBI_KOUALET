var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
const mysql = require('mysql');
users = [];
connections = [];
choices = [];

server.listen(process.env.PORT || 3000);
console.log('Sever running...');
app.use(express.static('.'));
app.get('/', function(rer, res) {
    res.sendFile(__dirname + '/index.html')
});

io.sockets.on('connection', function(socket) {
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);
  const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test'
  })

  connection.query("SELECT id FROM users WHERE user_name='admin'", (err, res) => {
          //socket.emit('userslist', res)
           console.log(res)
      })

      // BD
          socket.on('find', function(data, callback) {
              const connection = mysql.createConnection({
                  host: 'localhost',
                  user: 'root',
                  password: '',
                  database: 'test'
              })
              socket.usernameBd = data;
              console.log(data)
              var query="SELECT id FROM users WHERE user_name = '" + data + "'"
              console.log(query)
              connection.query("SELECT user_name FROM users WHERE user_name = '" + data + "'", (err, res) => {
                  console.log(res)
                  if (Array.from(res).length === 0) {
                      socket.emit('result', [{ name: 'not found' }])
                  } else {

                    users.push(socket.usernameBd);
                    updateUsernames();
                    callback(true);
                          // if(err) console.log('oh no!!')
                          // console.log(pid[0].person_id)
                          if (Object.keys(users).length == 2)
                          {
                              io.emit('connected', socket.usernameBd);
                              io.emit('game start');
                          }
                  }
              })
          })

          socket.on('insertUser', function(data) {
              const connection = mysql.createConnection({
                  host: 'localhost',
                  user: 'root',
                  password: '',
                  database: 'test'
              })
              // console.log(data.user)
              connection.query(`INSERT INTO users(id,first_name,last_name,user_name,password,win) VALUES(${socket.user}, ${data.password},${data.firstname},${data.last_name}, ${Number(data.win)})`, (err, res) => console.log(res))
          })







    socket.on('disconnect', function(data) {

      if(socket.usernameBd){
        users.splice(users.indexOf(socket.usernameBd), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1)
        io.emit('disconnected', socket.usernameBd);
      }
      if(socket.username){
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1)
        io.emit('disconnected', socket.username);
      }

        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('send message', function(data) {
      if(socket.usernameBd){
        io.sockets.emit('new message', {msg: data, user: socket.usernameBd});
      }
      else{
        io.sockets.emit('new message', {msg: data, user: socket.username});
      }


    });

    socket.on('add user', function(data, callback) {
        socket.username = data;

        if(users.indexOf(socket.username) > -1)
        {
            callback(false);
        }
        else
        {
            users.push(socket.username);
            updateUsernames();
            callback(true);

            if (Object.keys(users).length == 2)
            {
                io.emit('connected', socket.username);
                io.emit('game start');
            }
        }
    });









    socket.on('player choice', function (username, usernameBd, choice) {


        if(usernameBd != null && username==''){
            choices.push({'user': usernameBd, 'choice': choice});
            console.log('%s chose %s.', usernameBd, choice);
        }
        if(username != null & usernameBd==''){
          choices.push({'user': username, 'choice': choice});
          console.log('%s chose %s.', username, choice);
        }



        if(choices.length == 2)
        {
            console.log('[socket.io] Both players have made choices.');

            switch (choices[0]['choice'])
            {
                case 'shoot':
                    switch (choices[1]['choice'])
                    {
                        case 'shoot':
                            io.emit('player 1 & 2 win', choices);
                            break;

                        case 'reload':
                            io.emit('player 1 win', choices);
                            break;

                        case 'hedge':
                            io.emit('tie', choices);
                            break;

                        default:
                            break;
                    }
                    break;

                case 'reload':
                    switch (choices[1]['choice'])
                    {
                        case 'shoot':
                            io.emit('player 2 win', choices);
                            break;

                        case 'reload':
                            io.emit('tie', choices);
                            break;

                        case 'hedge':
                            io.emit('tie', choices);
                            break;

                        default:
                            break;
                    }
                break;

                case 'hedge':
                    switch (choices[1]['choice'])
                    {
                        case 'shoot':
                            io.emit('tie', choices);
                            break;

                        case 'reload':
                            io.emit('tie', choices);
                            break;

                        case 'hedge':
                            io.emit('tie', choices);
                            break;

                        default:
                            break;
                    }
                    break;

                default:
                    break;
            }

            choices = [];
        }
    });

    function updateUsernames() {
        io.sockets.emit('get user', users);
    }
});
