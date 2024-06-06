export type PrivateConstructorParameters<T> = ConstructorParameters<
  { new (): never } & T
>;
