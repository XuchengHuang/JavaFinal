// API配置 - 支持环境变量
const getApiBaseUrl = () => {
  // 优先使用环境变量（构建时注入）
  // 在Docker构建时可以通过 --build-arg 设置
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 开发环境：使用相对路径，利用package.json中的proxy配置
  // proxy会将 /api 请求代理到 http://localhost:8080
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }
  
  // 生产环境默认值（容器化部署时，nginx会代理/api到后端）
  // 或者静态部署时，可以设置为完整的后端URL
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

