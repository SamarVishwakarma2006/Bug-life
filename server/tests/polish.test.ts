import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { db } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { uploadsDir } from '../src/services/attachmentService.js';
test('analytics, private search/uploads, notification ownership and password revocation', async () => {
  const run = randomUUID(); const passwordHash = await bcrypt.hash('old-password',12);
  const accounts = await Promise.all(['owner','outside'].map((name) => db.user.create({ data: { name, email: `${name}-${run}@example.test`, passwordHash } })));
  const [owner,outside] = accounts; assert(owner && outside);
  const project = await db.project.create({ data: { name: 'Private Search Needle', key: 'PN', ownerId: owner.id, members: { create: { userId: owner.id, role: 'OWNER' } } } });
  const bug = await db.bug.create({ data: { projectId: project.id, number: 1, title: 'Private Search Needle payment', reporterId: owner.id, assigneeId: owner.id, status: 'RESOLVED', createdAt: new Date(Date.now()-7200000), resolvedAt: new Date() } });
  const server = app.listen(0,'127.0.0.1'); await new Promise<void>((resolve) => server.once('listening',resolve)); const address=server.address(); assert(address && typeof address !== 'string'); const base=`http://127.0.0.1:${address.port}`;
  const tokens = accounts.map((user) => jwt.sign({version:0},env.JWT_SECRET,{subject:user.id,algorithm:'HS256',expiresIn:'1h',issuer:'buglife',audience:'buglife-client'}));
  const files: string[]=[];
  async function request(index:number,path:string,method='GET',body?:unknown) { return fetch(`${base}${path}`,{method,headers:{Authorization:`Bearer ${tokens[index]}`,...(body instanceof FormData ? {} : {'Content-Type':'application/json'})},...(body === undefined ? {} : {body:body instanceof FormData ? body : JSON.stringify(body)})}); }
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  const form = (bytes: Uint8Array, mime='image/png') => { const value=new FormData(); value.append('file',new Blob([new Uint8Array(bytes)],{type:mime}),'test.png');return value; };
  try {
    const search = await (await request(0,'/api/search?q=Needle')).json() as {bugs:unknown[];projects:unknown[]}; assert.equal(search.bugs.length,1);assert.equal(search.projects.length,1);
    const hidden = await (await request(1,'/api/search?q=Needle')).json() as {bugs:unknown[];projects:unknown[]};assert.equal(hidden.bugs.length,0);assert.equal(hidden.projects.length,0);
    const keySearch = await (await request(0,'/api/search?q=PN-1')).json() as {bugs:unknown[]};assert.equal(keySearch.bugs.length,1);
    assert.equal((await request(1,`/api/projects/${project.id}/analytics`)).status,404);
    const analytics = await (await request(0,`/api/projects/${project.id}/analytics`)).json() as {averageResolutionHours:number;resolvedPerDay:unknown[]};assert(Math.abs(analytics.averageResolutionHours-2)<0.01);assert.equal(analytics.resolvedPerDay.length,30);
    const dash = await (await request(0,'/api/dashboard')).json() as {resolvedCount:number};assert.equal(dash.resolvedCount,1);
    assert.equal((await request(0,`/api/bugs/${bug.id}/attachments`,'POST',form(Buffer.from('not-an-image')))).status,400);
    assert.equal((await request(0,`/api/bugs/${bug.id}/attachments`,'POST',form(image,'image/svg+xml'))).status,400);
    assert.equal((await request(0,`/api/bugs/${bug.id}/attachments`,'POST',form(Buffer.alloc(5*1024*1024+1)))).status,413);
    assert.equal((await request(1,`/api/bugs/${bug.id}/attachments`,'POST',form(image))).status,404);
    const uploaded = await request(0,`/api/bugs/${bug.id}/attachments`,'POST',form(image));assert.equal(uploaded.status,201);const attachment = await uploaded.json() as {id:string;path?:string};assert.equal(attachment.path,undefined);
    const stored = await db.attachment.findUniqueOrThrow({where:{id:attachment.id}});files.push(stored.path);
    const download = await request(0,`/uploads/${attachment.id}`);assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await download.arrayBuffer()),image);
    assert.equal((await request(1,`/uploads/${attachment.id}`)).status,404);assert.equal((await fetch(`${base}/uploads/${attachment.id}`)).status,401);
    const notification=await db.notification.create({data:{userId:owner.id,bugId:bug.id,type:'TEST',message:'Private test'}});assert.equal((await request(1,`/api/notifications/${notification.id}/read`,'PATCH')).status,404);assert.equal((await request(0,`/api/notifications/${notification.id}/read`,'PATCH')).status,200);
    assert.equal((await request(0,'/api/auth/me','PATCH',{name:'Updated Tester',email:owner.email})).status,200);
    assert.equal((await request(0,'/api/auth/password','PATCH',{currentPassword:'wrong',password:'new-password'})).status,400);
    assert.equal((await request(0,'/api/auth/password','PATCH',{currentPassword:'old-password',password:'new-password'})).status,200);
    assert.equal((await request(0,'/api/auth/me')).status,401);
    const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:owner.email,password:'new-password'})});assert.equal(login.status,200);
  } finally { await Promise.all(files.map((file)=>unlink(resolve(uploadsDir,file)).catch(()=>{}))); await db.project.delete({where:{id:project.id}});await db.user.deleteMany({where:{id:{in:accounts.map((user)=>user.id)}}});await db.$disconnect();await new Promise<void>((resolve,reject)=>server.close((error)=>error?reject(error):resolve())); }
});
