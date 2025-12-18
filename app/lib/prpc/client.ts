import axios from "axios";
import {
  SEEDS,
  RPC_PORT,
  RPC_PATH,
  RPC_TIMEOUT_MS,
} from "./constants";

export async function callPRPC<T = any>(
  seed: string,
  method: string
): Promise<T> {
  const res = await axios.post(
    `http://${seed}:${RPC_PORT}${RPC_PATH}`,
    {
      jsonrpc: "2.0",
      id: 1,
      method,
    },
    {
      timeout: RPC_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    }
  );

  return res.data.result;
}

export async function callPRPCWithFallback<T = any>(
  method: string
): Promise<T> {
  for (const seed of SEEDS) {
    try {
      return await callPRPC<T>(seed, method);
    } catch (err) {
      console.error(`[pRPC] Seed failed: ${seed}`, err);
    }
  }

  throw new Error("All pNode seeds unreachable");
}
