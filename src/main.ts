import "./style.css";

// Create the worker
const worker = new Worker(
  new URL("./workers/doubleWorker.ts", import.meta.url),
  { type: "module" }
);

// Create the array worker
const arrayWorker = new Worker(
  new URL("./workers/arrayWorker.ts", import.meta.url),
  { type: "module" }
);

// Update the form display
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>WebWorker Calculator</h1>
    
    <div class="calculator-section">
      <h2>Single Number</h2>
      <p>This sends a message to the worker containing just the primitive number.</p>
      <form id="numberForm">
        <input type="number" id="numberInput" placeholder="Enter a number" value="1">
        <button type="submit">Calculate</button>
      </form>
      <p>Result: <span id="result">-</span></p>
    </div>

    <div class="calculator-section">
      <h2>Array of Numbers</h2>
      <p>This sends an array of objects <code>{ value: number }[]</code> to the worker.</p>
      <p>The object is cloned, by the Structured Clone Algorithm, and the worker receives the clone. The clone might take time if the object is large.</p>
      <form id="arrayForm">
        <div class="input-group">
          <input type="number" class="arrayInput" placeholder="First number" value="2">
          <input type="number" class="arrayInput" placeholder="Second number" value="3">
          <input type="number" class="arrayInput" placeholder="Third number" value="4">
        </div>
        <button type="submit">Calculate All</button>
      </form>
      <p>Results: <span id="arrayResult">-</span></p>
    </div>

    <div class="calculator-section">
      <h2>Shared Buffer Array</h2>
      <p>This encodes the numbers into a <code>SharedArrayBuffer</code> and includes this in the object sent to the worker.
       Structured Clone does not clone the buffer, because it is a <code>SharedArrayBuffer</code> type.
       The worker then updates the buffer in place, and notifies when it's done. There is no protection against client and worker trampling each other's changes. 
       You would only do this if you're pursuing extreme speed. On modern browsers, you need to set headers to even permit it.</p>
      <form id="sharedArrayForm">
        <div class="input-group">
          <input type="number" class="sharedArrayInput" placeholder="First number" value="5">
          <input type="number" class="sharedArrayInput" placeholder="Second number" value="6">
          <input type="number" class="sharedArrayInput" placeholder="Third number" value="7">
        </div>
        <button type="submit">Calculate Using Shared Memory</button>
      </form>
      <p>Results: <span id="sharedArrayResult">-</span></p>
    </div>

    <div class="calculator-section">
      <h2>Transferable Array</h2>
      <p>This encodes the numbers into an <code>ArrayBuffer</code>, which is <code>Transferable</code>, and includes this in the object sent to the worker. The buffer is not copied; the worker takes ownership of it.</p>
      <p>While the worker has ownership, the client can't use the buffer. The worker may update the buffer in place, or it could send new data to the client instead.</p>
      <p>When the worker is done, its response message includes a transfer of ownership of the buffer, so the client can now use it.</p>

      <form id="transferableForm">
        <div class="input-group">
          <input type="number" class="transferableInput" placeholder="First number" value="8">
          <input type="number" class="transferableInput" placeholder="Second number" value="9">
          <input type="number" class="transferableInput" placeholder="Third number" value="10">
        </div>
        <button type="submit">Calculate Using Transfer</button>
      </form>
      <p>Results: <span id="transferableResult">-</span></p>
    </div>
  </div>
`;

// Handle form submission
const form = document.querySelector<HTMLFormElement>("#numberForm")!;
const resultSpan = document.querySelector<HTMLSpanElement>("#result")!;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = form.querySelector<HTMLInputElement>("#numberInput")!;
  const number = Number(input.value);

  // Send message to worker
  worker.postMessage(number);
});

// Handle worker response
worker.onmessage = (e: MessageEvent<number>) => {
  resultSpan.textContent = e.data.toString();
};

// Handle array form submission
const arrayForm = document.querySelector<HTMLFormElement>("#arrayForm")!;
const arrayResultSpan =
  document.querySelector<HTMLSpanElement>("#arrayResult")!;

arrayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = Array.from(
    arrayForm.querySelectorAll<HTMLInputElement>(".arrayInput")
  );
  const numbers = inputs.map((input) => ({
    value: Number(input.value),
  }));

  arrayWorker.postMessage({
    type: "DOUBLE_ARRAY",
    payload: numbers,
  });
});

// Handle array worker response
arrayWorker.onmessage = (e: MessageEvent<number[]>) => {
  arrayResultSpan.textContent = e.data.join(", ");
};

// Handle shared array form submission
const sharedArrayForm =
  document.querySelector<HTMLFormElement>("#sharedArrayForm")!;
const sharedArrayResultSpan =
  document.querySelector<HTMLSpanElement>("#sharedArrayResult")!;

sharedArrayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = Array.from(
    sharedArrayForm.querySelectorAll<HTMLInputElement>(".sharedArrayInput")
  );

  // Create a SharedArrayBuffer and view
  const buffer = new SharedArrayBuffer(inputs.length * 8); // 8 bytes per float64
  const array = new Float64Array(buffer);

  // Fill the array with input values
  inputs.forEach((input, index) => {
    array[index] = Number(input.value);
  });

  // Send the shared buffer to the worker
  arrayWorker.postMessage({
    type: "DOUBLE_ARRAY_SHARED_BUFFER",
    payload: {
      buffer,
      length: inputs.length,
    },
  });

  // Update UI immediately since we have access to the shared memory
  arrayWorker.onmessage = () => {
    sharedArrayResultSpan.textContent = Array.from(array).join(", ");
  };
});

// Handle transferable form submission
const transferableForm =
  document.querySelector<HTMLFormElement>("#transferableForm")!;
const transferableResultSpan = document.querySelector<HTMLSpanElement>(
  "#transferableResult"
)!;

transferableForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = Array.from(
    transferableForm.querySelectorAll<HTMLInputElement>(".transferableInput")
  );

  // Create an ArrayBuffer (not SharedArrayBuffer)
  const buffer = new ArrayBuffer(inputs.length * 8); // 8 bytes per float64
  const array = new Float64Array(buffer);

  // Fill the array with input values
  inputs.forEach((input, index) => {
    array[index] = Number(input.value);
  });

  // Send the buffer to the worker, transferring ownership
  arrayWorker.postMessage(
    {
      type: "DOUBLE_ARRAY_TRANSFER",
      payload: buffer,
      length: inputs.length,
    },
    [buffer] // List of transferable objects
  );
});

// Add handler for transferable response
arrayWorker.addEventListener("message", (e: MessageEvent<unknown>) => {
  if (e.data && typeof e.data === "object" && "type" in e.data) {
    switch (e.data.type) {
      case "DOUBLE_ARRAY_RESULT": {
        const payload = e.data as { type: string; payload: number[] };
        arrayResultSpan.textContent = payload.payload.join(", ");
        break;
      }
      case "TRANSFER_RESULT": {
        const payload = e.data as { type: string; payload: ArrayBuffer };
        const result = new Float64Array(payload.payload);
        transferableResultSpan.textContent = Array.from(result).join(", ");
        break;
      }
    }
  }
});
