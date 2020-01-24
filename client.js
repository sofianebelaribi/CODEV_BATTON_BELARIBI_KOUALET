/* eslint-disable no-unused-vars,no-restricted-globals */
(function init() {
    // test
    const $users = $('#users');
    const $username = $('#username');
    const $game = $('#game');
    const $info = $('#info');
    let submitted = false;
    let lives = 3;
    let bullets = 3;
    // initialize infos
    $('#bullets').text(bullets);
    $('#live-1').text(lives);
    $('#live-2').text(lives);

    const P1 = 'X';
    const P2 = 'O';
    let player;
    let game;

    // const socket = io.connect('http://tic-tac-toe-realtime.herokuapp.com'),
    const socket = io.connect('http://localhost:5000');

    class Player {
        constructor(name, type, lives, bullets) {
            this.name = name;
            this.type = type;
            this.lives = lives;
            this.bullets = bullets;
        }

        getPlayerName() {
            return this.name;
        }
    }

    // roomId Id of the room in which the game is running on the server.
    class Game {
        constructor(roomId) {
            this.roomId = roomId;
        }

        // Remove the menu from DOM, display the gameboard and greet the player.
        displayBoard(message) {
            $('.menu').css('display', 'none');
            $('#gameArea').css('display', 'block');
            $('#userHello').html(message);
            $('#roomID').val(this.getRoomId());
        }

        getRoomId() {
            return this.roomId;
        }
    }

    // Create a new game. Emit newGame event.
    $('#new').on('click', () => {
        const name = $('#nameNew').val();
        if (!name) {
            alert('Please enter your name.');
            return;
        }
        socket.emit('createGame', { name });
        player = new Player(name, P1, lives, bullets);
    });

    // Join an existing game on the entered roomId. Emit the joinGame event.
    $('#join').on('click', () => {
        const name = $('#nameJoin').val();
        const roomID = $('#room').val();
        if (!name || !roomID) {
            alert('Please enter your name and game ID.');
            return;
        }
        socket.emit('joinGame', { name, room: roomID });
        player = new Player(name, P2, lives, bullets);
    });

    // New Game created by current client. Update the UI and create new Game var.
    socket.on('newGame', (data) => {
        const message =
            `Hello, ${data.name}. Please ask your friend to enter Game ID: 
      ${data.room}. Waiting for player 2...`;

        // Create game for player 1
        game = new Game(data.room);
        game.displayBoard(message);
    });

    /**
     * If player creates the game, he'll be P1(X) and has the first turn.
     * This event is received when opponent connects to the room.
     // eslint-disable-next-line no-unused-vars
     */
    socket.on('player1', (data) => {
        console.log(data);
        const message = `Hello, ${player.getPlayerName()}`;
        $('#userHello').html(message);
    });

    /**
     * Joined the game, so player is P2(O).
     * This event is received when P2 successfully joins the game room.
     */
    socket.on('player2', (data) => {
        console.log(data);

        const message = `Hello, ${data.name}`;

        // Create game for player 2
        game = new Game(data.room);
        game.displayBoard(message);
    });

    // /**
    //  * End the game on any err event.
    //  */
    // socket.on('err', (data) => {
    //   game.endGame(data.message);
    // });


    socket.on('result', function(data) {
        $('#alert').show();
    });

    $game.submit(function(e) {
        e.preventDefault();
        var choice = $('input[name=choice]:checked').val();
        console.log(choice);
        console.log(player);
        console.log(player.name);
        console.log(player.lives);
        console.log(player.bullets);
        console.log($('#roomID').val());
        const roomID = $('#roomID').val();
        if(!submitted) {

            if(choice == 'reload'){
                player.bullets ++;
                $('#bullets').text(player.bullets);
                submitted = true;

                socket.emit('player choice',{username : player.name, type : player.type, choice : choice, room: roomID });
                $info.html('Waiting for other player...');
            }
            if(choice=='shoot'){
                if(player.bullets!=0){
                    player.bullets --;
                    $('#bullets').text(player.bullets);
                    submitted = true;
                    socket.emit('player choice',{username : player.name, type : player.type, choice : choice, room: roomID });
                    $info.html('Waiting for other player...');
                }
                else{
                    alert("You must have at least one bullet in the clip to fire!")
                }
            }
            if(choice=="hedge"){
                submitted = true;
                socket.emit('player choice', {username : player.name, type : player.type, choice : choice, room: roomID });

                $info.html('Waiting for other player...');
            }
        }
        else $info.html('You have already made a choice!');
    });

    socket.on('disconnected', function (username) {
        $info.append('<br />' + username + ' left the room.');
    });

    socket.on('connected', function (username) {
        $info.append('<br />' + username + ' joined the room.');
    });

    socket.on('game start', function() {
        $game.show();
        $info.append('<br />Make your choice.');
    });

    socket.on('tie', function (choices) {
        console.log("this is a tie");
        countdown(choices);
        setTimeout(function() {
            $info.append("<br />Everybody's still alive !");
        }, 5000);

        submitted = false;
    });

    socket.on('player 1 win', function (choices) {
        console.log("player 1 win");
        console.log(player);

        countdown(choices);

        setTimeout(function () {
            $info.append('<br />' + choices[0]['user'] + ' wins!');
        }, 5000);
        console.log(player.type);
        if (player.type === "O") {
            console.log("player.type is O");
            player.lives--;
            $('#live-1').text(player.lives);
        }
        else {
            $('#live-2').text(parseInt($('#live-2').text()) -1);
        }

        if (player.lives === 0 || $('#live-2').text() == '0') {
            if(alert('Player 1 win')){}
            else window.location.reload();
        }
        submitted = false;
    });

    socket.on('player 2 win', function (choices) {
        console.log("player 2 win");
        console.log(player);
        countdown(choices);

        setTimeout(function () {
            $info.append('<br />' + choices[1]['user'] + ' wins!');
        }, 5000);
        console.log(player.type);
        if (player.type === "X"){
            console.log("player.type is X");
            player.lives--;
            $('#live-1').text(player.lives);
        }
        else {
            $('#live-2').text(parseInt($('#live-2').text()) -1);
        }
        if (player.lives === 0 || $('#live-2').text() == '0') {
            if(alert('Player 2 win')){}
            else window.location.reload();
        }
        submitted = false;
    });

    function countdown(choices) {
        setTimeout(function() {
            $info.html('3...');
        }, 0);
        setTimeout(function() {
            $info.html('2...');
        }, 1000);
        setTimeout(function() {
            $info.html('1...');
        }, 2000);
        setTimeout(function() {
            $info.html(choices[0]['user'] + ' picked ' + choices[0]['choice'] + '.');
        }, 3000);
        setTimeout(function() {
            $info.append('<br />' + choices[1]['user'] + ' picked ' + choices[1]['choice'] + '.');
        }, 4000);
    }

}());
