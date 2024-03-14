export interface IAntiCaptcha {
  readonly secret: string,

  process: (image: string) => Promise<{
    id: number,
    text: string,
  } | false>;
  hasActiveProviders: () => boolean;
  report: (id: number) => void;
  correct: (id: number) => void;
}
