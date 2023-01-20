import type { Prisma } from '@prisma/client';

import { prisma } from '$/lib';

const find = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};

const findByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};

const findAll = async ({ page, limit }: any) => {
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      take: limit,
      skip: limit * (page - 1),
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count(),
  ]);

  const lastPage = Math.ceil(total / limit);
  const info = {
    total,
    currentPage: page,
    nextPage: page + 1 > lastPage ? null : page + 1,
    prevPage: page - 1 <= 0 ? null : page - 1,
    lastPage,
    perPage: limit,
  };

  return { info, data };
};

const update = async (
  id: string,
  data: Pick<Prisma.UserUpdateInput, 'emailVerifiedAt' | 'name' | 'password'>
) => {
  const updatedUser = await prisma.user.update({
    where: {
      id,
    },
    data,
  });
  return updatedUser;
};

const create = async (
  data: Pick<Prisma.UserCreateInput, 'name' | 'email' | 'password'>
) => {
  const createdUser = await prisma.user.create({
    data,
  });
  return createdUser;
};

export { create, find, findAll, findByEmail, update };
