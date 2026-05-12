import { Denops } from "../deps/denops.ts";
import { v } from "../deps/schema.ts"
import { type StringOrStringArray, stringOrStringArraySchema } from "../schemas/string.ts";

export type BodyFunc = (denops: Denops) => StringOrStringArray | Promise<StringOrStringArray>;
export type IfFunc = (denops: Denops) => boolean | Promise<boolean>;

const ifKeywordSchema = v.union([
  v.literal("base"),
  v.literal("start"),
  v.literal("vimscript"),
  v.literal("lua"),
]);

const bodyFuncSchema = v.custom<BodyFunc>((input) => typeof input === "function")
const ifFuncSchema = v.custom<IfFunc>((input) => typeof input === "function")

export const rawSnippetSchema = v.object({
  prefix: v.optional(stringOrStringArraySchema),
  body: stringOrStringArraySchema,
  description: v.optional(stringOrStringArraySchema),
  if: v.optional(ifKeywordSchema),
  eval: v.optional(v.string())
})

export const tsSnippetSchema = v.object({
  prefix: v.optional(stringOrStringArraySchema),
  body: v.union([stringOrStringArraySchema, bodyFuncSchema]),
  description: v.optional(stringOrStringArraySchema),
  if: v.optional(v.union([ifKeywordSchema, ifFuncSchema])),
  eval: v.optional(v.string())
})

// For compatibility with VSCode global snippet files (*.code-snippets)
export const globalSnippetSchema = v.object({
  prefix: v.optional(stringOrStringArraySchema),
  body: stringOrStringArraySchema,
  description: v.optional(stringOrStringArraySchema),
  scope: v.optional(v.string())
})

export const normalizedSnippetSchema = v.object({
  id: v.string(),
  filetypes: v.array(v.string()),
  prefix: v.array(v.string()),
  body: v.custom<(denops: Denops) => string | Promise<string>>((input) => typeof input === "function"),
  description: v.string(),
  if: v.optional(v.union([ifKeywordSchema, ifFuncSchema])),
  eval: v.optional(v.string())
})

export type RawSnippet = v.InferInput<typeof rawSnippetSchema>
export type TSSnippet = v.InferInput<typeof tsSnippetSchema>;
export type GlobalSnippet = v.InferInput<typeof globalSnippetSchema>
export type NormalizedSnippet = v.InferInput<typeof normalizedSnippetSchema> 

export const rawSnippetRecordSchema = v.record(v.string(), rawSnippetSchema)
export const tsSnippetRecordSchema = v.record(v.string(), tsSnippetSchema)
export const globalSnippetRecordSchema = v.record(v.string(), globalSnippetSchema)
