import chalk from 'chalk';
import { execaCommand } from 'execa';
import fs from 'fs';
import merge from 'merge';
import { createSpinner } from 'nanospinner';
import path from 'path';
import { fileURLToPath } from 'url';

const mkdir = async (dir: string) => {
  try {
    fs.mkdirSync(dir);
    return dir;
  } catch (err: any) {
    if (err.code === 'EEXIST') return;
    console.log(err);
    process.exit(1);
  }
};

const sort = (obj: any) => {
  return Object.keys(obj)
    .sort()
    .reduce((sorted: any, key) => {
      sorted[key] = obj[key];
      return sorted;
    }, {});
};

const combine = async (basePath: string, extendPath: string) => {
  const base = readJson(basePath);
  const extend = readJson(extendPath);

  const combined = merge.recursive(true, base, extend);

  ['dependencies', 'devDependencies'].forEach((key) => {
    if (combined[key]) combined[key] = sort(combined[key]);
  });

  writeJson(basePath, combined);
};

const copy = async (from: string, to: string) => {
  if (!fs.existsSync(from)) return;
  await mkdir(path.dirname(to));

  const stats = fs.statSync(from);

  if (stats.isDirectory()) {
    const files = fs.readdirSync(from);

    files.forEach(async (file) => {
      await copy(path.join(from, file), path.join(to, file));
    });
  } else {
    if (from.endsWith('package.json') && fs.existsSync(to)) {
      // dont override package.json, combine it!
      await combine(to, from);
      return;
    }
    fs.copyFileSync(from, to);
  }
};

const dist = (p: string) => {
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'src', p);
  }

  return fileURLToPath(new URL(`./${p}`, import.meta.url).href);
};

const readJson = (path: string) => {
  const json = fs.readFileSync(path, {
    encoding: 'utf-8',
  });
  return JSON.parse(json);
};

const writeJson = (path: string, data: unknown) => {
  const json = JSON.stringify(data, null, '  ') + '\n';
  fs.writeFileSync(path, json);
};

const run = async (
  task: string | (() => void),
  { loading = 'loading ....', success = 'success', error = 'error' }
) => {
  const spinner = createSpinner(loading).start({ text: loading });
  try {
    if (typeof task === 'string') {
      await execaCommand(task);
    } else {
      task();
    }
    spinner.success({ text: success });
  } catch (err) {
    spinner.error({ text: error });
    console.log(
      typeof task === 'string' ? chalk.red(`Failed to execute ${task}`) : '',
      err
    );
    process.exit(1);
  }
};

export { copy, dist, mkdir, readJson, run, writeJson };
