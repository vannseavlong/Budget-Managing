// Shared type definitions for Budget Managing application

export interface Config {
  // Database configuration
  database?: {
    url?: string;
    host?: string;
    port?: number;
    name?: string;
  };

  // Server configuration
  server?: {
    port?: number;
    host?: string;
  };

  // API configuration
  api?: {
    baseUrl?: string;
    version?: string;
  };
}

export interface AppConfig extends Config {
  environment: 'development' | 'production' | 'test';
}
