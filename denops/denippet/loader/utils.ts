import { is } from "../deps/unknownutil.ts";
import { StringOrStringArray } from "../schemas/string.ts";

import type { IfFunc } from "./schema.ts"

export function isIfFunc(x: unknown): x is IfFunc {
  return typeof x == "function";
}

export function langToFt(lang: string): string {
  return {
    csharp: "cs",
    shellscript: "sh",
  }[lang] ?? lang;
}

export function toArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

export function toString(x?: StringOrStringArray): string {
  if (x == null) {
    return "";
  } else if (is.String(x)) {
    return x;
  } else {
    return x.join("\n");
  }
}
