import { type Prisma } from '../generated/prisma/client';

/** A Prisma client usable both inside and outside `$transaction`. */
export type Db = Prisma.TransactionClient;
