import dbConnect from "@/lib/dbConnect";
import { isUserInGroup, isUserGroupAdmin } from "@/lib/groupAuth";
import { Group } from "@/db/models";
import { IGroup } from "@/types/models";

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

type RouteHandler<T = any> = (
  req: Request, 
  context: any, 
  data: T
) => Promise<Response>;

export function withDb<T>(handler: RouteHandler<T>): RouteHandler<T> {
  return async (req, context, data) => {
    await dbConnect();
    return handler(req, context, data);
  };
}

export function withUserId<T>(handler: RouteHandler<T & { userId: string }>): RouteHandler<T> {
  return async (req, context, data = {} as T) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      throw new ApiError("User ID not found in request", 401);
    }
    return handler(req, context, { ...data, userId });
  };
}

export function withGroup<T>(handler: RouteHandler<T & { group: IGroup }>): RouteHandler<T> {
  return async (req, context, data = {} as T) => {
    const { groupId } = context.params;
    if (!groupId) {
      throw new ApiError("Group ID is required", 400);
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new ApiError("Group not found", 404);
    }

    return handler(req, context, { ...data, group });
  };
}

// Middleware to check user group membership
export function withGroupMembership<T>(handler: RouteHandler<T>): RouteHandler<T & { userId: string, group: IGroup }> {
  return async (req, context, data) => {
    const { userId, group } = data;
    const groupId = group._id.toString();

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      throw new ApiError(authCheck.message, authCheck.status);
    }

    return handler(req, context, data);
  };
}

export function withGroupAdmin<T>(handler: RouteHandler<T>): RouteHandler<T & { userId: string, group: IGroup }> {
  return async (req, context, data) => {
    const { userId, group } = data;
    const groupId = group._id.toString();

    const adminCheck = await isUserGroupAdmin(userId, groupId);
    if (!adminCheck.isAuthorized) {
      throw new ApiError(adminCheck.message, adminCheck.status);
    }

    return handler(req, context, data);
  };
}

// Function to compose middleware
export function compose(...middleware: Function[]) {
  return middleware.reduce((a, b) => (...args: any[]) => a(b(...args)));
}