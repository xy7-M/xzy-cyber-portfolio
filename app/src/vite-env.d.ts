/// <reference types="vite/client" />

// Vite turns these into static asset URLs, but TypeScript needs to be told
// about the extensions that vite/client doesn't ship by default.
declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.gltf' {
  const src: string;
  export default src;
}
