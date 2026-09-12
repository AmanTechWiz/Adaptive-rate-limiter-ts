import type { Request } from "express";
import { getUserIdByApiKey, getUserTier } from "../config/userService";
import type { AuthenticatedUser } from "../types";

const firstHeaderValue = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;


// we are returning userId
export const resolveRequestUser = (req: Request): AuthenticatedUser | undefined => {
    const apiKey = firstHeaderValue(req.headers["x-api-key"]);

    if (!apiKey) {
        return { userId: "anonymous", tier: "Free" };
    }

    const userId = getUserIdByApiKey(apiKey);
    if (!userId) {
        return undefined;
    }

    const tier = getUserTier(userId) ;

    return { userId, tier};
};