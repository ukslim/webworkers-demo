type WorkerMessage = {
  type: "DOUBLE_ARRAY" | "DOUBLE_ARRAY_SHARED_BUFFER" | "DOUBLE_ARRAY_TRANSFER";
  payload:
    | Array<{ value: number }>
    | {
        buffer: SharedArrayBuffer;
        length: number;
      }
    | ArrayBuffer;
  length?: number;
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === "DOUBLE_ARRAY") {
    const result = doubleArray(e.data.payload as Array<{ value: number }>);
    self.postMessage({ type: "DOUBLE_ARRAY_RESULT", payload: result });
  } else if (e.data.type === "DOUBLE_ARRAY_SHARED_BUFFER") {
    const { buffer, length } = e.data.payload as {
      buffer: SharedArrayBuffer;
      length: number;
    };
    doubleArrayShared(buffer, length);
    self.postMessage("done");
  } else if (e.data.type === "DOUBLE_ARRAY_TRANSFER") {
    const buffer = e.data.payload as ArrayBuffer;
    const length = e.data.length!;
    const result = doubleArrayTransfer(buffer, length);
    self.postMessage(
      { type: "TRANSFER_RESULT", payload: result },
      { transfer: [result] }
    );
  }
};

function doubleArray(items: Array<{ value: number }>): number[] {
  return items.map((item) => item.value * 2);
}

function doubleArrayShared(buffer: SharedArrayBuffer, length: number): void {
  const array = new Float64Array(buffer);
  for (let i = 0; i < length; i++) {
    array[i] = array[i] * 2;
  }
}

function doubleArrayTransfer(buffer: ArrayBuffer, length: number): ArrayBuffer {
  const array = new Float64Array(buffer);
  for (let i = 0; i < length; i++) {
    array[i] = array[i] * 2;
  }
  return buffer;
}

export {};
