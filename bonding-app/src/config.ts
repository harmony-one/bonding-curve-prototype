import { Address } from "viem";

export default {
  bondingCurveContractAddress: (process.env.NEXT_PUBLIC_BONDING_CURVE ?? '0x72E85670bb63760218a424e82FAa28e5Bb330C2a') as Address,
  reserveTokenAddress: (process.env.NEXT_PUBLIC_RESERVE_TOKEN ?? '0x3e604CAfE8a802A320595C27060ADf950eb9C494') as Address,
}
