import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import * as hre from "hardhat";
import { ethers } from 'hardhat';
import { config } from '../config';

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  let reserveToken

  const network = await ethers.provider.getNetwork()
  console.log(`Initializing on network ${network.chainId}`)

  if (network.chainId === config.chains.mainnet.chainId) {
    const WONE = '0xcf664087a5bb0237a0bad6742852ec6c8d69a27a'
    reserveToken = '0xcf664087a5bb0237a0bad6742852ec6c8d69a27a'
  } else {
    // Deploy mock ONE token
    const mockONE = await deploy('MockOne', {
      from: deployer,
      args: [],
      log: true,
    });
    reserveToken = mockONE.address
    console.log(" Mock ONE token deployed to:", mockONE.address);
  }
  
  console.log("Deploying contracts with the account:", deployer);
  
  console.log("Reseve Token address", reserveToken);


  // Deploy BondingCurve contract
  const bondingCurve = await deploy('BondingCurve', {
    from: deployer,
    args: [reserveToken],
    log: true,
  });

  console.log("BondingCurve deployed to:", bondingCurve.address);
};


async function main() {
  await deployContracts(hre)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });