/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API do InfoHub. Padrão: http://localhost:3333 */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
