type Type = 'library' | 'server';

type Lang = 'javascript' | 'typescript';

type Options = {
  name: string;
  type: Type;
  template: string;
  lang: Lang;
  prettier: boolean;
  eslint: boolean;
  lintstaged?: boolean;
};

export { Lang, Options, Type };
