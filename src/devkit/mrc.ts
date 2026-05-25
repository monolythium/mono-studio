import { requireMonoAddress } from "./address.js";
import type { MrcAssetKind, MrcTokenPlan, RiskLabel, TokenAllocation } from "./types.js";

export type MrcTokenInput = {
  assetKind: MrcAssetKind;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  issuerAddress: string;
  mintAuthority: "none" | "issuer" | "role";
  metadataMutable: boolean;
  transferRestricted: boolean;
  allocations: TokenAllocation[];
  marketRequest?: {
    quoteAsset: string;
    initialLiquidity: string;
  };
};

const integerText = /^[0-9]+$/;

function label(id: string, title: string, severity: RiskLabel["severity"], detail: string): RiskLabel {
  return {
    id,
    title,
    severity,
    detail
  };
}

export function validateTokenInput(input: MrcTokenInput): string[] {
  const diagnostics: string[] = [];

  if (!input.name.trim()) diagnostics.push("Token name is required.");
  if (!/^[A-Z0-9]{2,12}$/.test(input.symbol)) diagnostics.push("Symbol must be 2 to 12 uppercase letters or numbers.");
  if (!Number.isInteger(input.decimals) || input.decimals < 0 || input.decimals > 18) diagnostics.push("Decimals must be from 0 to 18.");
  if (!integerText.test(input.supply) || input.supply === "0") diagnostics.push("Supply must be a positive whole number.");

  const issuer = requireMonoAddress(input.issuerAddress, "account");
  if (issuer.kind !== "account") diagnostics.push("Issuer must be an account address.");

  for (const allocation of input.allocations) {
    requireMonoAddress(allocation.address, "account");
    if (!integerText.test(allocation.amount) || allocation.amount === "0") {
      diagnostics.push(`Allocation for ${allocation.address} must be a positive whole number.`);
    }
  }

  return diagnostics;
}

export function createMrcTokenPlan(input: MrcTokenInput): MrcTokenPlan {
  const diagnostics = validateTokenInput(input);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.join(" "));
  }

  const isCollection = input.assetKind === "mrc721-collection" || input.assetKind === "mrc1155-collection";
  const isVault = input.assetKind === "mrc4626-vault";
  const mintPolicy = input.mintAuthority;
  const supplyPolicy = isCollection ? "collection" : isVault ? "vault" : mintPolicy === "none" ? "fixed" : "capped";

  const riskLabels: RiskLabel[] = [
    supplyPolicy === "fixed"
      ? label("fixed-supply", "Fixed supply", "info", "No additional supply can be created by this plan.")
      : label("mint-policy", "Mint authority present", "warning", "Future supply changes require the configured authority."),
    input.metadataMutable
      ? label("metadata-mutable", "Mutable metadata", "warning", "Display metadata can be changed after creation.")
      : label("metadata-immutable", "Immutable metadata", "info", "Display metadata is locked by this plan."),
    input.transferRestricted
      ? label("transfer-restricted", "Transfer restrictions", "warning", "Transfers depend on the configured policy.")
      : label("open-transfer", "Open transfers", "info", "Transfers are allowed unless later policy changes apply.")
  ];

  const adminRoles = mintPolicy === "none" && !input.metadataMutable ? [] : ["issuer"];

  return {
    assetKind: input.assetKind,
    name: input.name.trim(),
    symbol: input.symbol.trim(),
    decimals: input.decimals,
    supplyPolicy,
    mintPolicy,
    transferPolicy: input.transferRestricted ? "restricted" : "open",
    metadataPolicy: input.metadataMutable ? "mutable" : "immutable",
    adminRoles,
    issuerAddress: input.issuerAddress.trim(),
    initialAllocations: input.allocations,
    marketRequest: input.marketRequest,
    riskLabels
  };
}
