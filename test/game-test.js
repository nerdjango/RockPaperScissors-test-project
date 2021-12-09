const Game = artifacts.require("RockPaperScissors");
const RPCToken = artifacts.require("RPSToken");
const truffleAssert = require("truffle-assertions")

contract("rockPaperScissors", accounts => {
    it("should allow a user to start game with the right move if they have sufficient balance to. ", async() => {
        let game = await Game.deployed();
        let token = await RPCToken.deployed();
        await token.transfer(accounts[1], 100)

        let user0_balance = await game.balances(accounts[0])
        let user1_balance = await game.balances(accounts[1])

        assert.equal(user0_balance.toNumber(), 0)
        assert.equal(user1_balance.toNumber(), 0)

        await truffleAssert.reverts(game.startGame(accounts[1], 10, 1)) // starting game with insufficient balance should revert

        await token.approve(game.address, 100)
        await game.deposit(100)

        user0_balance = await game.balances(accounts[0])
        user1_balance = await game.balances(accounts[1])

        assert.equal(user0_balance.toNumber(), 100)
        assert.equal(user1_balance.toNumber(), 0)

        await truffleAssert.reverts(game.startGame(accounts[1], 10, 1)) // starting game when your opponent has insufficient balance should revert

        await token.approve(game.address, 100, { from: accounts[1] })
        await game.deposit(100, { from: accounts[1] })

        user0_balance = await game.balances(accounts[0])
        user1_balance = await game.balances(accounts[1])

        await truffleAssert.reverts(game.startGame(accounts[1], 10, 0)) // starting game with NULL move should revert

        await truffleAssert.reverts(game.startGame(accounts[1], 10, 4)) // starting game with invalid move should revert

        await truffleAssert.passes(game.startGame(accounts[1], 10, 1)) // starting game with valid move should and sufficient balance should pass 

        assert.equal(user0_balance.toNumber(), 100)
        assert.equal(user1_balance.toNumber(), 100)
    })
    it("should prevent user from start or participate in new game if they have a currently active game. ", async() => {
        let game = await Game.deployed();
        let token = await RPCToken.deployed();

        let pending = await game.getPendingGameDetails()
        assert.equal(pending["id"].toNumber(), 0)
        assert.equal(pending["stake"].toNumber(), 10)
        assert.equal(pending["opponent"], accounts[1])

        pending = await game.getPendingGameDetails({ from: accounts[1] })
        assert.equal(pending["id"].toNumber(), 0)
        assert.equal(pending["stake"].toNumber(), 10)
        assert.equal(pending["opponent"], accounts[0])

        await truffleAssert.reverts(game.startGame(accounts[1], 10, 1)) // Should reverts as user has an active game

        await token.transfer(accounts[2], 100)
        await token.approve(game.address, 100, { from: accounts[2] })
        await game.deposit(100, { from: accounts[2] })
        await truffleAssert.reverts(game.startGame(accounts[1], 10, 1, { from: accounts[2] })) // Should reverts as the opponent already has an active game
    })
    it("should prevent a user from making a move if they initiated the game or aren't part of the game", async() => {
        let game = await Game.deployed();
        let token = await RPCToken.deployed();
        await truffleAssert.reverts(game.makeMove(0, 2, { from: accounts[2] })); // Should revert as user is not part of this particular game
        await truffleAssert.reverts(game.makeMove(0, 2)); // Should revert as user initiated the game and has made his own move
    })
    it("should allow a opponent to make move if they haven't made a move, as long as the move is valid ", async() => {
        let game = await Game.deployed();
        let token = await RPCToken.deployed();

        await game.withdraw(100, { from: accounts[1] })

        let user1_balance = await game.balances(accounts[1])
        assert.equal(user1_balance.toNumber(), 0)
        await truffleAssert.reverts(game.makeMove(0, 2, { from: accounts[1] })) // Should revert as user has insufficient funds
        await token.approve(game.address, 100, { from: accounts[1] })
        await game.deposit(100, { from: accounts[1] })

        user1_balance = await game.balances(accounts[1])
        assert.equal(user1_balance.toNumber(), 100)

        await game.withdraw(100)

        let user0_balance = await game.balances(accounts[0])
        assert.equal(user0_balance.toNumber(), 0)
        await truffleAssert.reverts(game.makeMove(0, 2, { from: accounts[1] })) // Should revert as opponent has insufficient funds
        await token.approve(game.address, 100)
        await game.deposit(100)

        user0_balance = await game.balances(accounts[0])
        assert.equal(user0_balance.toNumber(), 100)
        await truffleAssert.reverts(game.makeMove(0, 0, { from: accounts[1] })) // Should revert as move is NULL
        await truffleAssert.reverts(game.makeMove(0, 4, { from: accounts[1] })) // Should revert as move is invalid
        await truffleAssert.passes(game.makeMove(0, 2, { from: accounts[1] })) // Should pass as move and balances are in check

        user0_balance = await game.balances(accounts[0])
        user1_balance = await game.balances(accounts[1])
        assert.equal(user1_balance.toNumber(), 110) // won 10 RPSToken in last game
        assert.equal(user0_balance.toNumber(), 90) // lost 10 RPSToken in last game
    })
    it("should allow a user to cancel game if they decide not to play", async() => {
        let game = await Game.deployed();
        let token = await RPCToken.deployed();
        await truffleAssert.passes(game.startGame(accounts[1], 10, 1, { from: accounts[2] })) // Should pass as the opponent is free

        let pending = await game.getPendingGameDetails({ from: accounts[2] })
        assert.equal(pending["id"].toNumber(), 1)
        assert.equal(pending["stake"].toNumber(), 10)
        assert.equal(pending["opponent"], accounts[1])

        pending = await game.getPendingGameDetails({ from: accounts[1] })
        assert.equal(pending["id"].toNumber(), 1)
        assert.equal(pending["stake"].toNumber(), 10)
        assert.equal(pending["opponent"], accounts[2])

        await truffleAssert.reverts(game.cancelGame(1)) // should revert as user is not a participant of the game 

        pending = await game.getPendingGameDetails({ from: accounts[2] })
        assert.equal(pending["id"].toNumber(), 1)
        assert.equal(pending["stake"].toNumber(), 10)
        assert.equal(pending["opponent"], accounts[1])

        pending = await game.getPendingGameDetails({ from: accounts[1] })
        assert.equal(pending["id"].toNumber(), 1)
        assert.equal(pending["stake"].toNumber(), 10)
        assert.equal(pending["opponent"], accounts[2])

        await truffleAssert.passes(game.cancelGame(1, { from: accounts[2] })) // should pass as user is a participant of the game 

        pending = await game.getPendingGameDetails({ from: accounts[2] })
        assert.equal(pending["id"].toNumber(), 0)
        assert.equal(pending["stake"].toNumber(), 0)
        assert.equal(pending["opponent"], 0x0000000000000000000000000000000000000000)

        pending = await game.getPendingGameDetails({ from: accounts[1] })
        assert.equal(pending["id"].toNumber(), 0)
        assert.equal(pending["stake"].toNumber(), 0)
        assert.equal(pending["opponent"], 0x0000000000000000000000000000000000000000)
    })
})