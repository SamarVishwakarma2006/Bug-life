import type { Request, RequestHandler, Response } from 'express';
import * as service from '../services/projectService.js';
import {
  idSchema,
  memberRoleSchema,
  memberSchema,
  projectSchema,
} from '../validators/projects.js';
const actor = (res: Response) => res.locals.userId as string;
const id = (req: Request) => idSchema.parse(req.params.id);
export const list: RequestHandler = async (_req, res) => {
  res.json(await service.list(actor(res)));
};
export const get: RequestHandler = async (req, res) => {
  res.json(await service.get(actor(res), id(req)));
};
export const create: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(await service.create(actor(res), projectSchema.parse(req.body)));
};
export const update: RequestHandler = async (req, res) => {
  res.json(
    await service.update(actor(res), id(req), projectSchema.parse(req.body)),
  );
};
export const remove: RequestHandler = async (req, res) => {
  res.json(await service.remove(actor(res), id(req)));
};
export const members: RequestHandler = async (req, res) => {
  res.json(await service.members(actor(res), id(req)));
};
export const addMember: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(
      await service.addMember(
        actor(res),
        id(req),
        memberSchema.parse(req.body),
      ),
    );
};
export const changeMember: RequestHandler = async (req, res) => {
  res.json(
    await service.changeMember(
      actor(res),
      id(req),
      idSchema.parse(req.params.userId),
      memberRoleSchema.parse(req.body).role,
    ),
  );
};
export const removeMember: RequestHandler = async (req, res) => {
  res.json(
    await service.changeMember(
      actor(res),
      id(req),
      idSchema.parse(req.params.userId),
      null,
    ),
  );
};
export const activity: RequestHandler = async (req, res) => {
  res.json(await service.activity(actor(res), id(req)));
};
