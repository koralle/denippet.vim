import { Denops, op } from "../deps/denops.ts";
import { v } from "../deps/schema.ts";
import { path, TOML, YAML } from "../deps/std.ts";
import { StringOrStringArray } from "../schemas/string.ts";
import { asyncFilter } from "../util.ts";
import { globalSnippetRecordSchema, NormalizedSnippet, rawSnippetRecordSchema, tsSnippetRecordSchema } from "./schema.ts";
import { isIfFunc, langToFt, toArray, toString } from "./utils.ts";

export class Loader {
  snippets: NormalizedSnippet[] = [];

  constructor(private denops: Denops) {}

  reset(): void {
    this.snippets = [];
  }

  getId(): string {
    return crypto.randomUUID();
  }

  set(snippets: NormalizedSnippet[]): void {
    this.snippets.push(...snippets);
  }

  getById(id: string): NormalizedSnippet | undefined {
    return this.snippets.find((snippet) => snippet.id === id);
  }

  async get(): Promise<NormalizedSnippet[]> {
    const ft = await op.filetype.get(this.denops);

    const snippets = this.snippets.filter((snippet) =>
      snippet.filetypes.includes(ft) || snippet.filetypes.includes("*")
    );

    return await asyncFilter(snippets, async (snippet) => {
      if (snippet.if == null) {
        return true;
      } else if (isIfFunc(snippet.if)) {
        return Boolean(await snippet.if(this.denops));
      } else if (snippet.if === "base") {
        return Boolean(await this.denops.call("denippet#load#base", snippet.prefix));
      } else if (snippet.if === "start") {
        return Boolean(await this.denops.call("denippet#load#start", snippet.prefix));
      } else if (!snippet.eval) {
        return false;
      } else if (snippet.if === "vimscript") {
        return Boolean(await this.denops.call("eval", snippet.eval));
      } else {
        return Boolean(
          await this.denops.call("luaeval", "assert(loadstring(_A[1]))()", [snippet.eval]),
        );
      }
    });
  }

  async load(filepath: string, filetype: StringOrStringArray): Promise<void> {
    const extension = filepath.split(".").pop()!;

    if (extension === "ts") {
      const content = await import(path.toFileUrl(filepath).toString())
        .then((module) => module.snippets);

      const verifiedContent = await v.parseAsync(tsSnippetRecordSchema, content) 

      const snippets = Object.entries(verifiedContent).map(([name, snip]) => ({
        ...snip,
        id: this.getId(),
        filetypes: toArray(filetype),
        prefix: toArray(snip.prefix ?? name),
        body: async (denops: Denops) =>
          toString(typeof snip.body == "function" ? await snip.body(denops) : snip.body),
        description: toString(snip.description),
      }));

      this.set(snippets);
      return;
    }

    const raw = await Deno.readTextFile(filepath);
    if (["json", "toml", "yaml"].includes(extension)) {
      const content = (extension === "json")
        ? JSON.parse(raw)
        : extension === "toml"
        ? TOML.parse(raw)
        : YAML.parse(raw);

      const verifiedContent = await v.parseAsync(rawSnippetRecordSchema, content)

      const snippets = Object.entries(verifiedContent).map(([name, snip]) => ({
        ...snip,
        id: this.getId(),
        filetypes: toArray(filetype),
        prefix: toArray(snip.prefix ?? name),
        body: () => toString(snip.body),
        description: toString(snip.description),
      }));

      this.set(snippets);
      return;
    }

    if (extension === "code-snippets") {
      const content = JSON.parse(raw);

      const verifiedContent = await v.parseAsync(globalSnippetRecordSchema, content)

      const snippets = Object.entries(verifiedContent).map(([name, snippet]) => {
        const ft = snippet.scope ? snippet.scope.split(",").map(langToFt) : ["*"];

        return {
          ...snippet,
          id: this.getId(),
          filetypes: ft,
          prefix: toArray(snippet.prefix ?? name),
          prefix_regexp: [],
          body: () => toString(snippet.body),
          description: toString(snippet.description),
        };
      });

      this.set(snippets);
      return;
    }

    throw new Error(`Unknown extension: ${extension}`);
  }
}
