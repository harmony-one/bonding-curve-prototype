import { Address } from "viem";

export default {
  bondingCurveContractAddress: (process.env.BONDING_CURVE ?? '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as Address,
  reserveTokenAddress: (process.env.BONDING_CURVE ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3') as Address,
}

