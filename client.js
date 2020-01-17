$(function init() {
  var socket = io.connect();
  var $messageForm = $('#messageForm');
  var $message = $('#message');
  var $chat = $('#chat');
  var $gameArea = $('#gameArea');
  var $userFormArea = $('#userFormArea');
  var $userForm = $('#userForm');
  var $users = $('#users');
  var $username = $('#username');
  var $game = $('#game');
  var $info = $('#info');
  var submitted = false;
  var bulletNumber = 0;
  $('#bullets').text(bulletNumber);
  var liveNumberP1 = 3;
  var liveNumberP2 = 3;
  $('#live-1').text(liveNumberP1);
  $('#live-2').text(liveNumberP2);
  var userFormBd=$('#userFormBd');
  var sp = $('#sp');
  let usernameBd=$("#usernameBd");
  var $alert = $('#alert');
  var $signUp=$('#signUp');
  let $usernameSu=$('#usernameSu');
  let $userPasswordSu=$('#userPasswordSu');
  let $userFirstnameSu=$('#userFirstnameSu');
  let $userLastnameSu=$('#userLastnameSu');




  $alert.hide();
  $signUp.hide();


  $messageForm.submit(function(e) {
    e.preventDefault();
    socket.emit('send message', $message.val());
    $message.val('');
  });

  $("#btn-signUp").click( function()
  {
    $userFormArea.hide();
    userFormBd.hide();
    $gameArea.hide();
    $game.hide();
    $alert.hide();
    $signUp.show();
  }
);

socket.on('room full', function() {
  $('#login').hide();
  $('#game').show();
  $('#login').off('click');
});


socket.on('result', function(data) {
  $('#alert').show();
})


$game.submit(function(e) {
  e.preventDefault();
  var choice = $('input[name=choice]:checked').val();
  console.log(choice);



  if(!submitted)
  {

    if(choice == 'reload'){
      bulletNumber ++;
      $('#bullets').text(bulletNumber);
      submitted = true;

      console.log(usernameBd);
      socket.emit('player choice', $username.val(), usernameBd.val(), choice);
      $info.html('Waiting for other player...');
    }
    if(choice=='shoot'){
      if(bulletNumber!=0){
        bulletNumber --;
        $('#bullets').text(bulletNumber);
        submitted = true;
        socket.emit('player choice', $username.val(), usernameBd.val(), choice);
        $info.html('Waiting for other player...');
      }
      else{
        alert("You must have at least one bullet in the clip to fire!")
      }
    }
    if(choice=="hedge"){
      submitted = true;
      socket.emit('player choice', $username.val(), usernameBd.val(), choice);

      $info.html('Waiting for other player...');
    }
  }
  else $info.html('You have already made a choice!');
});



socket.on('new message', function(data) {
  var enableAutoScroll = enableAutoScroll = ($($chat)[0].scrollHeight - $chat.scrollTop()) === $chat.outerHeight();
  $chat.append('<div class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');

  if(enableAutoScroll)
  {
    $chat.stop().animate({ scrollTop: $chat[0].scrollHeight}, 500);
  }
});

$userFormArea.submit(function(e) {
  e.preventDefault();

  socket.emit('add user', $username.val(), function(data) {
    if(data)
    {
      $userFormArea.hide();
      userFormBd.hide();
      $gameArea.show();
      $game.hide();
      $alert.hide();
      $signUp.hide();
    }
    else
    {
      alert($username.val() + " username is already in use.");
    }
  });

  $username.val();
});



//BD

userFormBd.submit(function(e) {
  e.preventDefault();
  // console.log(srphno.value)
  socket.emit('find', usernameBd.val(), function(data) {
    if(data)
    {
      $userFormArea.hide();
      userFormBd.hide();
      $gameArea.show();
      $game.hide();
      $alert.hide();
      $signUp.hide();
    }
    else
    {
      alert(usernameBd.val() + " username is already in use in this game");
    }
  })
  usernameBd.val();
  event.preventDefault()
})


$signUp.submit(function(e) {
  e.preventDefault();
  // console.log(srphno.value)
  var dataSignUp={
    username : $usernameSu.val(),
    password : $userPasswordSu.val(),
    firstname: $userFirstnameSu.val(),
    lastname: $userLastnameSu.val()
  };
  socket.emit('insertUser',dataSignUp, function(data){
    if (data){
      $userFormArea.hide();
      userFormBd.hide();
      $gameArea.show();
      $game.hide();
      $alert.hide();
      $signUp.hide();
    }
  })
  event.preventDefault()
})
// Fin BD

socket.on('get user', function(data) {
  var html = '';

  for (i = 0; i < data.length; i++)
  {
    html += '<li class="list-group-item">' + data[i] + '</li>';
  }

  $users.html(html);
  $('#player1').text(data[0]);
  $('#player2').text(data[1]);
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


socket.on('home', function(){
  $userFormArea.show();
  userFormBd.show();
  $gameArea.hide();
  $game.hide();
  $alert.hide();
  $signUp.hide();

});



socket.on('tie', function (choices) {
  countdown(choices);

  setTimeout(function() {
    $info.append("<br />Everybody's still alive !");
  }, 5000);

  submitted = false;
});

socket.on('player 1 win', function (choices) {
        countdown(choices);

        setTimeout(function () {
            $info.append('<br />' + choices[0]['user'] + ' wins!');
            liveNumberP2 --;
            $('#live-2').text(liveNumberP2);
            if(liveNumberP2==0){
              if(alert('Player 1 win')){}
              else    window.location.reload();
            }

            submitted = false;
        }, 5000);
    });

    socket.on('player 2 win', function (choices) {
          countdown(choices);

          setTimeout(function() {
              $info.append('<br />' + choices[1]['user'] + ' wins!');
              liveNumberP1 --;
              $('#live-1').text(liveNumberP1);
              if(liveNumberP1==0){
                if(alert('Player 2 win')){}
                else    window.location.reload();
              }
              submitted = false;
          }, 5000);
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







});
