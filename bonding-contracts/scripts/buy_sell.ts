import { deployments, ethers } from "hardhat";

async function debugTokenSteps(bondingCurveContract: any, mockONEContract: any, token: string, signer: any) {
  try {
    console.log("\nInitial Token Bond Details:");
    const Token = await ethers.getContractAt("Token", token);
    const initialSupply = await Token.totalSupply();
    console.log("Initial Total Supply:", ethers.utils.formatEther(initialSupply));
    
    // Buy some tokens first
    console.log("\n=== Buying Tokens ===");
    const amountToBuy = ethers.utils.parseEther("10");
    const cost = await bondingCurveContract.getCost(token, amountToBuy);
    console.log("Cost for 10 tokens:", ethers.utils.formatEther(cost), "ONE");

    // Mint some ONE tokens to the signer if needed
    const mintAmount = ethers.utils.parseEther("2000000000");
    await mockONEContract.mint(signer.address, mintAmount);
    console.log("Minted ONE tokens to signer");

    // Approve tokens for spending
    await mockONEContract.connect(signer).approve(bondingCurveContract.address, cost);
    console.log("Approved ONE tokens for spending");
    
    // Buy tokens
    console.log("Executing buy transaction...");
    const buyTx = await bondingCurveContract.connect(signer).buy(token, amountToBuy);
    await buyTx.wait();
    
    // Get new balances
    const newBalance = await Token.balanceOf(signer.address);
    const newSupply = await Token.totalSupply();
    console.log("\nAfter buying:");
    console.log("Token balance:", ethers.utils.formatEther(newBalance));
    console.log("Total supply:", ethers.utils.formatEther(newSupply));

  } catch (e) {
    console.error("Error in debugTokenSteps:", e);
  }
}

const main = async () => {
  const [signer] = await ethers.getSigners();
  const MockONE = await deployments.get("MockOne");
  const BondingCurve = await deployments.get("BondingCurve");

  const mockONEContract = await ethers.getContractAt("MockOne", MockONE.address);
  const bondingCurveContract = await ethers.getContractAt("BondingCurve", BondingCurve.address);

  // Create new token with verified steps
  console.log("Creating new token...");
  const tokenToTest = await recreateToken(bondingCurveContract);
  console.log("New token address:", tokenToTest);

  // Debug current state and buy tokens
  console.log("\n=== Testing Buy Operation ===");
  await debugTokenSteps(bondingCurveContract, mockONEContract, tokenToTest, signer);

  // Test refund calculations after buying
  console.log("\n=== Testing Refund Calculations ===");
  const testAmounts = ["1", "5", "10"];
  for (const amount of testAmounts) {
    try {
      const refund = await bondingCurveContract.getRefund(
        tokenToTest, 
        ethers.utils.parseEther(amount)
      );
      console.log(`\nRefund for ${amount} tokens: ${ethers.utils.formatEther(refund)} ONE`);
    } catch (e: any) {
      console.log(`\nError getting refund for ${amount} tokens:`, e.reason || e.message);
    }
  }
}

// Helper function to recreate token (same as before)
async function recreateToken(bondingCurveContract: any) {
  const supplies = [
    ethers.utils.parseEther("1000"), 
    ethers.utils.parseEther("2000"), 
    ethers.utils.parseEther("3000")
  ];
  
  const prices = [
    ethers.utils.parseEther("0.0000000001"),
    ethers.utils.parseEther("0.0000000002"),
    ethers.utils.parseEther("0.0000000003")
  ];

  console.log("\nCreating new token with steps:");
  console.log("Supplies:", supplies.map(s => ethers.utils.formatEther(s)));
  console.log("Prices:", prices.map(p => ethers.utils.formatEther(p)));

  const tx = await bondingCurveContract.createToken(
    "Token1",
    "TKN1",
    supplies,
    prices
  );
  
  await tx.wait();
  
  const tokenList = await bondingCurveContract.getTokenList();
  return tokenList[tokenList.length - 1].tokenAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });