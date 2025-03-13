import { Types, Document } from "mongoose";

export type WithoutMongoose<T> = Omit<T, keyof Document>;
export type AsJson<T> = {
      [K in keyof T as T[K] extends Function ? never : K]:
        T[K] extends Types.ObjectId
          ? string
          : T[K] extends Date
          ? string
          : T[K] extends Array<infer U>
          ? AsJson<U>[]
          : T[K];
    };
