#!/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import fs from 'fs';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import path from 'path';
import prompts from 'prompts';

import { create } from '.';
import type { Lang, Type } from './types';
import { dist, readJson, run } from './utils';

const main = async () => {
  console.log(gradient.pastel.multiline(figlet.textSync(`Welcome !`)) + '\n');

  let dir = process.argv[2] ?? '.';

  if (dir === '.') {
    const opts = await prompts([
      {
        type: 'text',
        name: 'dir',
        message:
          'Where should we create your project?\n  (leave blank to use current directory)',
      },
    ]);

    if (opts.dir) {
      dir = opts.dir;
    }
  }

  if (fs.existsSync(dir)) {
    if (fs.readdirSync(dir).length > 0) {
      const response = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Directory is not empty. Continue?',
        initial: false,
      });

      if (!response.value) {
        process.exit(1);
      }
    }
  }

  const { type }: { type: Type } = await prompts({
    type: 'select',
    name: 'type',
    message: 'What the type of your project?',
    choices: [
      {
        title: 'Api Server',
        value: 'server',
      },
      { title: 'Library', value: 'library' },
    ],
  });

  const { lang }: { lang: Lang } = await prompts({
    type: 'select',
    name: 'lang',
    message: 'What language do you want to use?',
    choices: [
      {
        title: 'TypeScript',
        value: 'typescript',
      },
      { title: 'JavaScript', value: 'javaScript' },
    ],
  });

  let template = '';

  if (type === 'server') {
    const answer = await prompts({
      type: 'select',
      name: 'template',
      message: 'Which template?',
      choices: fs
        .readdirSync(dist(`templates/server/${lang}`))
        .map((template) => {
          const metaFile = dist(
            `templates/server/${lang}/${template}/meta.json`
          );
          const { title, description } = readJson(metaFile);

          return {
            title,
            description,
            value: template,
          };
        }),
    });

    template = answer.template;
  }

  const options = await prompts(
    [
      {
        type: 'toggle',
        name: 'eslint',
        message: 'Add ESLint for code linting?',
        initial: false,
        active: 'Yes',
        inactive: 'No',
      },
      {
        type: (prev) => (prev ? 'toggle' : null),
        name: 'lintstaged',
        message: 'Add lint-staged for running linters on git staged files?',
        initial: false,
        active: 'Yes',
        inactive: 'No',
      },
      {
        type: 'toggle',
        name: 'prettier',
        message: 'Add Prettier for code formatting?',
        initial: false,
        active: 'Yes',
        inactive: 'No',
      },
      {
        type: 'select',
        name: 'pkgManager',
        message: 'Install dependencies with : ',
        choices: [
          {
            title: 'npm',
            value: 'npm',
          },
          { title: 'yarn', value: 'yarn' },
          { title: 'pnpm', value: 'pnpm' },
        ],
      },
    ],
    {
      onCancel: () => {
        process.exit(1);
      },
    }
  );
  const name = path.basename(path.resolve(dir));

  const spinner = createSpinner().start({
    text: 'Setting up your project',
  });

  await create(dir, { name, lang, type, template, ...options });

  spinner.success({
    text: 'Setup complete',
  });

  if (fs.existsSync(path.join(dir, '.env.example'))) {
    await run(
      () =>
        fs.copyFileSync(path.join(dir, '.env.example'), path.join(dir, '.env')),
      {
        loading: 'Copying environment files',
        success: 'Environment files copied',
        error: 'Failed to copy environment files',
      }
    );
  }

  process.chdir(dir);

  await run(`${options.pkgManager} install`, {
    loading: 'Installing dependencies',
    success: 'Dependencies installed',
    error: 'Failed to install dependencies',
  });

  spinner.success({
    text: 'Installation complete! Your project is ready to go!',
  });
  console.log(
    '\n',
    chalk('  Run your project: \n'),
    chalk(`  cd ${dir} \n`),
    chalk(
      `  ${
        options.pkgManager === 'npm' ? 'npx run' : options.pkgManager
      } dev \n\n`
    ),
    gradient.pastel.multiline(figlet.textSync('Happy Coding !')) + '\n'
  );
};

main();
