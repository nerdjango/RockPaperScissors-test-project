//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RPSToken is ERC20 {
    constructor() ERC20("RPS Token", "RPS") {
        _mint(msg.sender,1000);
    }
}