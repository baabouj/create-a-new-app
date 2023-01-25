import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, test } from 'vitest';

import { create } from '../src';
import type { Lang } from '../src/types';
import { mkdir, readJson } from '../src/utils';

const testDir = path.join(__dirname, '.tests-temp');

beforeAll(async () => {
  await mkdir(testDir);
});
afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('Api Server', () => {
  const dir = path.join(__dirname, '../src/templates/server');

  for (const lang of fs.readdirSync(dir)) {
    describe(lang, async () => {
      for (const template of fs.readdirSync(`${dir}/${lang}`)) {
        test(template, async () => {
          const cwd = path.join(testDir, `${lang}-${template}`);
          await create(cwd, {
            lang: lang as Lang,
            template,
            name: `create-nodejs-app-test-${lang}-${template}`,
            type: 'server',
            eslint: true,
            prettier: true,
          });

          await execa('pnpm install --no-frozen-lockfile', {
            cwd,
          });

          if (fs.existsSync(path.join(cwd, 'prisma'))) {
            await execa('pnpm prisma db push', {
              cwd,
            });
          }

          const scriptsToTest = ['test', 'format:check', 'lint'];

          const pkg = readJson(path.join(cwd, 'package.json'));

          for (const script of scriptsToTest.filter((s) => !!pkg.scripts[s])) {
            await execa(`pnpm ${script}`, {
              cwd,
            });
          }
        });
      }
    });
  }
});

describe('Library', () => {
  const dir = path.join(__dirname, '../src/templates/library');

  for (const lang of fs.readdirSync(dir)) {
    test(lang, async () => {
      const cwd = path.join(testDir, `library-${lang}`);
      await create(cwd, {
        lang: lang as Lang,
        template: '',
        name: `create-nodejs-app-test-library-${lang}`,
        type: 'library',
        eslint: true,
        prettier: true,
      });

      await execa('pnpm install --no-frozen-lockfile', {
        cwd,
      });

      const scriptsToTest = ['test', 'format:check', 'lint', 'build'];

      const pkg = readJson(path.join(cwd, 'package.json'));

      for (const script of scriptsToTest.filter((s) => !!pkg.scripts[s])) {
        await execa(`pnpm ${script}`, {
          cwd,
        });
      }
    });
  }
});
