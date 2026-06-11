// Control-flow signals and small async primitives used by the engine.

/** Thrown by ctx.endTurnNow() (Rhinocorn / Zombie). Caught at the turn boundary. */
export class EndTurnSignal extends Error {
  constructor() {
    super("end-turn");
    this.name = "EndTurnSignal";
  }
}

/** A promise paired with its resolve fn, used to park an effect awaiting input. */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  settled: boolean;
}

export function makeDeferred<T>(): Deferred<T> {
  let resolveFn!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolveFn = res;
  });
  const d: Deferred<T> = {
    promise,
    settled: false,
    resolve: (value: T) => {
      if (d.settled) return; // null-guard against double-resolve / timeout race
      d.settled = true;
      resolveFn(value);
    },
  };
  return d;
}
