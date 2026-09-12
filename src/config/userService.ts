import type { AccountTier } from "../types";

const userTierMap = new Map<string, AccountTier>();
const apiKeyUserMap = new Map<string, string>();

const seedDemoUsers = (): void => {
    userTierMap.set("user-free", "Free");
    userTierMap.set("user-plus", "Plus");
    userTierMap.set("user-max", "Max");

    apiKeyUserMap.set("demo-free-key", "user-free");
    apiKeyUserMap.set("demo-plus-key", "user-plus");
    apiKeyUserMap.set("demo-max-key", "user-max");
};

seedDemoUsers();

export const getUserIdByApiKey = (apiKey: string): string | undefined =>
    apiKeyUserMap.get(apiKey);

export const getUserTier = (userId: string): AccountTier =>
    userTierMap.get(userId) ?? "Free";

export const setUserTier = (userId: string, tier: AccountTier): void => {
    userTierMap.set(userId, tier);
};

export const setUserApiKey = (apiKey: string, userId: string): void => {
    apiKeyUserMap.set(apiKey, userId);
};

export const getAllUsers = (): { userId: string; tier: AccountTier }[] =>
    Array.from(userTierMap.entries()).map(([userId, tier]) => ({ userId, tier }));