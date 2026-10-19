import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

import { MAX_IMAGE_BYTES } from './image-file';

/**
 * Accepts one multipart file in the `file` field, kept in memory. Multer's hard limit is above
 * MAX_IMAGE_BYTES so `assertImageFile` can answer with the friendlier FILE_TOO_LARGE error.
 */
export const ImageUpload = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    UseInterceptors(
      FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES * 2, files: 1 } }),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
  );
