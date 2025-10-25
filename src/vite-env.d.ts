/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.js' {
  const content: unknown;
  export default content;
}

declare module '*/searchJson' {
  const content: Array<{ label: string; [key: string]: unknown }>;
  export default content;
}
