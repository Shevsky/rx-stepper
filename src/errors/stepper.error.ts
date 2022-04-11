export const enum STEPPER_ERROR_CODE {
  TRANSITION_DISALLOWED = 'transition_disallowed',
  NOT_EXPECTED_STEPS_DISALLOWED = 'not_expected_steps_disallowed',
  INVALID_PARAMETERS = 'invalid_arguments',
  UNKNOWN = 'unknown'
}

export type TStepperErrorMeta<T extends string, C extends STEPPER_ERROR_CODE> = {
  code: C;
} & (C extends STEPPER_ERROR_CODE.TRANSITION_DISALLOWED
  ? {
      currentStep: T;
      pendingStep?: T;
    }
  : C extends STEPPER_ERROR_CODE.NOT_EXPECTED_STEPS_DISALLOWED
  ? {
      currentStep: T;
      pendingStep: T & string;
    }
  : C extends STEPPER_ERROR_CODE.UNKNOWN
  ? {
      rawError?: unknown;
    }
  : {});

export class StepperError<T extends string, C extends STEPPER_ERROR_CODE = STEPPER_ERROR_CODE.UNKNOWN> extends Error {
  meta: TStepperErrorMeta<T, C> = {
    code: STEPPER_ERROR_CODE.UNKNOWN as C
  } as TStepperErrorMeta<T, C>;

  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'StepperError';
  }

  static makeWithMeta<T extends string, C extends STEPPER_ERROR_CODE>(
    meta: TStepperErrorMeta<T, C>,
    message?: string
  ): StepperError<T, C> {
    const error = new StepperError<T, C>(message);
    error.meta = meta;

    return error;
  }

  static isImplements<T extends string, C extends STEPPER_ERROR_CODE>(
    error: unknown,
    code: C
  ): error is StepperError<T, C> {
    return error instanceof StepperError && error.meta.code === code;
  }
}
