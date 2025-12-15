// API configuration - supports environment variables
const getApiBaseUrl = () => {
  // Priority: use environment variable (injected at build time)
  // Can be set via --build-arg during Docker build
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development: use relative path, leverages proxy in package.json
  // Proxy forwards /api requests to http://localhost:8080
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }
  
  // Production default (nginx proxies /api to backend in containerized deployment)
  // Or can be set to full backend URL for static deployment
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

