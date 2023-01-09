type Template = 'express' | 'koa' | 'fastify';

type Lang = 'javascript' | 'typescript';

type Options = {
  name: string;
  template: Template;
  lang: Lang;
  prettier: boolean;
  eslint: boolean;
};

export { Lang, Options, Template };
