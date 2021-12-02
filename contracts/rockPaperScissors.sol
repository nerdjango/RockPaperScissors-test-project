// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RockPaperScissors{
    constructor(address tokenAddress){
        GameTokenAddress=tokenAddress;
    }
    mapping(address=>uint) public balances;

    uint public nextGameId=0;
    enum Move {
        NULL,
        ROCK,
        PAPER,
        SCISSORS
    }
    struct Game {
        uint id;
        address player1;
        Move p1Move;
        address player2;
        Move p2Move;
        uint stake;
        address winner;
        bool tie;
        bool gameOver;
        bool canceled;
    }

    Game[] Games;

    address GameTokenAddress;

    function deposit(uint amount) external {
        IERC20(GameTokenAddress).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender]+=amount;
    }

    function withdraw(uint amount) external {
        require(balances[msg.sender]>=amount, "Insufficient Balance!");
        balances[msg.sender]-=amount;
        IERC20(GameTokenAddress).transfer(msg.sender, amount);
    }

    function startGame(address opponent, uint stake, Move move) external {
        require(balances[msg.sender] >= stake, "Insufficient Balance");
        require(balances[opponent] >= stake, "Your opponent has insufficient balance to partipate");
        require(move!=Move.NULL, "Invalid move. Enter 1, 2, or 3");
        require(uint(move)<=3, "Invalid move. Enter 1, 2, or 3");
        for (uint i=0; i<Games.length; i++){
            if (Games[i].gameOver==false){
                require(Games[i].player1 != msg.sender && Games[i].player2 != msg.sender, "You can only participate in one game at a time. Complete or cancel your pending game");
                require(Games[i].player1 != opponent && Games[i].player2 != opponent, "Your opponent can only participate in one game at a time. Ask them to complete or cancel their pending game");
            }
        }
        Games.push(
            Game(nextGameId, msg.sender, move, opponent, Move.NULL, stake, 0x0000000000000000000000000000000000000000, false, false, false)
        );
        nextGameId++;
    }

    function getPendingGameDetails() external view returns(uint id, uint stake, address opponent){
        for (uint i=0; i<Games.length; i++){
            if ((Games[i].player1==msg.sender || Games[i].player2==msg.sender) && Games[i].gameOver==false){
                id=Games[i].id;
                stake=Games[i].stake;
                if (Games[i].player1==msg.sender){
                    opponent=Games[i].player2;
                }else{
                    opponent=Games[i].player1;
                }
            }
        }
    }

    function makeMove(uint id, Move move) external {
        require(msg.sender!=Games[id].player1, "You've played your turn");
        require(msg.sender==Games[id].player2, "You've played your turn");
        require(balances[Games[id].player1]>=Games[id].stake, "Your opponent has insufficient balance. Ask them to make a deposit to continue or cancel the game");
        require(balances[msg.sender]>=Games[id].stake, "You have insufficient balance, make deposit to contract or delete the game");
        require(move!=Move.NULL, "Invalid move. Enter 1, 2, or 3");
        require(uint(move)<=3, "Invalid move. Enter 1, 2, or 3");

        if (move==Games[id].p1Move){
            Games[id].tie=true;
            Games[id].gameOver=true;
        }else if(move==Move.ROCK && Games[id].p1Move==Move.PAPER){
            Games[id].winner=Games[id].player1;
            Games[id].gameOver=true;
            balances[msg.sender]-=Games[id].stake;
            balances[Games[id].player1]+=Games[id].stake;
        }else if(move==Move.ROCK && Games[id].p1Move==Move.SCISSORS){
            Games[id].winner=msg.sender;
            Games[id].gameOver=true;
            balances[msg.sender]+=Games[id].stake;
            balances[Games[id].player1]-=Games[id].stake;
        }else if(move==Move.PAPER && Games[id].p1Move==Move.ROCK){
            Games[id].winner=msg.sender;
            Games[id].gameOver=true;
            balances[msg.sender]+=Games[id].stake;
            balances[Games[id].player1]-=Games[id].stake;
        }else if(move==Move.PAPER && Games[id].p1Move==Move.SCISSORS){
            Games[id].winner=Games[id].player1;
            Games[id].gameOver=true;
            balances[msg.sender]-=Games[id].stake;
            balances[Games[id].player1]+=Games[id].stake;
        }else if(move==Move.SCISSORS && Games[id].p1Move==Move.ROCK){
            Games[id].winner=Games[id].player1;
            Games[id].gameOver=true;
            balances[msg.sender]-=Games[id].stake;
            balances[Games[id].player1]+=Games[id].stake;
        }else if(move==Move.SCISSORS && Games[id].p1Move==Move.PAPER){
            Games[id].winner=msg.sender;
            Games[id].gameOver=true;
            balances[msg.sender]+=Games[id].stake;
            balances[Games[id].player1]-=Games[id].stake;
        }
    }

    function cancelGame(uint id) external {
        require(msg.sender==Games[id].player2 || msg.sender==Games[id].player1, "You're not a participant of this game");
        if ((Games[id].player1==msg.sender || Games[id].player2==msg.sender) && Games[id].gameOver==false){
            Games[id].canceled=true;
            Games[id].gameOver=true;
        }
    }
    

}