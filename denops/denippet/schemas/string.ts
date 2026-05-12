import { v } from "../deps/schema.ts";

export const stringOrStringArraySchema = v.union([v.string(), v.array(v.string())]);
export type StringOrStringArray = v.InferInput<typeof stringOrStringArraySchema>
