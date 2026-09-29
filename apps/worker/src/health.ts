export interface WorkerHealth {
  isReady(): boolean;
  markReady(): void;
  markNotReady(): void;
}

export function createWorkerHealth(): WorkerHealth {
  let ready = false;

  return {
    isReady: () => ready,
    markReady: () => {
      ready = true;
    },
    markNotReady: () => {
      ready = false;
    },
  };
}
