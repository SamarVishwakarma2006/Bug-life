import type { RequestHandler } from 'express';
import * as authService from '../services/authService.js';

export const register: RequestHandler = async (req, res) => {
  res.status(201).json(await authService.register(req.body));
};
export const login: RequestHandler = async (req, res) => {
  res.json(await authService.login(req.body));
};
export const me: RequestHandler = async (_req, res) => {
  res.json({ user: await authService.getMe(res.locals.userId as string) });
};
