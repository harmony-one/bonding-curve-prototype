import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import * as hre from "hardhat";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying contracts with the account:", deployer);

  // Deploy mock ONE token
  const mockONE = await deploy('MockOne', {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("Mock ONE token deployed to:", mockONE.address);

  // Deploy BondingCurve contract
  const bondingCurve = await deploy('BondingCurve', {
    from: deployer,
    args: [mockONE.address],
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