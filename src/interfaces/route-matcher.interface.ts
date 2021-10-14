export type TRouteMatcherParams = Record<string, string>;

export interface IRouteMatcherMatch {
  params: TRouteMatcherParams;
}

export interface IRouteMatcherInterface {
  matchPath(pathname: string, route: string): IRouteMatcherMatch | null;

  generatePath(pattern: string, params?: TRouteMatcherParams): string;
}
