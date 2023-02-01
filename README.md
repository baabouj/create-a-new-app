# create-a-new-app
The easiest way to start your new nodejs application
# create-svelte

A CLI for creating your new nodejs application. Just run...

```bash
npx create-a-new-app
```

...and follow the prompts.

## API

You can also use `create-a-new-app` programmatically:

```js
import { create } from 'create-svelte';

await create('my-new-app', {
  name: 'my-new-app',
  type: 'server', // or 'library';
  lang: 'typescript', // or 'javascript';
  template: 'express', // or '' if type is 'library'
  prettier: false,
  eslint: false,
  lintstaged: false,
  commitlint: false
});
```
