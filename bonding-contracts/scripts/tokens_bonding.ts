import { ethers, deployments } from "hardhat";

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();

  // Retrieve deployed contract instances
  const MockONE = await deployments.get("MockOne");
  const BondingCurve = await deployments.get("BondingCurve");

  const mockONE = await ethers.getContractAt("MockOne", MockONE.address);
  const bondingCurve = await ethers.getContractAt("BondingCurve", BondingCurve.address);

  console.log("Using MockONE at:", mockONE.address);
  console.log("Using BondingCurve at:", bondingCurve.address);

  // Mint MockONE tokens to owner, user1, and BondingCurve contract
  const mintAmount = ethers.utils.parseEther("10000");
  await mockONE.mint(owner.address, mintAmount);
  await mockONE.mint(user1.address, mintAmount);
  await mockONE.mint(bondingCurve.address, mintAmount);

  // Log balances
  console.log(`BondingCurve MockONE balance: ${ethers.utils.formatEther(await mockONE.balanceOf(bondingCurve.address))}`);
  console.log(`User1 MockONE balance: ${ethers.utils.formatEther(await mockONE.balanceOf(user1.address))}`);

  const tokenNames = ["Token1", "Token2", "Token3"];
  const tokenSymbols = ["TKN1", "TKN2", "TKN3"];
  const supplies = [[1000, 2000, 3000], [1500, 2500, 3500], [2000, 3000, 4000]];
  const prices = [[100, 200, 300], [150, 250, 350], [200, 300, 400]];

  for (let i = 0; i < 3; i++) {
    await bondingCurve.createToken(tokenNames[i], tokenSymbols[i], supplies[i], prices[i]);
    console.log(`Token ${i + 1} created`);
  }
  
  // Get token list
  const tokenList = await bondingCurve.getTokenList();
  console.log("Token list:", tokenList);

  // Test buying tokens
  const tokenToBuy = tokenList[0].tokenAddress;
  const amountToBuy = ethers.utils.parseEther("1");

  // Approve ONE tokens for spending
  await mockONE.connect(user1).approve(bondingCurve.address, ethers.constants.MaxUint256);
  console.log("Approved MockONE for spending");

  // Get cost before buying
  const cost = await bondingCurve.getCost(tokenToBuy, amountToBuy);
  console.log(`Cost to buy ${ethers.utils.formatEther(amountToBuy)} tokens: ${ethers.utils.formatEther(cost)} ONE`);

  // Check balances before buying
  console.log(`User1 MockONE balance before buying: ${ethers.utils.formatEther(await mockONE.balanceOf(user1.address))}`);
  console.log(`BondingCurve MockONE balance before buying: ${ethers.utils.formatEther(await mockONE.balanceOf(bondingCurve.address))}`);

  // Buy tokens
  try {
    const tx = await bondingCurve.connect(user1).buy(tokenToBuy, amountToBuy);
    await tx.wait();
    console.log(`Bought ${ethers.utils.formatEther(amountToBuy)} tokens for ${ethers.utils.formatEther(cost)} ONE`);
  } catch (error: any) {
    console.error("Error while buying tokens:", error.message);
    if (error.data) {
      const decodedError = bondingCurve.interface.parseError(error.data);
      console.error("Decoded error:", decodedError);
    }
  }

  // Check balances after buying (or attempting to buy)
  console.log(`User1 MockONE balance after buying: ${ethers.utils.formatEther(await mockONE.balanceOf(user1.address))}`);
  console.log(`BondingCurve MockONE balance after buying: ${ethers.utils.formatEther(await mockONE.balanceOf(bondingCurve.address))}`);

  const Token = await ethers.getContractFactory("Token");
  const token = Token.attach(tokenToBuy);
  console.log(`User1 Token balance after buying: ${ethers.utils.formatEther(await token.balanceOf(user1.address))}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });