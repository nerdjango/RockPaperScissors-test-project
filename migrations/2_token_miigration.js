const RPSToken = artifacts.require("RPSToken");

module.exports = async function (deployer) {
  await deployer.deploy(RPSToken);
};
