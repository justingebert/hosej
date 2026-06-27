import { randomInt } from "crypto";

// Base58-style alphabet — omits 0/O/I/l so a code is unambiguous when typed by
// hand. Kept in its own leaf module (no model import) so the Group schema can use
// `generateInviteCode` as a field default without a circular import.
const INVITE_CODE_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const INVITE_CODE_LENGTH = 8;

/** Generate a random, URL-safe, human-typeable invite code (~46 bits of entropy). */
export function generateInviteCode(): string {
    let code = "";
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
    }
    return code;
}
