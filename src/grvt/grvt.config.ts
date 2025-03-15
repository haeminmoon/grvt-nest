import { Logger } from "@nestjs/common";

export enum GrvtEnv {
  DEV = "dev",
  STAGING = "staging",
  TESTNET = "testnet",
  PROD = "prod",
}

export interface GrvtEndpointConfig {
  rpcEndpoint: string;
  wsEndpoint: string | null;
}

export interface GrvtEnvConfig {
  edge: GrvtEndpointConfig;
  tradeData: GrvtEndpointConfig;
  marketData: GrvtEndpointConfig;
  chainId: number;
}

export interface GrvtApiConfig {
  env: GrvtEnv;
  tradingAccountId: string | null;
  privateKey: string | null;
  apiKey: string | null;
  logger: Logger | null;
}

export function getEnvConfig(environment: GrvtEnv): GrvtEnvConfig {
  switch (environment) {
    case GrvtEnv.PROD:
      return {
        edge: {
          rpcEndpoint: "https://edge.grvt.io",
          wsEndpoint: null,
        },
        tradeData: {
          rpcEndpoint: "https://trades.grvt.io",
          wsEndpoint: "wss://trades.grvt.io/ws",
        },
        marketData: {
          rpcEndpoint: "https://market-data.grvt.io",
          wsEndpoint: "wss://market-data.grvt.io/ws",
        },
        chainId: 325,
      };
    case GrvtEnv.TESTNET:
      return {
        edge: {
          rpcEndpoint: `https://edge.${environment}.grvt.io`,
          wsEndpoint: null,
        },
        tradeData: {
          rpcEndpoint: `https://trades.${environment}.grvt.io`,
          wsEndpoint: `wss://trades.${environment}.grvt.io/ws`,
        },
        marketData: {
          rpcEndpoint: `https://market-data.${environment}.grvt.io`,
          wsEndpoint: `wss://market-data.${environment}.grvt.io/ws`,
        },
        chainId: 326,
      };
    case GrvtEnv.DEV:
    case GrvtEnv.STAGING:
      return {
        edge: {
          rpcEndpoint: `https://edge.${environment}.gravitymarkets.io`,
          wsEndpoint: null,
        },
        tradeData: {
          rpcEndpoint: `https://trades.${environment}.gravitymarkets.io`,
          wsEndpoint: `wss://trades.${environment}.gravitymarkets.io/ws`,
        },
        marketData: {
          rpcEndpoint: `https://market-data.${environment}.gravitymarkets.io`,
          wsEndpoint: `wss://market-data.${environment}.gravitymarkets.io/ws`,
        },
        chainId: environment === GrvtEnv.DEV ? 327 : 328,
      };
    default:
      throw new Error(`Unknown environment=${environment}`);
  }
}
