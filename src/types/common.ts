import { Types, Document } from "mongoose";

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
