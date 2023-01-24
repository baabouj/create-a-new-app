import { faker } from '@faker-js/faker';

import { prisma } from '$/lib';
import { hash } from '$/utils';

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  password: string;
};

const generateUser = (): User => {
  return {
    id: faker.datatype.uuid(),
    name: faker.name.fullName(),
    email: faker.internet.email().toLowerCase(),
    emailVerifiedAt: null,
    password: faker.internet.password(),
  };
};

const insertUsers = async (users: User[]) => {
  const createdUsers = await Promise.all(
    users.map(async ({ password, ...user }) => {
      const hashedPassword = await hash.make(password);
      return prisma.user.create({
        data: {
          ...user,
          password: hashedPassword,
        },
      });
    })
  );
  return createdUsers;
};

export { generateUser, insertUsers };
