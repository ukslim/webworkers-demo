// Handle messages received from the main thread
self.onmessage = (e: MessageEvent<number>) => {
  console.log(e);
  // This, the dumbest of workers, just assumes messages contain a number
  const result = double(e.data);
  self.postMessage(result);
};

// The function that doubles the input
function double(x: number): number {
  return x * 2;
}

// Required to make TypeScript treat this as a module
export {};
