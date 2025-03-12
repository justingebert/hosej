/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Wraps an API route handler with error handling
 */
export function withErrorHandling<T extends Request>(
  handler: (req: T, context?: any) => Promise<Response>
) {
  return async (req: T, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      console.error(`API Error in ${req.url}:`, error);
      
      return Response.json(
        { message: error.message || "Internal Server Error" }, 
        { status: error.status || 500 }
      );
    }
  };
}