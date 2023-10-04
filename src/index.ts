import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Lang, Options, Type } from './types';
import { copy, dist, mkdir, readJson, writeJson } from './utils';

const create = async (dir: string, opts: Options) => {
  await mkdir(dir);

  await copyTemplateFiles(
    opts.type,
    opts.type === 'server' ? opts.template : '',
    opts.lang,
    opts.name,
    dir
  );

  await copySharedFiles(dir, opts);
};

const copyTemplateFiles = async (
  type: Type,
  template: string,
  lang: Lang,
  name: string,
  cwd: string
) => {
  const dir = dist(`templates/${type}/${lang}/${template}`);
  const files = readdirSync(dir, 'utf-8');

  for (const file of files) {
    if (file === 'meta.json') continue;

    const dest = join(cwd, file);
    await copy(join(dir, file), dest);
  }

  const packageJsonPath = `${dir}/package.json`;
  const packageJson = readJson(packageJsonPath);
  packageJson.version = '0.0.1';
  packageJson.name = name;
  packageJson.description = '';
  packageJson.author = '';
  writeJson(`${cwd}/package.json`, packageJson);
};

const copySharedFiles = async (cwd: string, opts: Options) => {
  if (opts.prettier) {
    const dir = dist(`shared/prettier`);
    await copy(dir, cwd);
  }

  if (opts.eslint) {
    const dir = dist(`shared/eslint`);
    await copy(dir, cwd);

    if (opts.prettier || opts.lang) {
      const eslintConfigPath = dist(
        `shared/eslint${opts.prettier ? '-prettier' : ''}${
          opts.lang === 'typescript' ? '-typescript' : ''
        }`
      );
      await copy(eslintConfigPath, cwd);
    }
  }

  if (opts.lintstaged) {
    const lintstagedConfigPath = dist(`shared/lintstaged`);
    await copy(lintstagedConfigPath, cwd);

    if (opts.prettier) {
      const lintstagedPrettierConfigPath = dist('shared/lintstaged-prettier');
      await copy(lintstagedPrettierConfigPath, cwd);
    }
  }

  if (opts.commitlint) {
    const commitlintConfigPath = dist(`shared/commitlint`);
    await copy(commitlintConfigPath, cwd);
  }

  if (opts.type === 'library' && opts.ghActions) {
    const ghActionsPath = dist(`shared/gh-actions`);
    await copy(ghActionsPath, `${cwd}/.github`);
  }
};

export { create };
