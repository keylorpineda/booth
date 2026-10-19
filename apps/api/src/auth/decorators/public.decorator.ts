import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'booth:is-public';

/** Opts a route or controller out of authentication (secure by default). */
export const Public = (): ClassDecorator & MethodDecorator => SetMetadata(IS_PUBLIC, true);
