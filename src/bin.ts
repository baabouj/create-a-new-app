#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import gradient from 'gradient-string';

import { create } from '.';
import type { Options } from './types';
import { dist, readJson } from './utils';

async function main() {
  console.log();
  p.intro(chalk.cyanBright.inverse(' create-a-new-app '));

  const dir = await p.text({
    message:
      'Where should we create your project?  (leave blank to use current directory)',
    defaultValue: '.',
    placeholder: './my-app',
  });

  if (p.isCancel(dir)) {
    p.cancel('Operation cancelled');
    return process.exit(0);
  }

  if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
    const shouldContinue = await p.confirm({
      message: 'Directory is not empty. Continue?',
      initialValue: false,
    });

    if (!shouldContinue || p.isCancel(shouldContinue)) {
      p.cancel('Operation cancelled');
      return process.exit(0);
    }
  }
  const { pkgManager, ...options } = (await p.group(
    {
      type: () =>
        p.select({
          message: "What's the type of your project?",
          options: [
            { value: 'server', label: 'Api Server' },
            { value: 'library', label: 'Library' },
          ],
        }),
      lang: () =>
        p.select({
          message: 'What language do you want to use?',
          options: [
            { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
            { value: 'javascript', label: 'JavaScript', hint: 'oh no' },
          ],
        }),
      template: ({ results: { lang, type } }) => {
        if (type === 'server') {
          return p.select({
            message: "What's the template do you want to use?",
            options: fs
              .readdirSync(dist(`templates/server/${lang}`))
              .map((t) => {
                const metaFile = dist(
                  `templates/server/${lang}/${t}/meta.json`,
                );
                const { title, description } = readJson(metaFile);

                return {
                  label: title,
                  hint: description,
                  value: t,
                };
              }),
          });
        }
      },
      eslint: () =>
        p.confirm({
          message: 'Add ESLint for code linting?',
          initialValue: true,
        }),
      lintstaged: ({ results: { eslint } }) => {
        if (eslint)
          return p.confirm({
            message: 'Add lint-staged for running linters on git staged files?',
            initialValue: true,
          });
      },
      prettier: () =>
        p.confirm({
          message: 'Add Prettier for code formatting?',
          initialValue: true,
        }),
      commitlint: () =>
        p.confirm({
          message: 'Add commitlint for linting commit messages?',
          initialValue: true,
        }),
      ghActions: ({ results: { type } }) => {
        if (type === 'library')
          return p.confirm({
            message: 'Add Github Action for CI/CD?',
            initialValue: true,
          });
      },
      pkgManager: () =>
        p.select({
          message: 'Install dependencies with : ',
          options: [
            { value: 'npm', label: 'npm' },
            { value: 'yarn', label: 'yarn' },
            { value: 'pnpm', label: 'pnpm' },
          ],
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    },
  )) as Omit<Required<Options>, 'name'> & {
    pkgManager: string;
  };

  const spinner = p.spinner();

  const name = path.basename(path.resolve(dir));

  spinner.start('Creating your project');

  await create(dir, { name, ...options });

  spinner.stop('Project created');

  if (fs.existsSync(path.join(dir, '.env.example'))) {
    spinner.start('Copying environment files');

    fs.copyFileSync(path.join(dir, '.env.example'), path.join(dir, '.env'));

    spinner.stop('Environment files copied');
  }

  process.chdir(dir);

  spinner.start('Initializing Git');

  await execaCommand('git init');

  spinner.stop('Git initialized');

  spinner.start('Installing dependencies');

  await execaCommand(`${pkgManager} install`);

  spinner.stop('Dependencies installed');

  p.outro("You're all set!");

  p.intro('Run your project:');

  p.log.info(`cd ${dir}`);

  p.log.info(`${pkgManager === 'npm' ? 'npx run' : pkgManager} dev`);

  p.outro(gradient.pastel.multiline('Happy Coding !'));
}

main().catch(console.error);
