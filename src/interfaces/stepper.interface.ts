import { Observable } from 'rxjs';

export interface IStepperActions {
  goBack?(): Promise<void>;
  goForward?(): Promise<void>;
}

/** Сервис для осуществления пошагового прохождения процессов */
export interface IStepperInterface<T extends string> {
  /** Сервис готов к использованию */
  readonly isReady$: Observable<boolean>;

  /** Все шаги */
  readonly steps: Array<T>;
  /** Активный шаг */
  readonly currentStep: T;
  /** Предыдущий шаг */
  readonly previousStep: T | null;
  /** Следующий шаг */
  readonly nextStep: T | null;
  /** Доступные действия */
  readonly currentActions: IStepperActions;
  /** Переход назад доступен */
  readonly isBackAvailable: boolean;
  /** Переход вперед доступен */
  readonly isForwardAvailable: boolean;

  /** Активный шаг */
  readonly currentStep$: Observable<T>;
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

  /** Переходит на шаг назад */
  goBack(): Promise<void>;
  /** Переходит на шаг вперед */
  goForward(): Promise<void>;
  /** Переходит к конкретному шагу */
  goTo(step: T, previousStep?: T, nextStep?: T): Promise<void>;

  /** Сбрасывает шаг */
  reset(): void;
  /** Очистка */
  destroy(): void;
}
