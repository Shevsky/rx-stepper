import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IStepperActions, IStepperInterface } from './../../interfaces/stepper.interface';
import { TCommonStepperConfig } from './common-stepper.type';

/** Сервис для осуществления пошагового прохождения процессов */
export class CommonStepperService<T extends string> implements IStepperInterface<T> {
  /** Сервис готов к использованию */
  readonly isReady$: BehaviorSubject<boolean>;

  /** Все шаги */
  readonly steps: Array<T>;

  /** Активный шаг */
  readonly currentStep$: BehaviorSubject<T>;
  /** Доступные действия */
  readonly currentActions$: Observable<IStepperActions>;

  protected overridePreviousStep?: T;
  protected overrideNextStep?: T;

  /** @see TCommonStepperConfig */
  constructor(protected readonly config: TCommonStepperConfig<T>) {
    if (!this.config.steps.length) {
      throw new Error('Не указаны шаги');
    }

    this.isReady$ = new BehaviorSubject<boolean>(false);
    this.currentStep$ = new BehaviorSubject<T>(this.config.defaultStep ?? this.config.steps[0]);
    this.currentActions$ = this.currentStep$.pipe(map((): IStepperActions => this.currentActions));
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
  goBack = (): Promise<void> => {
    const pendingStep = this.previousStep;
    if (!pendingStep) {
      return Promise.resolve();
    }

    return this.goTo(pendingStep);
  };

  /** Переходит на шаг вперед */
  goForward = (): Promise<void> => {
    const pendingStep = this.nextStep;
    if (!pendingStep) {
      if (this.config.onCompleteRequest) {
        return this.config.onCompleteRequest();
      }

      return Promise.resolve();
    }

    return this.goTo(pendingStep);
  };

  /** Переходит к конкретному шагу */
  goTo = (step: T, previousStep?: T, nextStep?: T): Promise<void> => {
    if (!this.config.steps.includes(step) && !this.config.allowNotExpectedSteps) {
      return Promise.reject(new Error(`Шаг ${step} недоступен`));
    }

    return (this.config.onPendingStep?.(step, this.currentStep) ?? Promise.resolve()).then((): void => {
      this.overridePreviousStep = previousStep;
      this.overrideNextStep = nextStep;

      this.currentStep$.next(step);
    });
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
}
