export class ReferenceConflictError extends Error {
  constructor() {
    super(
      'La referencia ya fue procesada con datos diferentes. Se conservó el registro original.',
    );
  }
}

export class ConfirmationLostError extends Error {
  constructor() {
    super(
      'La solicitud pudo registrarse, pero no llegó la confirmación. Reintenta con la misma referencia.',
    );
  }
}

export class SimulatedServiceError extends Error {
  constructor(
    message = 'El servicio simulado no respondió. Puedes intentarlo de nuevo.',
  ) {
    super(message);
  }
}
