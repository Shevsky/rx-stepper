import { History } from 'history';
import { IRouteMatcherInterface } from 'interfaces/route-matcher.interface';
import { TCommonStepperConfig } from './../common-stepper/common-stepper.type';

export type TRouteStepperConfig<T extends string> = TCommonStepperConfig<T> & {
  history: History;

  /**
   * Название параметра шага в роуте, по умолчанию "step"
   */
  param?: string;

  /**
   * Роут у которого указан параметр шага
   * @example "/flow/:step?"
   */
  route: string;

  /**
   * Объект с функциями для сопоставления pathname и route и генерации pathname по route
   */
  matcher: IRouteMatcherInterface;

  /**
   * Использовать шаг по умолчанию из location
   */
  takeDefaultStepFromLocation?: boolean;

  /**
   * Сохранять location.search и location.hash при переходах
   */
  preserveGlobalLocation?: boolean;
};
