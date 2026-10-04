import type { Request, RequestHandler, Response } from 'express';
import * as service from '../services/bugService.js';
import { idSchema } from '../validators/projects.js';
import {
  assignSchema,
  bugSchema,
  commentSchema,
  editBugSchema,
  filtersSchema,
  statusSchema,
} from '../validators/bugs.js';
const actor = (res: Response) => res.locals.userId as string;
const id = (req: Request) => idSchema.parse(req.params.id);
export const reorder: RequestHandler = async (req, res) => {
  const input = statusSchema.parse(req.body);
  res.json(
    await service.reorder(actor(res), id(req), input.status, input.position),
  );
};
export const list: RequestHandler = async (req, res) => {
  res.json(
    await service.list(actor(res), id(req), filtersSchema.parse(req.query)),
  );
};
export const mine: RequestHandler = async (_req, res) => {
  res.json(await service.mine(actor(res)));
};
export const get: RequestHandler = async (req, res) => {
  res.json(await service.get(actor(res), id(req)));
};
export const create: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(await service.create(actor(res), id(req), bugSchema.parse(req.body)));
};
export const update: RequestHandler = async (req, res) => {
  res.json(
    await service.update(actor(res), id(req), editBugSchema.parse(req.body)),
  );
};
export const move: RequestHandler = async (req, res) => {
  const input = statusSchema.parse(req.body);
  res.json(
    await service.move(actor(res), id(req), input.status, input.position),
  );
};
export const assign: RequestHandler = async (req, res) => {
  res.json(
    await service.assign(
      actor(res),
      id(req),
      assignSchema.parse(req.body).assigneeId,
    ),
  );
};
export const remove: RequestHandler = async (req, res) => {
  res.json(await service.remove(actor(res), id(req)));
};
export const comments: RequestHandler = async (req, res) => {
  res.json(await service.comments(actor(res), id(req)));
};
export const comment: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(
      await service.comment(
        actor(res),
        id(req),
        commentSchema.parse(req.body).body,
      ),
    );
};
export const editComment: RequestHandler = async (req, res) => {
  res.json(
    await service.comment(
      actor(res),
      id(req),
      commentSchema.parse(req.body).body,
      idSchema.parse(req.params.commentId),
    ),
  );
};
export const removeComment: RequestHandler = async (req, res) => {
  res.json(
    await service.removeComment(
      actor(res),
      id(req),
      idSchema.parse(req.params.commentId),
    ),
  );
};
