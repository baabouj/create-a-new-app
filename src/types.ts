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
  commitlint?: boolean;
  ghActions?: boolean;
};

export { Lang, Options, Type };
