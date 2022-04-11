import { StepperError } from 'errors/stepper.error';
import { COMMON_STEPPER_DIRECTION } from 'services/common-stepper/common-stepper.enum';

export type TCommonStepperConfig<T extends string> = {
  /**
   * Список шагов. Вперед-назад будет работать по заданному порядку
   */
  steps: Array<T>;

  /**
   * Шаг по умолчанию - с которым инициализируется сервис
   * Если не указать, то будет инициализировано первым шагом в списке
   */
  defaultStep?: T;

  /**
   * Разрешить переход к другим шагам (не перечисленным в steps)
   */
  allowNotExpectedSteps?: boolean;

  /**
   * Функция будет вызвана для проверки возможности перехода к указанному шагу
   */
  isTransitionAllowed?(direction: COMMON_STEPPER_DIRECTION, currentStep: T, pendingStep?: T): Promise<boolean>;

  /**
   * Функция для обработки ошибок при переходах между шагами
   * Если указать, то ошибки не будут всплывать наверх
   */
  onError?(error: StepperError<T>): void;

  /**
   * Функция будет вызвана при попытке перехода к указанному шагу
   * Если промис завершится ошибкой - переход не будет произведен
   * @deprecated
   */
  onPendingStep?(step: T, currentStep: T): Promise<void>;

  /**
   * Функция будет вызвана при вызове действия "вперед" на последнем шаге
   * Это действие подразумевает завершение прохождения шагов
   * @deprecated
   */
  onCompleteRequest?(): Promise<void>;
};
