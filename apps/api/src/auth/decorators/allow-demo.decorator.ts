import { SetMetadata } from '@nestjs/common';

export const ALLOW_DEMO = 'booth:allow-demo';

/** Lets the read-only demo account call a non-GET route (e.g. refresh, logout). */
export const AllowDemo = (): ClassDecorator & MethodDecorator => SetMetadata(ALLOW_DEMO, true);
