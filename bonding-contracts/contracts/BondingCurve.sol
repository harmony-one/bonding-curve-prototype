// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Token.sol";

contract BondingCurve is Ownable {
    struct Step {
        uint256 supply;
        uint256 price;
    }

    struct Bond {
        uint256 reserveBalance;
        Step[] steps;
    }

    struct TokenInfo {
        string name;
        string symbol;
        address tokenAddress;
    }
    
    struct TokenInfoWithPrice {
        string name;
        string symbol;
        address tokenAddress;
        uint256 currentPrice;
        uint256 totalSupply;
    }

    IERC20 public reserveToken;
    TokenInfo[] public tokens;
    mapping(address => Bond) public tokenBond;
    mapping(address => TokenInfo) public tokenInfo;
    address public currentWinner;
    uint256 public lastUpdateTime;

    event TokensPurchased(address token, address buyer, uint256 amount, uint256 cost);
    event TokensSold(address token, address seller, uint256 amount, uint256 refund);
    event DailyWinnerUpdated(address winner);
    event TokenAdded(address token, string name, string symbol);

    constructor(address _reserveToken) {
        reserveToken = IERC20(_reserveToken);
    }

    function createToken(string memory name, string memory symbol, uint256[] memory _supplies, uint256[] memory _prices) external onlyOwner {
        require(_supplies.length == _prices.length, "Supplies and prices must have the same length");
        
        // Create new Token contract
        Token newToken = new Token(name, symbol, address(this));
        address tokenAddress = address(newToken);
        
        // Add token info
        TokenInfo memory newTokenInfo = TokenInfo(name, symbol, tokenAddress);
        tokens.push(newTokenInfo);
        tokenInfo[tokenAddress] = newTokenInfo;

        // Set up bonding curve
        Bond storage newBond = tokenBond[tokenAddress];
        for (uint256 i = 0; i < _supplies.length; i++) {
            newBond.steps.push(Step(_supplies[i], _prices[i]));
        }

        emit TokenAdded(tokenAddress, name, symbol);
    }

    function buy(address token, uint256 amount) external {
        uint256 cost = getCost(token, amount);
        reserveToken.transferFrom(msg.sender, address(this), cost);
        tokenBond[token].reserveBalance += cost;
        Token(token).mint(msg.sender, amount);
        emit TokensPurchased(token, msg.sender, amount, cost);
    }

    function sell(address token, uint256 amount) external {
        uint256 refund = getRefund(token, amount);
        Token(token).burn(msg.sender, amount);
        tokenBond[token].reserveBalance -= refund;
        reserveToken.transfer(msg.sender, refund);
        emit TokensSold(token, msg.sender, amount, refund);
    }

    function getCost(address token, uint256 amount) public view returns (uint256) {
        uint256 supply = IERC20(token).totalSupply();
        uint256 cost = 0;
        Step[] storage steps = tokenBond[token].steps;
        
        for (uint256 i = 0; i < steps.length; i++) {
            if (supply >= steps[i].supply) {
                continue; // Skip fully filled steps
            }
            
            uint256 stepSupply = (i == steps.length - 1) ? type(uint256).max : steps[i].supply;
            uint256 availableInStep = stepSupply - supply;
            uint256 purchaseInStep = Math.min(amount, availableInStep);
            
            cost += purchaseInStep * steps[i].price;
            amount -= purchaseInStep;
            supply += purchaseInStep;
            
            if (amount == 0) break;
        }
        
        require(amount == 0, "Not enough supply in bonding curve");
        return cost;
    }

   function getRefund(address token, uint256 amount) public view returns (uint256) {
        uint256 supply = IERC20(token).totalSupply();
        uint256 remainingAmount = amount;
        uint256 refund = 0;
        uint256 currentSupply = supply;
        
        require(supply >= amount, "Not enough tokens to sell");
        
        Step[] storage steps = tokenBond[token].steps;
        
        // Start from the highest step where we have tokens
        for (uint256 i = 0; i < steps.length; i++) {
            uint256 stepUpperBound = steps[i].supply;
            uint256 stepLowerBound = i > 0 ? steps[i-1].supply : 0;
            
            // If we're not in this step's range, continue
            if (currentSupply <= stepLowerBound) continue;
            
            // Calculate how many tokens are in this step
            uint256 tokensInStep = currentSupply - stepLowerBound;
            uint256 saleInStep = remainingAmount > tokensInStep ? tokensInStep : remainingAmount;
            
            // Add refund for this step
            refund += saleInStep * steps[i].price;
            remainingAmount -= saleInStep;
            currentSupply -= saleInStep;
            
            if (remainingAmount == 0) break;
        }
        
        require(remainingAmount == 0, "Refund calculation failed");
        return refund;
    }

    function getTokenList() public view returns (TokenInfo[] memory) {
        return tokens;
    }

    function getTokenListWithPrice() public view returns (TokenInfoWithPrice[] memory) {
        uint256 tokenCount = tokens.length;
        TokenInfoWithPrice[] memory tokenList = new TokenInfoWithPrice[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            address tokenAddress = tokens[i].tokenAddress;
            uint256 supply = IERC20(tokenAddress).totalSupply();
            uint256 price = getCurrentPrice(tokenAddress);

            tokenList[i] = TokenInfoWithPrice(
                tokens[i].name,
                tokens[i].symbol,
                tokenAddress,
                price,
                supply
            );
        }

        return tokenList;
    }

    function getCurrentPrice(address token) public view returns (uint256) {
        uint256 supply = IERC20(token).totalSupply();
        Step[] storage steps = tokenBond[token].steps;
        
        for (uint256 i = 0; i < steps.length; i++) {
            if (supply < steps[i].supply) {
                return steps[i].price;
            }
        }
        
        return steps[steps.length - 1].price; // Return the last price if supply exceeds all steps
    }

    function getTopLiquidityToken() public view returns (address topToken, uint256 maxLiquidity) {
        uint256 tokensLength = tokens.length;
        for (uint256 i = 0; i < tokensLength; i++) {
            address token = tokens[i].tokenAddress;
            uint256 liquidity = tokenBond[token].reserveBalance;
            if (liquidity > maxLiquidity) {
                maxLiquidity = liquidity;
                topToken = token;
            }
        }
        return (topToken, maxLiquidity);
    }

    function updateDailyWinner() external onlyOwner {
        require(block.timestamp >= lastUpdateTime + 1 days, "24 hours have not passed");
        (address newWinner, ) = getTopLiquidityToken();
        currentWinner = newWinner;
        lastUpdateTime = block.timestamp;
        emit DailyWinnerUpdated(newWinner);
    }

    function getTokenSteps(address token) public view returns (Step[] memory) {
        return tokenBond[token].steps;
    }

    function getTokenStepCount(address token) public view returns (uint256) {
        return tokenBond[token].steps.length;
    }

    function getTokenStepAt(address token, uint256 index) public view returns (Step memory) {
        require(index < tokenBond[token].steps.length, "Index out of bounds");
        return tokenBond[token].steps[index];
    }
}