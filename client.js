/* eslint-disable no-unused-vars,no-restricted-globals */
require('dotenv').config({ path: require('find-config')('.env') })
(function init() {
    // init vars
    const $game = $('#game');
    const $info = $('#info');
    let userFormBd=$('#userFormBd');
    let usernameBd=$("#usernameBd");
    let passwordBd=$("#passwordBd");
    let formSignUp=$("#formSignUp");
    let submitted = false;
    let lives = 3;
    let bullets = 0;

    // initialize infos
    $('#bullets-1').val(bullets);
    $('#live-1').val(lives);
    $('#live-2').val(lives);

    const P1 = 'X';
    const P2 = 'O';
    let player;
    let game;

    const socket = io.connect('${process.env.URI || http://localhost:3000}');

    //Init hearts & bullets icons
    function displayImg(val, id) {
        let htmlStr="";
        if(id == "bullets-1"){
            for(let i=0; i<val; i++) {
                htmlStr+='<img src="images/bullet.png" style="width: 20px;  transform:rotate(90deg);">';
            }
        }
        else {
            for(let i=0; i<val; i++) {
                htmlStr+='<img src="images/heart.png" style="width: 20px;">';
            }
        }
        document.getElementById(id).innerHTML = htmlStr;
    }
    displayImg($('#bullets-1').val(),$('#bullets-1').attr('id'))
    displayImg($('#live-1').val(),$('#live-1').attr('id'))
    displayImg($('#live-2').val(),$('#live-2').attr('id'))

    $('.logo').css('cursor', 'pointer')
    $('.logo').click(function() {
        location.reload();
    });

    function translateChoice(choice) {
        switch (choice) {
            case 'hedge':
                return "protection"
                break;
            case 'shoot':
                return "tir"
                break;
            case 'reload':
                return "rechargement"
                break;
            default:
                return ""
        }
    }


    class Player {
        constructor(name, type, lives, bullets) {
            this.name = name;
            this.type = type;
            this.lives = lives;
            this.bullets = bullets;
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

            $('#roomHello').html('ID : '+ message[1]);
            $('#roomID').val(this.getRoomId());
        }

        getRoomId() {
            return this.roomId;
        }
    }
    // --------STEP 1----------//
    // get to step 2
    //next step without
    $('#next').on('click', () => {
        const name = $('#nickname').val();
        if (!name) {
            alert('Entrez votre nom.');
            return;
        }
        $('#step1').css('display', 'none');
        $('#step2').css('display', 'block');
    });
    // Sign In
    userFormBd.submit(function(e) {
        e.preventDefault();
        socket.emit('find', {username : usernameBd.val(), password :passwordBd.val()});
        usernameBd.val();
        event.preventDefault()
    });

    //if connected go to next step
    socket.on('result', (data) => {
        if (Array.from(data.res).length === 0) {
            alert("mot de passe ou identifiant erroné")
        }
        else{
            $("#nickname").val(data.username);
            $('#step1').css('display', 'none');
            $('#step2').css('display', 'block');
        }
    });

    //Sign Up
    $("#signUp").click( function()
    {
        $('.menu').hide();
        $('#formSignUp').css('display', 'block');
    });

    // form signup
    formSignUp.submit(function(e) {
        e.preventDefault();
        let dataSignUp={
            username : $("#usernameSu").val(),
            password : $("#userPasswordSu").val(),
            firstname: $("#userFirstnameSu").val(),
            lastname:  $("#userLastnameSu").val()
        };
        socket.emit('insertUser',dataSignUp);
        event.preventDefault()
    });

    //check signup if ok go to menu
    socket.on('checkSignUp', (data) => {
        if (Array.from(data.res).length === null) {
            alert("L'inscription a mal tourné !")
        }
        else{
            $('#formSignUp').css('display', 'none');
            $('.menu').show();
        }
    });

    // --------STEP 2----------//
    // Create a new game. Emit newGame event.
    $('#new').on('click', () => {
        const name = $('#nickname').val();
        if (!name) {
            alert('Entrez votre nom.');
            return;
        }
        socket.emit('createGame', { name });
        player = new Player(name, P1, lives, bullets);
    });

    // Join an existing game on the entered roomId. Emit the joinGame event.
    $('#join').on('click', () => {
        const name = $('#nickname').val();
        const roomID = $('#room').val();
        if (!name || !roomID) {
            alert('Entrez un ID correct.');
            return;
        }
        socket.emit('joinGame', { name, room: roomID });
        player = new Player(name, P2, lives, bullets);
    });

    // New Game created by current client. Update the UI and create new Game var.
    socket.on('newGame', (data) => {
        const message =[data.name,data.room];

        // Create game for player 1
        game = new Game(data.room);
        $('#p1').html(message[0]);
        game.displayBoard(message);
    });

    /**
     * If player creates the game, he'll be P1(X) and has the first turn.
     * This event is received when opponent connects to the room.
     // eslint-disable-next-line no-unused-vars
     */
    socket.on('player1', (data) => {
        const message = [data.name,data.room];

        $('#p1').html(message[0]);

    });

    /**
     * Joined the game, so player is P2(O).
     * This event is received when P2 successfully joins the game room.
     */
    socket.on('player2', (data) => {

        const message = [data.name,data.room];
        $('#p2').html(message[0]);
        $info.html('Faites votre choix !');
        // Create game for player 2
        game = new Game(data.room);
        game.displayBoard(message);
    });

    /**
     * End the game on any err event.
     */
    socket.on('err', (data) => {
        game.endGame(data.message);
    });

    socket.on('fullroom', (data) => {
        alert("Cet ID de room n'est pas disponible ou la room est pleine.");
    });

    socket.on('nameplayer1', (data) => {
        $('#p1').html(data.name);
    });


    $value="";
    socket.on('result', function(data) {
        $('#alert').show();
    });


    $('#hedge').click(function(e){
        $value = $('#hedge').val();
        $('#submit').trigger('click'); // équivalent de  $('#lien1').click();
    });

    $('#reload').click(function(e){
        $value = $('#reload').val();
        $('#submit').trigger('click');
        //  $('#submit').trigger('click'); // équivalent de  $('#lien1').click();
    });

    $('#shoot').click(function(e){
        $value = $('#shoot').val();
        $('#submit').trigger('click'); // équivalent de  $('#lien1').click();
    });


    $game.submit(function(e) {
        e.preventDefault();
        let choice = $value;
        const roomID = $('#roomID').val();
        if(!submitted) {

            if(choice === 'reload'){
                player.bullets ++;
                $('#bullets-1').val(player.bullets).change();
                submitted = true;
                socket.emit('player choice',{username : player.name, type : player.type, choice : choice, room: roomID });
                $info.html('En attente de l\'adversaire...');
            }
            if(choice==='shoot'){
                if(player.bullets!==0){
                    player.bullets --;
                    $('#bullets-1').val(player.bullets).change();
                    submitted = true;
                    socket.emit('player choice',{username : player.name, type : player.type, choice : choice, room: roomID });
                    $info.html('En attente de l\'adversaire...');
                }
                else{
                    alert("Vous devez au moins avoir une balle dans votre chargeur pour tirer !")
                }
            }
            if(choice==="hedge"){
                submitted = true;
                socket.emit('player choice', {username : player.name, type : player.type, choice : choice, room: roomID });

                $info.html('En attente de l\'adversaire...');
            }
        }
        else $info.html('Vous avez déjà choisi !');
    });

    socket.on('disconnected', function (username) {
        $info.append('<br />' + username + ' à quitté la salle.');
    });

    socket.on('connected', function (username) {
        $info.append('<br />' + username + ' à rejoint la salle.');
    });

    socket.on('game start', function(data) {
        //  $game.show();
        $('#p2').html(data.name);
        $info.html('<br/>Faites votre choix');
    });


    socket.on('tie', function (choices) {
        countdown(choices);
        setTimeout(function() {
            $info.append("<br/>Tout le monde est sain et sauf !");
        }, 7000);

        setTimeout(function() {
            $info.html("<br/>Faites votre choix !");
            $('#gif1').attr('src', 'waiting.png');
            $('#gif2').attr('src', 'waiting.png');
        }, 9000);

        submitted = false;
    });

    socket.on('player 1 win', function (choices) {
        countdown(choices);

        setTimeout(function () {
            $info.append('<br />' + choices[0]['user'] + ' gagne !');
        }, 5000);
        setTimeout(function() {
            $info.html("<br />Faites votre choix !");
            $('#gif1').attr('src', 'waiting.png');
            $('#gif2').attr('src', 'waiting.png');
        }, 9000);
        if (player.type === "O") {
            player.lives--;
            $('#live-1').val(player.lives).change();
        }
        else {
            $('#live-2').val(parseInt($('#live-2').val()) -1).change();
        }

        if (player.lives === 0 || $('#live-2').val() == '0') {
            if(alert('Player 1 win')){}
            else window.location.reload();
        }
        submitted = false;
    });

    socket.on('player 2 win', function (choices) {
        countdown(choices);

        setTimeout(function () {
            $info.append('<br />' + choices[1]['user'] + ' gagne !');
        }, 5000);
        setTimeout(function() {
            $info.html("<br />Faites votre choix !");
            $('#gif1').attr('src', 'waiting.png');
            $('#gif2').attr('src', 'waiting.png');
        }, 9000);
        if (player.type === "X"){
            player.lives--;
            $('#live-1').val(player.lives).change();
        }
        else {
            $('#live-2').val(parseInt($('#live-2').val()) -1).change();
        }
        if (player.lives === 0 || $('#live-2').val() == '0') {
            if(alert('Player 2 win')){}
            else window.location.reload();
        }
        submitted = false;
    });

    function countdown(choices) {
        setTimeout(function() {
            $info.css({
                'font-size' : '5em',
                'text-align': 'center',
                'margin-right' : 'auto',
                'margin-left' : 'auto',
            });

            $info.html('3...');
        }, 0);
        setTimeout(function() {
            $info.html('2...');
        }, 1000);
        setTimeout(function() {
            $info.html('1...');

        }, 2000);
        setTimeout(function() {
            $info.css({
                'font-size' : '2em', // couleur rouge
            });
            $info.html(choices[0]['user'] + ' a choisi ' + translateChoice(choices[0]['choice']) + '.');
            if(choices[0]['choice']==="hedge"){
                $('#gif1').attr('src', 'images/007_shield.gif').attr('style','transform: scaleX(-1);');
            }
            if(choices[0]['choice']==="reload"){
                $('#gif1').attr('src', 'images/007_reload.gif').attr('style','transform: scaleX(-1);');
            }
            if(choices[0]['choice']==="shoot"){
                $('#gif1').attr('src', 'images/007_shoot.gif').attr('style','transform: scaleX(-1);');
            }

        }, 3000);
        setTimeout(function() {
            if(choices[1]['choice']==="hedge"){
                $('#gif2').attr('src', 'images/007_shield.gif');
            }
            if(choices[1]['choice']==="reload"){
                $('#gif2').attr('src', 'images/007_reload.gif');
            }
            if(choices[1]['choice']==="shoot"){
                $('#gif2').attr('src', 'images/007_shoot.gif');
            }
            $info.append('<br />' + choices[1]['user'] + ' a choisi ' + translateChoice(choices[1]['choice']) + '.');
        }, 5000);
    }
}());
