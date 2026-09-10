import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Valida req.body / req.params / req.query contra schemas Zod.
 *
 * Cuidado: no Express 5, `req.query` é um getter (só leitura) — atribuir
 * `req.query = ...` diretamente lança "Cannot set property query of
 * #<IncomingMessage> which has only a getter". Por isso, para query e
 * params, aplicamos os valores validados (já com coerção/defaults do Zod)
 * de volta nas chaves do objeto existente, em vez de trocar a referência.
 * req.body continua sendo uma propriedade normal e pode ser reatribuída.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.params) {
      const parsed = schemas.params.parse(req.params) as Record<string, unknown>;
      Object.assign(req.params, parsed);
    }
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
      for (const key of Object.keys(req.query)) delete (req.query as Record<string, unknown>)[key];
      Object.assign(req.query, parsed);
    }
    next();
  };
}
