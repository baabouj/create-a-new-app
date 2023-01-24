import { expect, it } from 'vitest';

import { sayHello } from '../src';

it('should return hello', () => {
  expect(sayHello()).toBe('Hello, World!');
});
