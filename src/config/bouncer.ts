import type { AccountTier, AdaptiveConfig, RateLimitStructure, adminControl } from "../types";

export class ValidationError extends Error {}

const TIERS = ["Free", "Plus", "Max"];
const USER_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function isAccountTier(value: unknown): boolean {
    return (
        typeof value === "string" &&
        TIERS.includes(value)
    );
}


export function isValidUserId(value: unknown): boolean {
    return (
        typeof value === "string" &&
        USER_ID_PATTERN.test(value) &&
        value !== "anonymous"
    );
}

function checkIsObject(value: unknown, label: string): object {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new ValidationError(label + " must be a JSON object");
    }

    return value;
}

function checkNoUnknownFields(
    body: Record<string, unknown>,
    allowed: string[]
): void {
    for (const field of Object.keys(body)) {
        if (!allowed.includes(field)) {
            throw new ValidationError("unknown field: " + field);
        }
    }
}

function checkNumber(
    value: unknown,
    label: string,
    min: number,
    max: number
): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new ValidationError(label + " must be a number");
    }

    if (value < min || value > max) {
        throw new ValidationError(
            label + " must be between " + min + " and " + max
        );
    }

    return value;
}



