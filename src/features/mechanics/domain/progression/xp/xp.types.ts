import { XP_TABLES } from './xpTables';

export type XpTableEntry = { level: number; xpRequired: number };

export type XpTableId = keyof typeof XP_TABLES;
export type XpTable = (typeof XP_TABLES)[XpTableId];
