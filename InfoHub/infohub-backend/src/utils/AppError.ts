export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }

  static notFound(message = "Recurso não encontrado") {
    return new AppError(message, 404);
  }

  static unauthorized(message = "Não autenticado") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Sem permissão para esta ação") {
    return new AppError(message, 403);
  }

  static conflict(message = "Conflito com o estado atual do recurso") {
    return new AppError(message, 409);
  }
}
