import type { Types } from "mongoose";

/**
 * Converts a Mongoose model interface to a Data Transfer Object (DTO) type.
 * Use this type to define what API responses look like on the client.
 *
 * Transformations:
 * - ObjectId → string
 * - Date → string
 * - Functions → removed
 * - Arrays/objects → recursively transformed
 */
export type ToDTO<T> = T extends Types.ObjectId
    ? string
    : T extends Date
      ? string
      : T extends (...args: any) => any
        ? never
        : T extends Array<infer U>
          ? ToDTO<U>[]
          : T extends object
            ? {
                  [K in keyof T as T[K] extends (...args: any) => any ? never : K]: ToDTO<T[K]>;
              }
            : T;
