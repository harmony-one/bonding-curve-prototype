pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
        
        // Create new ERC20 token
        ERC20 newToken = new ERC20(name, symbol);
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
        IERC20(token).transfer(msg.sender, amount);
        emit TokensPurchased(token, msg.sender, amount, cost);
    }

    function sell(address token, uint256 amount) external {
        uint256 refund = getRefund(token, amount);
        IERC20(token).transferFrom(msg.sender, address(this), amount);
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
        uint256 refund = 0;
        Step[] storage steps = tokenBond[token].steps;
        
        for (uint256 i = steps.length; i > 0; i--) {
            uint256 stepSupply = steps[i-1].supply;
            if (supply <= stepSupply) {
                continue; // Skip steps that are not filled
            }
            
            uint256 availableInStep = supply - stepSupply;
            uint256 saleInStep = Math.min(amount, availableInStep);
            
            refund += saleInStep * steps[i-1].price;
            amount -= saleInStep;
            supply -= saleInStep;
            
            if (amount == 0) break;
        }
        
        require(amount == 0, "Not enough tokens to sell");
        return refund;
    }

    function getTokenList() public view returns (TokenInfo[] memory) {
        return tokens;
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
}