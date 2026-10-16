import { Body, Query } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { type SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { z, type ZodType } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

/** Validated request body: `create(@ZodBody(createProductSchema) dto: CreateProduct)`. */
export const ZodBody = (schema: ZodType): ParameterDecorator => Body(new ZodValidationPipe(schema));

/** Validated query string. */
export const ZodQuery = (schema: ZodType): ParameterDecorator =>
  Query(new ZodValidationPipe(schema));

/** Documents a Zod request body in Swagger (Zod 4 emits OpenAPI 3.0 JSON Schema). */
export const ApiZodBody = (schema: ZodType): MethodDecorator =>
  ApiBody({ schema: toOpenApiSchema(schema) });

export function toOpenApiSchema(schema: ZodType): SchemaObject {
  return z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' }) as SchemaObject;
}
