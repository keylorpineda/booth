import { Global, Module } from '@nestjs/common';

import { CloudinaryStorage } from './cloudinary.storage';
import { DisabledStorage } from './disabled.storage';
import { MEDIA_STORAGE } from './media-storage';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

@Global()
@Module({
  providers: [
    {
      provide: MEDIA_STORAGE,
      inject: [APP_CONFIG],
      useFactory: ({ cloudinary }: AppConfig) =>
        cloudinary ? new CloudinaryStorage(cloudinary) : new DisabledStorage(),
    },
  ],
  exports: [MEDIA_STORAGE],
})
export class MediaModule {}
