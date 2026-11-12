// Checks that none of the paper's edit mode is in a build of the site.
//
// Edit mode writes to the files under content/, so it must only exist under
// `next dev`: its route, its handler and its editor are all meant to be left
// out of a build. This looks through what a build produced for anything of
// them, and fails if it finds any.
//
// Usage: node scripts/check-no-edit-mode.mjs [build directory]
import fs from 'fs';
import path from 'path';

const buildDir = path.resolve(process.argv[2] ?? '.next');

// Text that only edit mode has: its route and the extension that makes it
// one, the names of its handler's functions, what it stores in the browser,
// and the ids and labels of its controls.
const MARKERS = [
  'api/dev/annotations',
  'dev.mts',
  'handleAnnotationEdit',
  'wrapPassage',
  'insertAnnotation',
  'appendAddendum',
  'registerAnnotationSet',
  'newAnnotationSetYaml',
  'za-edit-mode',
  'za-edit-set',
  'za-edit-author',
  'edit-mode-badge',
  'exit-edit-mode',
  'annotation-editor',
  'addendum-editor',
  'set-editor',
  'add-addendum',
  'new-annotation-set',
  'Add addendum',
  'New annotation set',
];

// What `next dev` and the build cache leave in the same directory, neither of
// which is part of the built site.
const SKIPPED = ['dev', 'cache'];

function* filesUnder(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir !== buildDir || !SKIPPED.includes(entry.name)) {
        yield* filesUnder(entryPath);
      }
    } else if (entry.isFile() && !entry.name.endsWith('.map')) {
      // Source maps are left out: they quote the source of the files that
      // edit mode was compiled out of, and they aren't run or served.
      yield entryPath;
    }
  }
}

if (!fs.existsSync(path.join(buildDir, 'BUILD_ID'))) {
  console.error(`No build found in ${buildDir}. Run \`pnpm build\` first.`);
  process.exit(2);
}

const found = [];
let checked = 0;
for (const file of filesUnder(buildDir)) {
  checked++;
  const content = fs.readFileSync(file, 'latin1');
  for (const marker of MARKERS) {
    if (content.includes(marker)) {
      found.push(`${path.relative(buildDir, file)}: ${marker}`);
    }
  }
}

// The build has to be one that the check would see into.
if (checked < 20) {
  console.error(`Only ${checked} files found in ${buildDir}: not a full build?`);
  process.exit(2);
}

if (found.length > 0) {
  console.error('Edit mode was found in the build:\n');
  console.error(found.map((line) => `  ${line}`).join('\n'));
  console.error(
    '\nEdit mode must only exist under `next dev`. See components/editmode.tsx and next.config.mjs.'
  );
  process.exit(1);
}

console.log(`No edit mode in the build (${checked} files checked).`);
