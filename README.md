# Webworkers Demo

This is a demo application showing different ways to use Web Workers in TypeScript/JavaScript.

It demonstrates four different approaches to passing data between the main thread and worker threads:

1. Simple Primitive Values
   - Uses a basic worker ( `doubleWorker.ts` ) that receives a single number
   - The worker doubles the number and returns it
   - Shows the simplest possible worker communication pattern

2. Structured Clone Array
   - Uses `arrayWorker.ts` to process an array of numbers
   - Data is passed as an array of objects `{value: number}[]`

   - The worker receives a clone of the data via the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
   - Good for simple data structures but cloning can be slow for large objects

3. Shared Memory
   - Uses `SharedArrayBuffer` to share memory between main thread and worker
   - Both threads can access and modify the same memory
   - No data copying occurs
   - Very fast but requires careful coordination between threads
   - Needs special headers enabled in the browser for security

4. Transferable Objects
   - Uses `ArrayBuffer` with ownership transfer between threads
   - The buffer is transferred rather than copied
   - While one thread owns the buffer, the other cannot access it
   - Fast and memory efficient for large data
   - Safer than shared memory but less flexible

The demo includes a UI with forms to test each approach, showing the results of the worker calculations.

Disclaimer: A lot of this fell out of Cursor AI, and it deserves a clean-up. I can see at least one bug, where an `onMessage` fires for the wrong type of message.

Key Files:
* `main.ts`: Sets up the UI and handles communication with workers
* `doubleWorker.ts`: Simple worker that doubles a number
* `arrayWorker.ts`: More complex worker showing different data passing techniques

## To run:

```
npm install
npm run dev
```

Or just see it at https://ukslim.github.io/webworkers-demo/ 
