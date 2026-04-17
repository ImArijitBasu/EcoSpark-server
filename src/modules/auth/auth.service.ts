import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokens, verifyRefreshToken, TokenPayload } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.schema';

export class AuthService {
  async register(data: RegisterInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    const tokens = generateTokens(tokenPayload);

    return { user, ...tokens };
  }

  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact admin.', 403);
    }

    // Compare password
    const isMatch = await comparePassword(data.password, user.password);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    const tokens = generateTokens(tokenPayload);

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Check that user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or deactivated', 401);
      }

      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      };

      const tokens = generateTokens(tokenPayload);

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ideas: true,
            votes: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) throw new AppError('Incorrect current password', 401);

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export const authService = new AuthService();
