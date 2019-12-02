(function init() {

  var backgrounds = [];
  var currentBackground = 0;

  //Event handler to randomize the games background page
  $("#randomize").click(function (func){
    func.preventDefault();
    if(backgrounds.length==0)
    {
      loadJSON("/gamepage/js/backgrounds.json");
    } else {
      loadRand();
    }
  })

  function loadJSON(filename){
    $.getJSON(filename).done(function(items){

      backgrounds = [];
      $.each(items, function() {//Append each link to an array
          backgrounds.push(this);
      })
      loadRand();

    }).fail(function(){console.log("Call failed!")})
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  function loadRand()
  {
      let index = getRandomInt(backgrounds.length);//Randomly pick background
      while(currentBackground==index)
      {
        index = getRandomInt(backgrounds.length);//Randomly pick background
      }
      // console.log(backgrounds,backgrounds[index]["link"]);
      document.body.style.backgroundImage = "url(/gamepage/images/"+backgrounds[index]["link"]+")";//load background chosen
      currentBackground = index;
  }

  const P1 = 'X';
  const P2 = 'O';
  let player;
  let game;

  const socket = io.connect('http://localhost:3002');

  class Player {
    constructor(name, type) {
      this.name = name;
      this.type = type;
      this.currentTurn = true;
      this.playsArr = 0;
      this.hasWon = false;
    }

    static get wins() {
      return [7, 56, 448, 73, 146, 292, 273, 84];
    }

    // Set the bit of the move played by the player
    // tileValue - Bitmask used to set the recently played move.
    updatePlaysArr(tileValue) {
      this.playsArr += tileValue;
    }

    getPlaysArr() {
      return this.playsArr;
    }

    // Set the currentTurn for player to turn and update UI to reflect the same.
    setCurrentTurn(turn) {
      this.currentTurn = turn;
      const message = turn ? 'Your turn' : 'Waiting for Opponent';
      $('#turn').text(message);
    }

    sendWinnerStats() {
      socket.emit('updateStats', {
        tie: false,
        winner: this.getPlayerName(),
      });
    }

    sendTiedStats() {
      if (this.getPlayerType == P1) {
        socket.emit('updateStats', {
          tie: true,
          p1: this.getPlayerName(),
        });
      }
      else {
        socket.emit('updateStats', {
          tie: true,
          p2: this.getPlayerName(),
        });
      }
    }

    sendLoserStats() {
      socket.emit('updateStats', {
        tie: false,
        loser: this.getPlayerName(),
      });
    }

    getPlayerName() {
      return this.name;
    }

    getPlayerType() {
      return this.type;
    }

    getCurrentTurn() {
      return this.currentTurn;
    }
  }

  // roomId Id of the room in which the game is running on the server.
  class Game {
    constructor(roomId) {
      this.roomId = roomId;
      this.board = [];
      this.moves = 0;
    }

    // Create the Game board by attaching event listeners to the buttons.
    createGameBoard() {
      function tileClickHandler() {
        const row = parseInt(this.id.split('_')[1][0], 10);
        const col = parseInt(this.id.split('_')[1][1], 10);
        if (!player.getCurrentTurn() || !game) {
          return;
        }

        if ($(this).prop('disabled')) {
          alert('This tile has already been played on!');
          return;
        }

        // Update board after your turn.
        game.playTurn(this);
        game.updateBoard(player.getPlayerType(), row, col, this.id);

        player.setCurrentTurn(false);
        player.updatePlaysArr(1 << ((row * 3) + col));

        game.checkWinner();
      }

      for (let i = 0; i < 3; i++) {
        this.board.push(['', '', '']);
        for (let j = 0; j < 3; j++) {
          $(`#button_${i}${j}`).on('click', tileClickHandler);
        }
      }
    }
    // Remove the menu from DOM, display the gameboard and greet the player.
    displayBoard(message) {
      $('.menu').css('display', 'none');
      $('.gameBoard').css('display', 'block');
      $('#userHello').html(message);
      this.createGameBoard();
    }
    /**
     * Update game board UI
     *
     * @param {string} type Type of player(X or O)
     * @param {int} row Row in which move was played
     * @param {int} col Col in which move was played
     * @param {string} tile Id of the the that was clicked
     */
    updateBoard(type, row, col, tile) {
      $(`#${tile}`).text(type).prop('disabled', true);
      this.board[row][col] = type;
      this.moves++;
    }

    getRoomId() {
      return this.roomId;
    }

    // Send an update to the opponent to update their UI's tile
    playTurn(tile) {
      const clickedTile = $(tile).attr('id');

      // Emit an event to update other player that you've played your turn.
      socket.emit('playTurn', {
        tile: clickedTile,
        room: this.getRoomId(),
      });
    }
    /**
     *
     * To determine a win condition, each square is "tagged" from left
     * to right, top to bottom, with successive powers of 2.  Each cell
     * thus represents an individual bit in a 9-bit string, and a
     * player's squares at any given time can be represented as a
     * unique 9-bit value. A winner can thus be easily determined by
     * checking whether the player's current 9 bits have covered any
     * of the eight "three-in-a-row" combinations.
     *
     *     273                 84
     *        \               /
     *          1 |   2 |   4  = 7
     *       -----+-----+-----
     *          8 |  16 |  32  = 56
     *       -----+-----+-----
     *         64 | 128 | 256  = 448
     *       =================
     *         73   146   292
     *
     *  We have these numbers in the Player.wins array and for the current
     *  player, we've stored this information in playsArr.
     */

    checkWinner() {
      const currentPlayerPositions = player.getPlaysArr();

      Player.wins.forEach((winningPosition) => {
        if ((winningPosition & currentPlayerPositions) === winningPosition) {
          game.announceWinner();
        }
      });

      const tieMessage = 'Game Tied :(';
      if (this.checkTie()) {
        player.sendTiedStats();
        socket.emit('gameEnded', {
          room: this.getRoomId(),
          message: tieMessage,
        });
        alert(tieMessage);
        location.reload();
      }
    }

    checkTie() {
      return this.moves >= 9;
    }

    // Announce the winner if the current client has won. 
    // Broadcast this on the room to let the opponent know.
    announceWinner() {
      player.hasWon = true;
      player.sendWinnerStats();
      const message = `${player.getPlayerName()} wins!`;
      socket.emit('gameEnded', {
        room: this.getRoomId(),
        message,
      });
      alert(message);
      location.reload();
    }

    // End the game if the other player won.
    endGame(message) {
      if (!player.hasWon && !this.checkTie()) {
        player.sendLoserStats();
      }
      else if (!player.hasWon && this.checkTie()) {
        player.sendTiedStats();
      }
      socket.emit('gameEnded', {
        room: this.getRoomId(),
        message,
      });
      alert(message);
      location.reload();
    }
  }

  // Create a new game. Emit newGame event.
  $('#new').on('click', () => {
    console.log("Clicking")
    const name = $('#nameNew').val();
    socket.emit('createGame', { name });
    player = new Player(name, P1);
  });

  // Join an existing game on the entered roomId. Emit the joinGame event.
  $('#join').on('click', () => {
    const name = $('#nameJoin').val();
    const roomID = $('#room').val();
    if (!name || !roomID) {
      alert('Please enter a game ID.');
      return;
    }
    socket.emit('joinGame', { name, room: roomID });
    player = new Player(name, P2);
  });

  // New Game created by current client. Update the UI and create new Game var.
  socket.on('newGame', (data) => {
    const message =
      `Hello, ${data.name}. Please ask your friend to enter Game ID: 
        ${data.room}. Waiting for Opponent...`;

    // Create game for player 1
    game = new Game(data.room);
    game.displayBoard(message);
  });

  /**
     * If player creates the game, he'll be P1(X) and has the first turn.
     * This event is received when opponent connects to the room.
     */
  socket.on('player1', (data) => {
    const message = `Hello, ${player.getPlayerName()}`;
    $('#userHello').html(message);
    player.setCurrentTurn(true);

  });

  /**
     * Joined the game, so player is P2(O). 
     * This event is received when P2 successfully joins the game room. 
     */
  socket.on('player2', (data) => {
    const message = `Hello, ${data.name}`;

    // Create game for player 2
    game = new Game(data.room);
    game.displayBoard(message);
    player.setCurrentTurn(false);
  });

  /**
     * Opponent played his turn. Update UI.
     * Allow the current player to play now. 
     */
  socket.on('turnPlayed', (data) => {
    const row = data.tile.split('_')[1][0];
    const col = data.tile.split('_')[1][1];
    const opponentType = player.getPlayerType() === P1 ? P2 : P1;

    game.updateBoard(opponentType, row, col, data.tile);
    player.setCurrentTurn(true);
  });

  // If the other player wins, this event is received. Notify user game has ended.
  socket.on('gameEnd', (data) => {
    game.endGame(data.message);
    socket.leave(data.room);
  });

  /**
     * End the game on any err event. 
     */
  socket.on('err', (data) => {
    game.endGame(data.message);
  });
}());