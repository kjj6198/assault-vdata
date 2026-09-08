import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { __unstable__loadDesignSystem } from "tailwindcss";

const ROOT = resolve(import.meta.dirname, "..");
const ENTRY = join(ROOT, "src/styles.css");
const TAILWIND_ROOT = join(ROOT, "node_modules/tailwindcss");

/** Class attributes and the `cn`/`cva` helpers that wrap them. */
const CLASS_LIST = /(class(?:Name)?=|\bcn\(|\bcva\()(\s*)(?:"([^"\n]*)"|'([^'\n]*)')/g;
/** Variant markers that Tailwind resolves without emitting any CSS of their own. */
const CSS_LESS_MARKER = /^(group|peer)(\/[\w-]+)?$/;

const projectClasses = new Set();
const collectStylesheet = (path) => {
  const css = readFileSync(path, "utf8");
  for (const [, name] of css.matchAll(/^\s*\.([\w-]+)\s*[,{]/gm)) projectClasses.add(name);
  for (const [, id] of css.matchAll(/@import\s+"(\.[^"]+)"/g))
    collectStylesheet(resolve(dirname(path), id));
};
collectStylesheet(ENTRY);

const loadStylesheet = async (id, base) => {
  const path = id.startsWith("tailwindcss")
    ? join(TAILWIND_ROOT, `${id.slice("tailwindcss".length).replace(/^\//, "") || "index"}.css`)
    : resolve(base, id);
  return { path, base: dirname(path), content: readFileSync(path, "utf8") };
};

const design = await __unstable__loadDesignSystem(readFileSync(ENTRY, "utf8"), {
  base: dirname(ENTRY),
  loadStylesheet,
  loadModule: async () => ({ base: ROOT, module: {} }),
});

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(path) || path.includes("routeTree.gen")) return [];
    return [path];
  });

const sortClasses = (classes) => {
  const order = new Map(design.getClassOrder(classes));
  return [...classes].sort((a, b) => {
    const left = order.get(a);
    const right = order.get(b);
    if (left === right) return 0;
    if (left === null) return -1;
    if (right === null) return 1;
    return left < right ? -1 : 1;
  });
};

const isKnown = (name, css) => {
  if (css !== null) return true;
  const bare = name.replace(/^.*:/, "");
  return CSS_LESS_MARKER.test(bare) || projectClasses.has(bare);
};

const fix = process.argv.includes("--fix");
const unknown = [];
let unsorted = 0;

for (const file of sourceFiles(join(ROOT, "src"))) {
  const original = readFileSync(file, "utf8");
  let changed = false;

  const next = original.replace(CLASS_LIST, (match, prefix, space, quoted, single, offset) => {
    const raw = quoted ?? single;
    if (raw === undefined || raw.includes("${")) return match;
    const classes = raw.split(/\s+/).filter(Boolean);
    if (classes.length === 0) return match;

    const location = `${relative(ROOT, file)}:${original.slice(0, offset).split("\n").length}`;
    design.candidatesToCss(classes).forEach((css, index) => {
      if (!isKnown(classes[index], css)) unknown.push(`${location}  ${classes[index]}`);
    });

    const ordered = sortClasses(classes).join(" ");
    if (ordered === classes.join(" ")) return match;
    unsorted++;
    changed = true;
    const quote = quoted === undefined ? "'" : '"';
    return `${prefix}${space}${quote}${ordered}${quote}`;
  });

  if (changed && fix) writeFileSync(file, next);
}

for (const entry of unknown) console.log(`unknown utility  ${entry}`);
console.log(
  `${unknown.length} unknown utilities, ${unsorted} unsorted class list${unsorted === 1 ? "" : "s"}${fix ? " (fixed)" : ""}`,
);
process.exit(unknown.length > 0 ? 1 : 0);
