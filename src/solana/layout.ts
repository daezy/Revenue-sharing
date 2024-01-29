import { struct, u8 } from '@solana/buffer-layout';
//@ts-expect-error missing types
import { publicKey, u64 } from '@solana/buffer-layout-utils';

export interface ContractData {
    isInitialized: number;
    adminPubkey: Uint8Array;
    tokenMintPubkey: Uint8Array;
    pdaBump: Uint8Array;
    depositPerPeriod: Uint8Array;
}

export const ContractDataAccountLayout = struct<ContractData>([
    u8('isInitialized'),
    publicKey('adminPubKey'),
    publicKey('tokenMintPubKey'),
    u8('pdaBump'),
    u64('depositPerPeriod')
]);