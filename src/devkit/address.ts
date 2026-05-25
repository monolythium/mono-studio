import type { MonoAddress, MonoAddressKind } from "./types.js";

const ACCOUNT_PREFIX = "mono1";
const CONTRACT_PREFIX = "monoc1";
const ASSET_PREFIX = "mrc1";
const DISALLOWED_PREFIX = `${String.fromCharCode(48)}${String.fromCharCode(120)}`;

export type AddressCheck = {
  ok: boolean;
  address?: MonoAddress;
  message?: string;
};

export function expectedPrefixForKind(kind: MonoAddressKind): string {
  if (kind === "contract") return CONTRACT_PREFIX;
  if (kind === "asset") return ASSET_PREFIX;
  return ACCOUNT_PREFIX;
}

export function validateMonoAddress(value: string, kind: MonoAddressKind): AddressCheck {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith(DISALLOWED_PREFIX)) {
    return {
      ok: false,
      message: `Use a typed Mono ${kind} address with the ${expectedPrefixForKind(kind)} prefix.`
    };
  }

  const prefix = expectedPrefixForKind(kind);
  if (!trimmed.startsWith(prefix) || trimmed.length < prefix.length + 16) {
    return {
      ok: false,
      message: `Expected a ${kind} address beginning with ${prefix}.`
    };
  }

  return {
    ok: true,
    address: {
      value: trimmed,
      kind
    }
  };
}

export function requireMonoAddress(value: string, kind: MonoAddressKind): MonoAddress {
  const check = validateMonoAddress(value, kind);
  if (!check.ok || !check.address) {
    throw new Error(check.message ?? `Invalid ${kind} address.`);
  }
  return check.address;
}
