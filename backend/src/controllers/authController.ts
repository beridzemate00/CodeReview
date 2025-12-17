import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRATION = '7d'; // 7 days
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
            },
        });

        console.log('User registered:', user.email);
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('Login failed: User not found -', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Login failed: Invalid password for -', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        console.log('User logged in:', user.email);
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Request password reset - generates token and returns reset link
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent email enumeration attacks
        if (!user) {
            console.log('Password reset requested for non-existent email:', email);
            return res.status(200).json({
                message: 'If an account exists with this email, a reset link has been generated',
                // For development, show that no user was found
                devMessage: 'No user found with this email'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Delete any existing reset tokens for this email
        await prisma.passwordReset.deleteMany({ where: { email } });

        // Create new reset token
        await prisma.passwordReset.create({
            data: {
                token: hashedToken,
                email,
                expiresAt
            }
        });

        // In production, you would send an email here
        // For now, return the reset link directly
        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

        console.log('Password reset requested for:', email);
        console.log('Reset link:', resetLink);

        res.status(200).json({
            message: 'If an account exists with this email, a reset link has been generated',
            // For development purposes, include the reset link
            resetLink,
            devMessage: 'In production, this link would be sent via email'
        });
    } catch (error) {
        console.error('Forgot password failed:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
};

// Verify reset token is valid
export const verifyResetToken = async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() }
            }
        });

        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        res.status(200).json({ valid: true, email: resetRecord.email });
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(500).json({ error: 'Failed to verify token' });
    }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() }
            }
        });

        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Find user and update password
        const user = await prisma.user.findUnique({ where: { email: resetRecord.email } });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Mark token as used
        await prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { used: true }
        });

        console.log('Password reset successful for:', user.email);
        res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('Password reset failed:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
