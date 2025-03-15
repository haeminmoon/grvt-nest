import { Injectable } from "@nestjs/common";
import { ethers } from "ethers";
import { GrvtApiConfig } from "../grvt.config";
import { Order, Transfer, Withdrawal } from "../constants/types";
import { Currency, TimeInForce } from "../constants/enums";

const PRICE_MULTIPLIER = 1_000_000_000;
const TOKEN_DECIMALS = 1_000_000; // USDT has 6 decimals

enum SignTimeInForce {
  GOOD_TILL_TIME = 1,
  ALL_OR_NONE = 2,
  IMMEDIATE_OR_CANCEL = 3,
  FILL_OR_KILL = 4,
}

const TIME_IN_FORCE_MAP = {
  [TimeInForce.GOOD_TILL_TIME]: SignTimeInForce.GOOD_TILL_TIME,
  [TimeInForce.ALL_OR_NONE]: SignTimeInForce.ALL_OR_NONE,
  [TimeInForce.IMMEDIATE_OR_CANCEL]: SignTimeInForce.IMMEDIATE_OR_CANCEL,
  [TimeInForce.FILL_OR_KILL]: SignTimeInForce.FILL_OR_KILL,
};

const CHAIN_IDS = {
  dev: 327,
  staging: 327,
  testnet: 326,
  prod: 325,
};

@Injectable()
export class GrvtSigningService {
  private readonly wallet: ethers.Wallet;

  constructor(private readonly config: GrvtApiConfig) {
    if (!config.privateKey) {
      throw new Error("Private key is not set");
    }
    this.wallet = new ethers.Wallet(config.privateKey);
  }

  private getDomainData() {
    return {
      name: "GRVT Exchange",
      version: "0",
      chainId: CHAIN_IDS[this.config.env],
    };
  }

  async signOrder(
    order: Order,
    instruments: Record<string, any>
  ): Promise<Order> {
    const domain = this.getDomainData();
    const types = {
      Order: [
        { name: "subAccountID", type: "uint64" },
        { name: "isMarket", type: "bool" },
        { name: "timeInForce", type: "uint8" },
        { name: "postOnly", type: "bool" },
        { name: "reduceOnly", type: "bool" },
        { name: "legs", type: "OrderLeg[]" },
        { name: "nonce", type: "uint32" },
        { name: "expiration", type: "int64" },
      ],
      OrderLeg: [
        { name: "assetID", type: "uint256" },
        { name: "contractSize", type: "uint64" },
        { name: "limitPrice", type: "uint64" },
        { name: "isBuyingContract", type: "bool" },
      ],
    };

    const legs = order.legs.map((leg) => {
      const instrument = instruments[leg.instrument];
      const sizeMultiplier = Math.pow(10, instrument.baseDecimals);
      const sizeInt = BigInt(Number(leg.size) * sizeMultiplier);
      const priceInt = BigInt(Number(leg.limitPrice) * PRICE_MULTIPLIER);

      return {
        assetID: instrument.instrumentHash,
        contractSize: sizeInt,
        limitPrice: priceInt,
        isBuyingContract: leg.isBuyingAsset,
      };
    });

    const message = {
      subAccountID: order.subAccountId,
      isMarket: order.isMarket || false,
      timeInForce: TIME_IN_FORCE_MAP[order.timeInForce],
      postOnly: order.postOnly || false,
      reduceOnly: order.reduceOnly || false,
      legs,
      nonce: order.signature.nonce,
      expiration: order.signature.expiration,
    };

    const signature = await this.wallet._signTypedData(domain, types, message);
    const { r, s, v } = ethers.Signature.from(signature);

    order.signature.r = r;
    order.signature.s = s;
    order.signature.v = v;
    order.signature.signer = await this.wallet.getAddress();

    return order;
  }

  async signTransfer(transfer: Transfer): Promise<Transfer> {
    const domain = this.getDomainData();
    const types = {
      Transfer: [
        { name: "fromAccount", type: "address" },
        { name: "fromSubAccount", type: "uint64" },
        { name: "toAccount", type: "address" },
        { name: "toSubAccount", type: "uint64" },
        { name: "tokenCurrency", type: "uint8" },
        { name: "numTokens", type: "uint64" },
        { name: "nonce", type: "uint32" },
        { name: "expiration", type: "int64" },
      ],
    };

    const message = {
      fromAccount: transfer.fromAccountId,
      fromSubAccount: transfer.fromSubAccountId,
      toAccount: transfer.toAccountId,
      toSubAccount: transfer.toSubAccountId,
      tokenCurrency: Currency[transfer.currency],
      numTokens: BigInt(Number(transfer.numTokens) * TOKEN_DECIMALS),
      nonce: transfer.signature.nonce,
      expiration: transfer.signature.expiration,
    };

    const signature = await this.wallet._signTypedData(domain, types, message);
    const { r, s, v } = ethers.Signature.from(signature);

    transfer.signature.r = r;
    transfer.signature.s = s;
    transfer.signature.v = v;
    transfer.signature.signer = await this.wallet.getAddress();

    return transfer;
  }

  async signWithdrawal(withdrawal: Withdrawal): Promise<Withdrawal> {
    const domain = this.getDomainData();
    const types = {
      Withdrawal: [
        { name: "fromAccount", type: "address" },
        { name: "toEthAddress", type: "address" },
        { name: "tokenCurrency", type: "uint8" },
        { name: "numTokens", type: "uint64" },
        { name: "nonce", type: "uint32" },
        { name: "expiration", type: "int64" },
      ],
    };

    const message = {
      fromAccount: withdrawal.fromAccountId,
      toEthAddress: withdrawal.toEthAddress,
      tokenCurrency: Currency[withdrawal.currency],
      numTokens: BigInt(Number(withdrawal.numTokens) * TOKEN_DECIMALS),
      nonce: withdrawal.signature.nonce,
      expiration: withdrawal.signature.expiration,
    };

    const signature = await this.wallet._signTypedData(domain, types, message);
    const { r, s, v } = ethers.Signature.from(signature);

    withdrawal.signature.r = r;
    withdrawal.signature.s = s;
    withdrawal.signature.v = v;
    withdrawal.signature.signer = await this.wallet.getAddress();

    return withdrawal;
  }
}
