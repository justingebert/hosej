import { Document, Types } from "mongoose";

export type WithoutMongoose<T> = Omit<T, keyof Document>;
export type AsJson<T> = T extends Document // Only apply `_id` for Mongoose documents
    ? { _id: string } & {
    [K in keyof WithoutMongoose<T> as WithoutMongoose<T>[K] extends Function ? never : K]:
    WithoutMongoose<T>[K] extends Types.ObjectId
        ? string //  Convert `ObjectId` to `string`
        : WithoutMongoose<T>[K] extends Date
            ? string //  Convert `Date` to `string`
            : WithoutMongoose<T>[K] extends Array<infer U>
                ? AsJson<U>[] // Recursively apply AsJson<T> to arrays
                : WithoutMongoose<T>[K];
}
    : {
        [K in keyof T as T[K] extends Function ? never : K]:
        T[K] extends Types.ObjectId
            ? string
            : T[K] extends Date
                ? string
                : T[K] extends Array<infer U>
                    ? AsJson<U>[]
                    : T[K];
    };

// Core DTO mapper:
// - ObjectId -> string
// - Date -> string
// - Functions removed
// - Recurses arrays / readonly arrays / objects
export type ToDTO<T> =
    T extends Types.ObjectId ? string :
    T extends Date ? string :
    T extends (...args: any) => any ? never :
    T extends ReadonlyArray<infer U> ? ReadonlyArray<ToDTO<U>> :
    T extends Array<infer U> ? ToDTO<U>[] :
    T extends object ? {
        [K in keyof T as T[K] extends (...args: any) => any ? never : K]: ToDTO<T[K]>;
    } :
    T;