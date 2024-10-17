// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BuyBackBurner is Ownable {
    IERC20 public tokenToBurn;
    IERC20 public paymentToken;

    event TokensBought(uint256 amount);
    event TokensBurned(uint256 amount);

    constructor(address _tokenToBurn, address _paymentToken) {
        tokenToBurn = IERC20(_tokenToBurn);
        paymentToken = IERC20(_paymentToken);
    }

    // TBD
}