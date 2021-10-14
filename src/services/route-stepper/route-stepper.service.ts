import { Location, UnregisterCallback } from 'history';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CommonStepperService } from './../common-stepper/common-stepper.service';
import { LocationPreserveService } from './../location-preserve.service';
import { TRouteStepperConfig } from './route-stepper.type';

/**
 * Сервис для осуществления пошагового прохождения процессов, но с синхронизацией с роутером
 * Устанавливает связь между шагом внутри процесса и шагом в location через параметры роута
 */
export class RouteStepperService<T extends string> extends CommonStepperService<T> {
  private unsubscribe$?: Subject<void>;
  private unregisterHistoryListener?: UnregisterCallback;
  private locationPreserve: LocationPreserveService = new LocationPreserveService(document.location, window.history);

  /** @see TRouteStepperConfig */
  constructor(protected readonly config: TRouteStepperConfig<T>) {
    super(config);
  }

  /** Инициализация сервиса */
  protected override async init(): Promise<void> {
    await super.init();

    /**
     * Нужно сопоставить текущий шаг из location и имитировать прохождение по предыдущим шагам до требуемого
     *
     * Стоит флаг "Использовать шаг по умолчанию из location"
     * Не указан шаг по умолчанию в конфигурации
     * В location указан шаг
     */
    if (this.config.takeDefaultStepFromLocation && !this.config.defaultStep && this.locationStep) {
      /** Индекс шага из location в массиве списка шагов */
      const locationStepIndex = this.config.steps.indexOf(this.locationStep);
      /** Только если это не первый шаг (нулевой индекс), так как первый итак уже установлен */
      if (locationStepIndex > 0) {
        /** Получаем хронологию шагов для того, чтобы попасть на тот, что указан в location */
        const chronologySteps = this.config.steps.slice(1, locationStepIndex);

        try {
          /** Последовательно проходим по всем шагам в хронологии. Обязательно последовательно! */
          await Promise.all(
            chronologySteps.map(async (chronologyStep: T): Promise<void> => {
              await this.goTo(chronologyStep);
            })
          );

          /** По прохождению всей хронологии мы можем уже перейти к тому шагу, что указан в location */
          await this.syncCurrentStepWithLocation();
        } catch (e) {
          /** Если где-то возникла ошибка - значит нужно сбросить шаг */
          this.reset();
        }

        /** На всякий случай синхронизируем location с шагом, так как в последствии прохождения по шагам мог произойти сброс */
        this.syncLocationWithCurrentStep();
      }
    }

    this.isReady$.pipe(filter(Boolean)).subscribe(this.handleReady);
  }

  /** Очистка */
  override destroy(): void {
    this.unsubscribe$?.next(void 0);
    this.unsubscribe$?.complete();
    this.unregisterHistoryListener?.();

    super.destroy();
  }

  /** Является ли текущий pathname нужным нам роутом, в рамках которого осуществляется пошаговая навигация */
  private get isExpectedLocation(): boolean {
    return this.config.matcher.matchPath(this.config.history.location.pathname, this.config.route) !== null;
  }

  /** Вернет текущие параметры location */
  private get locationParams(): object {
    return this.config.matcher.matchPath(this.config.history.location.pathname, this.config.route)?.params ?? {};
  }

  /** Вернет параметр, соответствующий шагу, из параметров location */
  private get locationStep(): T | undefined {
    const routeStep = this.locationParams?.[this.config.param ?? 'step'] as T | undefined;
    if (routeStep && this.config.steps.includes(routeStep)) {
      return routeStep;
    }

    return void 0;
  }

  /** Вернет state из истории */
  private get locationState(): { previousStep?: T; nextStep?: T } {
    return (this.config.history.location as Location<{ previousStep?: T; nextStep?: T }>)?.state ?? {};
  }

  /** Назначить location равный текущему шагу */
  private syncLocationWithCurrentStep = (): void => {
    /** Только если шаг в location не соответствует текущему внутреннему шагу */
    if (this.locationStep !== this.currentStep) {
      if (this.config.preserveGlobalLocation) {
        this.locationPreserve.remember();
      }

      /** Генерируем location с указанием шага и прочих параметров */
      const path = this.config.matcher.generatePath(this.config.route, {
        ...this.locationParams,
        [this.config.param ?? 'step']: this.currentStep
      });

      this.config.history.push(path, {
        previousStep: this.overridePreviousStep,
        nextStep: this.overrideNextStep
      });

      if (this.config.preserveGlobalLocation) {
        this.locationPreserve.restore();
      }
    }
  };

  /** Назначить текущим шагом тот, что указан в location */
  private syncCurrentStepWithLocation = async (): Promise<void> => {
    if (!this.isExpectedLocation) {
      return;
    }

    /** Если шаг в location не указан, то сбрасываем шаг */
    if (!this.locationStep) {
      return this.reset();
    }

    if (this.locationStep !== this.currentStep) {
      await this.goTo(this.locationStep, this.locationState.previousStep, this.locationState.nextStep);
    }
  };

  /** Произойдет после того как сервис будет готов к работе */
  private handleReady = (): void => {
    /** При изменении шага нужно запушить в историю обновленный location */
    this.unsubscribe$ = new Subject<void>();
    this.currentStep$.pipe(takeUntil(this.unsubscribe$)).subscribe(this.syncLocationWithCurrentStep);

    /** При изменении в истории нужно перейти к указанному в location шаге */
    this.unregisterHistoryListener = this.config.history.listen(
      (): void => void this.syncCurrentStepWithLocation().catch(this.reset)
    );
  };
}
