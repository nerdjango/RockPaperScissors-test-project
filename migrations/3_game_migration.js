const Game = artifacts.require("RockPaperScissors");
const Token = artifacts.require("RPSToken");

module.exports = async function(deployer) {
    const token = await Token.deployed();
    const tokenAddress = token.address;
    await deployer.deploy(Game, tokenAddress);
};