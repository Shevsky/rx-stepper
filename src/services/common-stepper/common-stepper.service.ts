import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { STEPPER_ERROR_CODE, StepperError } from './../../errors';
import { IStepperActions, IStepperInterface } from './../../interfaces/stepper.interface';
import { COMMON_STEPPER_DIRECTION } from './common-stepper.enum';
import { TCommonStepperConfig } from './common-stepper.type';

/** Сервис для осуществления пошагового прохождения процессов */
export class CommonStepperService<T extends string> implements IStepperInterface<T> {
  /** Сервис готов к использованию */
  readonly isReady$: BehaviorSubject<boolean>;

  /** Все шаги */
  readonly steps: Array<T>;

  /** Активный шаг */
  readonly currentStep$: BehaviorSubject<T>;
  /** Предыдущий шаг */
  readonly previousStep$: Observable<T | null>;
  /** Следующий шаг */
  readonly nextStep$: Observable<T | null>;
  /** Доступные действия */
  readonly currentActions$: Observable<IStepperActions>;
  /** Переход назад доступен */
  readonly isBackAvailable$: Observable<boolean>;
  /** Переход вперед доступен */
  readonly isForwardAvailable$: Observable<boolean>;

  protected overridePreviousStep?: T;
  protected overrideNextStep?: T;

  /** @see TCommonStepperConfig */
  constructor(protected readonly config: TCommonStepperConfig<T>) {
    if (!this.config.steps.length) {
      throw StepperError.makeWithMeta({ code: STEPPER_ERROR_CODE.INVALID_PARAMETERS }, 'Не указаны шаги');
    }

    this.isReady$ = new BehaviorSubject<boolean>(false);
    this.currentStep$ = new BehaviorSubject<T>(this.config.defaultStep ?? this.config.steps[0]);
    this.previousStep$ = this.currentStep$.pipe(
      map((): T | null => this.previousStep),
      distinctUntilChanged()
    );
    this.nextStep$ = this.currentStep$.pipe(
      map((): T | null => this.nextStep),
      distinctUntilChanged()
    );
    this.currentActions$ = this.currentStep$.pipe(map((): IStepperActions => this.currentActions));
    this.isBackAvailable$ = this.currentStep$.pipe(
      map((): boolean => this.isBackAvailable),
      distinctUntilChanged()
    );
    this.isForwardAvailable$ = this.currentStep$.pipe(
      map((): boolean => this.isForwardAvailable),
      distinctUntilChanged()
    );
    this.steps = this.config.steps;

    void this.init().then((): void => this.isReady$.next(true));
  }

  /** Инициализация сервиса */
  protected init(): Promise<void> {
    return Promise.resolve();
  }

  /** Активный шаг */
  get currentStep(): T {
    return this.currentStep$.getValue();
  }

  /** Доступные действия */
  get currentActions(): IStepperActions {
    return {
      goBack: this.isBackAvailable ? this.goBack : void 0,
      goForward: this.isForwardAvailable ? this.goForward : void 0
    };
  }

  /** Предыдущий шаг */
  get previousStep(): T | null {
    if (this.overridePreviousStep) {
      return this.overridePreviousStep;
    }

    return this.currentStep ? this.config.steps[this.config.steps.indexOf(this.currentStep) - 1] : null;
  }

  /** Следующий шаг */
  get nextStep(): T | null {
    if (this.overrideNextStep) {
      return this.overrideNextStep;
    }

    return this.currentStep
      ? this.config.steps[this.config.steps.indexOf(this.currentStep) + 1] ?? null
      : this.config.steps[0];
  }

  /** Переход назад доступен */
  get isBackAvailable(): boolean {
    return !!this.previousStep;
  }

  /** Переход вперед доступен */
  get isForwardAvailable(): boolean {
    return !!this.nextStep || !!this.config.onCompleteRequest;
  }

  /** Переходит на шаг назад */
  goBack = async (): Promise<void> => {
    try {
      const pendingStep = this.previousStep;
      if (!pendingStep) {
        return Promise.resolve();
      }

      let isTransitionAllowed = true;
      if (this.config.isTransitionAllowed) {
        isTransitionAllowed = await this.config.isTransitionAllowed(
          COMMON_STEPPER_DIRECTION.BACK,
          this.currentStep,
          pendingStep
        );
      }

      if (!isTransitionAllowed) {
        throw StepperError.makeWithMeta(
          {
            code: STEPPER_ERROR_CODE.TRANSITION_DISALLOWED,
            currentStep: this.currentStep,
            pendingStep
          },
          `Переход назад ${this.currentStep} -> ${pendingStep} недоступен`
        );
      }

      return this.goTo(pendingStep);
    } catch (e) {
      this.catchError(e);
    }
  };

  /** Переходит на шаг вперед */
  goForward = async (): Promise<void> => {
    try {
      const pendingStep = this.nextStep;

      let isTransitionAllowed = true;
      if (this.config.isTransitionAllowed) {
        isTransitionAllowed = await this.config.isTransitionAllowed(
          COMMON_STEPPER_DIRECTION.FORWARD,
          this.currentStep,
          pendingStep ?? void 0
        );
      }

      if (!isTransitionAllowed) {
        throw StepperError.makeWithMeta(
          {
            code: STEPPER_ERROR_CODE.TRANSITION_DISALLOWED,
            currentStep: this.currentStep,
            pendingStep: pendingStep ?? void 0
          },
          `Переход вперед ${this.currentStep} -> ${pendingStep ?? '???'} недоступен`
        );
      }

      if (!pendingStep) {
        if (this.config.onCompleteRequest) {
          return this.config.onCompleteRequest();
        }

        return Promise.resolve();
      }

      return this.goTo(pendingStep);
    } catch (e) {
      this.catchError(e);
    }
  };

  /** Переходит к конкретному шагу */
  goTo = async (step: T, previousStep?: T, nextStep?: T): Promise<void> => {
    try {
      if (!this.config.steps.includes(step) && !this.config.allowNotExpectedSteps) {
        throw StepperError.makeWithMeta(
          { code: STEPPER_ERROR_CODE.NOT_EXPECTED_STEPS_DISALLOWED, currentStep: this.currentStep, pendingStep: step },
          `Шаг ${step} недоступен`
        );
      }

      let isTransitionAllowed = true;
      if (this.config.isTransitionAllowed) {
        isTransitionAllowed = await this.config.isTransitionAllowed(
          COMMON_STEPPER_DIRECTION.DIRECT,
          this.currentStep,
          step
        );
      }

      if (!isTransitionAllowed) {
        throw StepperError.makeWithMeta(
          {
            code: STEPPER_ERROR_CODE.TRANSITION_DISALLOWED,
            currentStep: this.currentStep,
            pendingStep: step
          },
          `Переход ${this.currentStep} -> ${step} недоступен`
        );
      }

      return (this.config.onPendingStep?.(step, this.currentStep) ?? Promise.resolve()).then((): void => {
        this.overridePreviousStep = previousStep;
        this.overrideNextStep = nextStep;

        this.currentStep$.next(step);
      });
    } catch (e) {
      this.catchError(e);
    }
  };

  /** Сбрасывает шаг */
  reset = (): void => {
    this.currentStep$.next(this.config.defaultStep ?? this.config.steps[0]);
  };

  /** Очистка */
  destroy(): void {
    this.isReady$.complete();
    this.currentStep$.complete();
  }

  private catchError = (error: unknown): void => {
    if (this.config.onError) {
      this.config.onError(
        error instanceof StepperError
          ? error
          : StepperError.makeWithMeta({ code: STEPPER_ERROR_CODE.UNKNOWN, rawError: error })
      );
    } else {
      throw error;
    }
  };
}
