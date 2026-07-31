// Base API URL for backend calls (Catalyst Advanced I/O function)
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 
  'https://project-rainfall-60072062952.development.catalystserverless.in/server/expensetrackerfunction').replace(/\/$/, '');
