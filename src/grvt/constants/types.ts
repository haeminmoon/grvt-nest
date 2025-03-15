import {
  Currency,
  Kind,
  MarginType,
  OrderRejectReason,
  OrderStatus,
  TimeInForce,
  TransferType,
  TriggerBy,
  TriggerType,
  Venue,
} from "./enums";

export interface Signature {
  signer: string;
  r: string;
  s: string;
  v: number;
  expiration: string;
  nonce: number;
}

export interface OrderLeg {
  instrument: string;
  size: string;
  isBuyingAsset: boolean;
  limitPrice?: string;
}

export interface TPSLOrderMetadata {
  triggerBy: TriggerBy;
  triggerPrice: string;
}

export interface TriggerOrderMetadata {
  triggerType: TriggerType;
  tpsl: TPSLOrderMetadata;
}

export interface OrderMetadata {
  clientOrderId: string;
  trigger?: TriggerOrderMetadata;
  createTime?: string;
  broker?: string;
}

export interface OrderState {
  status: OrderStatus;
  rejectReason: OrderRejectReason;
  bookSize: string[];
  tradedSize: string[];
  updateTime: string;
  avgFillPrice: string[];
}

export interface Order {
  subAccountId: string;
  timeInForce: TimeInForce;
  legs: OrderLeg[];
  signature: Signature;
  metadata: OrderMetadata;
  orderId?: string;
  isMarket?: boolean;
  postOnly?: boolean;
  reduceOnly?: boolean;
  state?: OrderState;
}

export interface Transfer {
  fromAccountId: string;
  fromSubAccountId: string;
  toAccountId: string;
  toSubAccountId: string;
  currency: Currency;
  numTokens: string;
  signature: Signature;
  transferType: TransferType;
  transferMetadata: string;
}

export interface Withdrawal {
  fromAccountId: string;
  toEthAddress: string;
  currency: Currency;
  numTokens: string;
  signature: Signature;
}

export interface SpotBalance {
  currency: Currency;
  balance: string;
  indexPrice: string;
}

export interface Positions {
  eventTime: string;
  subAccountId: string;
  instrument: string;
  size: string;
  notional: string;
  entryPrice: string;
  exitPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  realizedPnl: string;
  totalPnl: string;
  roi: string;
  quoteIndexPrice: string;
  estLiquidationPrice: string;
}

export interface SubAccount {
  eventTime: string;
  subAccountId: string;
  marginType: MarginType;
  settleCurrency: Currency;
  unrealizedPnl: string;
  totalEquity: string;
  initialMargin: string;
  maintenanceMargin: string;
  availableBalance: string;
  spotBalances: SpotBalance[];
  positions: Positions[];
  settleIndexPrice: string;
}

export interface Instrument {
  instrument: string;
  instrumentHash: string;
  base: Currency;
  quote: Currency;
  kind: Kind;
  venues: Venue[];
  baseDecimals: number;
  quoteDecimals: number;
  tickSize: string;
  minSize: string;
  createTime: string;
  maxPositionSize: string;
}
