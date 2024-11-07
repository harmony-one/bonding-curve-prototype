import { parseEther } from "ethers/lib/utils";
import { ethers, deployments } from "hardhat";
import { config } from "../config";

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();
  const [deployer] = await ethers.getSigners()

  const network = await ethers.provider.getNetwork()
  console.log(`Initializing on network ${network.chainId}`)

  if (network.chainId === config.chains.mainnet.chainId) {
    return
  }

  const testAddress = config.metaMaskWallet
  const ethAmount = "1000"

  // Retrieve deployed contract instances
  const MockONE = await deployments.get("MockOne");
  const BondingCurve = await deployments.get("BondingCurve");

  const mockONEContract = await ethers.getContractAt("MockOne", MockONE.address);
  const bondingCurveContract = await ethers.getContractAt("BondingCurve", BondingCurve.address);
  
  console.log("Using MockONE at:", mockONEContract.address);
  console.log("Using BondingCurve at:", bondingCurveContract.address);
  
  const mintAmount = ethers.utils.parseEther("1000000000");
  
  if (network.chainId === config.chains.localhost.chainId) {
    console.log(`Sending ${ethAmount} ETH to ${testAddress}`)
    const tx = await deployer.sendTransaction({
      to: testAddress,
      value: parseEther(ethAmount)
    })

    await tx.wait()

    // Mint MockONE tokens to owner, user1, and BondingCurve contract

    await mockONEContract.mint(owner.address, mintAmount);
    await mockONEContract.mint(user1.address, mintAmount);
  }

  await mockONEContract.mint(testAddress, mintAmount)
  // Log balances
  console.log(`BondingCurve MockONE balance: ${ethers.utils.formatEther(await mockONEContract.balanceOf(bondingCurveContract.address))}`);
  console.log(`testAddress MockONE balance: ${ethers.utils.formatEther(await mockONEContract.balanceOf(testAddress))}`);

  const tokenNames = ["Token1", "Token1", "Token1"];
  const tokenSymbols = ["TKN1", "TKN2", "TKN3"];
  const supplies = [
    [ethers.utils.parseEther("1000"), ethers.utils.parseEther("2000"), ethers.utils.parseEther("3000")],
    [ethers.utils.parseEther("1500"), ethers.utils.parseEther("2500"), ethers.utils.parseEther("3500")],
    [ethers.utils.parseEther("2000"), ethers.utils.parseEther("3000"), ethers.utils.parseEther("4000")]
  ];
  
  const prices = [
    [ethers.utils.parseEther("0.0000000001"), ethers.utils.parseEther("0.0000000002"), ethers.utils.parseEther("0.0000000003")],
    [ethers.utils.parseEther("0.00000000015"), ethers.utils.parseEther("0.00000000025"), ethers.utils.parseEther("0.00000000035")],
    [ethers.utils.parseEther("0.0000000002"), ethers.utils.parseEther("0.0000000003"), ethers.utils.parseEther("0.0000000004")]
  ];

  for (let i = 0; i < 3; i++) {
    await bondingCurveContract.createToken(tokenNames[i], tokenSymbols[i], supplies[i], prices[i]);
    console.log(`Token ${i + 1} created`);
  }
  
  // Get token list
  const tokenList = await bondingCurveContract.getTokenList();
  console.log("Token list:", tokenList);

   // Test buying and selling tokens
   const tokenToTest = tokenList[0].tokenAddress;
   const amountToTest = "10"
   const parsedAmount = ethers.utils.parseEther(amountToTest);
 
   console.log("\n=== Starting Buy/Sell Test ===");
   
   // Approve ONE tokens for spending
   await mockONEContract.connect(user1).approve(bondingCurveContract.address, ethers.constants.MaxUint256);
   console.log("Approved MockONE for spending");
 
   // Get cost before buying
   const buyCost = await bondingCurveContract.getCost(tokenToTest, parsedAmount);
   console.log(`Cost to buy ${amountToTest} tokens: ${ethers.utils.formatEther(buyCost)} ONE`);
 
   // Get initial balances
   const Token = await ethers.getContractAt("Token", tokenToTest);
   console.log("\nInitial Balances:");
   console.log(`User1 MockONE: ${ethers.utils.formatEther(await mockONEContract.balanceOf(user1.address))}`);
   console.log(`User1 Token: ${ethers.utils.formatEther(await Token.balanceOf(user1.address))}`);
   console.log(`BondingCurve MockONE: ${ethers.utils.formatEther(await mockONEContract.balanceOf(bondingCurveContract.address))}`);
 
   // Buy tokens
   try {
     console.log("\nAttempting to buy tokens...");
     const buyTx = await bondingCurveContract.connect(user1).buy(tokenToTest, parsedAmount);
     await buyTx.wait();
     console.log(`Successfully bought ${amountToTest} tokens for ${ethers.utils.formatEther(buyCost)} ONE`);
   } catch (error: any) {
     console.error("Error while buying tokens:", error);
     process.exit(1);
   }
 
   // Check balances after buying
   console.log("\nBalances after buying:");
   console.log(`User1 MockONE: ${ethers.utils.formatEther(await mockONEContract.balanceOf(user1.address))}`);
   console.log(`User1 Token: ${ethers.utils.formatEther(await Token.balanceOf(user1.address))}`);
   console.log(`BondingCurve MockONE: ${ethers.utils.formatEther(await mockONEContract.balanceOf(bondingCurveContract.address))}`);
 
   // Get refund amount before selling
   const refundAmount = await bondingCurveContract.getRefund(tokenToTest, parsedAmount);
   console.log(`\nExpected refund for selling ${amountToTest} tokens: ${ethers.utils.formatEther(refundAmount)} ONE`);
 
   // Approve tokens for selling
   await Token.connect(user1).approve(bondingCurveContract.address, parsedAmount);
   console.log("Approved tokens for selling");
 
   // Sell tokens
   try {
     console.log("\nAttempting to sell tokens...");
     const sellTx = await bondingCurveContract.connect(user1).sell(tokenToTest, parsedAmount);
     await sellTx.wait();
     console.log(`Successfully sold ${amountToTest} tokens for ${ethers.utils.formatEther(refundAmount)} ONE`);
   } catch (error: any) {
     console.error("Error while selling tokens:", error);
     if (error.data) {
       try {
         const decodedError = bondingCurveContract.interface.parseError(error.data);
         console.error("Decoded error:", decodedError);
       } catch {
         console.error("Raw error data:", error.data);
       }
     }
   }
 
   // Check final balances
   console.log("\nFinal Balances:");
   console.log(`User1 MockONE: ${ethers.utils.formatEther(await mockONEContract.balanceOf(user1.address))}`);
   console.log(`User1 Token: ${ethers.utils.formatEther(await Token.balanceOf(user1.address))}`);
   console.log(`BondingCurve MockONE: ${ethers.utils.formatEther(await mockONEContract.balanceOf(bondingCurveContract.address))}`);
 }

  // // Test buying tokens
  // const tokenToBuy = tokenList[0].tokenAddress;
  // const amountToBuy = "10" 
  // const paresdamountToBuy = ethers.utils.parseEther(amountToBuy); 

  // // Approve ONE tokens for spending
  // await mockONE.connect(user1).approve(bondingCurve.address, ethers.constants.MaxUint256);
  // console.log("Approved MockONE for spending");

  // // Get cost before buying
  // const cost = await bondingCurve.getCost(tokenToBuy, paresdamountToBuy);
  // console.log(`Cost to buy ${amountToBuy} tokens: ${ethers.utils.formatEther(cost)} ONE`);

  // // Check balances before buying
  // console.log(`User1 MockONE balance before buying: ${ethers.utils.formatEther(await mockONE.balanceOf(user1.address))}`);
  // console.log(`BondingCurve MockONE balance before buying: ${ethers.utils.formatEther(await mockONE.balanceOf(bondingCurve.address))}`);

  // // Buy tokens
  // try {
  //   const tx = await bondingCurve.connect(user1).buy(tokenToBuy, paresdamountToBuy);
  //   await tx.wait();
  //   console.log(`Bought ${ethers.utils.formatEther(amountToBuy)} tokens for ${ethers.utils.formatEther(cost)} ONE`);
  // } catch (error: any) {
  //   console.error("Error while buying tokens:", error.message);
  //   if (error.data) {
  //     const decodedError = bondingCurve.interface.parseError(error.data);
  //     console.error("Decoded error:", decodedError);
  //   }
  // }

  // // Check balances after buying (or attempting to buy)
  // console.log(`User1 MockONE balance after buying: ${ethers.utils.formatEther(await mockONE.balanceOf(user1.address))}`);
  // console.log(`BondingCurve MockONE balance after buying: ${ethers.utils.formatEther(await mockONE.balanceOf(bondingCurve.address))}`);

  // const Token = await ethers.getContractFactory("Token");
  // const token = Token.attach(tokenToBuy);
  // console.log(`User1 Token balance after buying: ${ethers.utils.formatEther(await token.balanceOf(user1.address))}`);
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });