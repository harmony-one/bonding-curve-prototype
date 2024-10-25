import { Address } from "viem";

export default {
  bondingCurveContractAddress: (process.env.BONDING_CURVE ?? '0x46eD5701b0Bbd4ABEf82C2a8091d7ec5bBB3E7a1') as Address,
  reserveTokenAddress: (process.env.BONDING_CURVE ?? '0x3e604CAfE8a802A320595C27060ADf950eb9C494') as Address,
}
