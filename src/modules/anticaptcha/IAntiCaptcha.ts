export interface IAntiCaptcha {
  readonly secret: string,

  process: (image: string) => Promise<{
    id: number,
    text: string,
  } | false>;
  report: (id: number) => void;
  correct: (id: number) => void;
}
