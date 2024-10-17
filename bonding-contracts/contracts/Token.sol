
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    address public bondingCurve;

    constructor(string memory name, string memory symbol, address _bondingCurve) ERC20(name, symbol) {
        require(_bondingCurve != address(0), "Bonding curve address cannot be zero");
        bondingCurve = _bondingCurve;
    }

    function updateBondingCurve(address _newBondingCurve) external onlyOwner {
        require(_newBondingCurve != address(0), "New bonding curve address cannot be zero");
        bondingCurve = _newBondingCurve;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == bondingCurve, "Only bonding curve can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == bondingCurve, "Only bonding curve can burn");
        _burn(from, amount);
    }
}