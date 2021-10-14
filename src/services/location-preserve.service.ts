/**
 * Сервис, позволяющий сохранить и затем восстановить search и hash параметры
 * Это полезно при работе с изолированным от window объектом истории,
 * который только синхронизируется с window.history
 */
export class LocationPreserveService {
  private search?: string;
  private hash?: string;

  constructor(private readonly location: Location, private readonly history: History) {}

  remember(): void {
    this.search = this.location.search;
    this.hash = this.location.hash;
  }

  restore(): void {
    if (this.search || this.hash) {
      const actualState = this.history.state as object;
      const actualTitle = document.title;
      const nextUrl = this.location.protocol
        .concat('//')
        .concat(this.location.host)
        .concat(this.location.pathname)
        .concat(this.search || this.location.search)
        .concat(this.hash || this.location.hash);

      this.history.replaceState(actualState, actualTitle, nextUrl);
    }
  }
}
