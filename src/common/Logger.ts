export const Logger = (fileName: string, method?: string, details?: any) => {
  console.log(`(${fileName}) --> ${method} | Details: ${details}`);
};
