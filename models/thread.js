"use strict";

const SQL = require('sql-template-strings');
const joi = require('joi');

module.exports = (gatepost) =>  {

  const Thread = new gatepost.Model({
    id: {
      primary: true,
      validate: joi.number().integer()
    },
    forum_id: {
      validate: joi.number().integer()
    },
    author: {
      validate: joi.string().max(50)
    },
    subject: {
      validate: joi.string().max(200)
    },
    open: {
      validate: joi.boolean(),
      required: true,
      default: true
    },
    locked: {
      validate: joi.boolean(),
      required: true,
      default:false
    },
    tags: {
      validate: joi.array().items(joi.string().max(50)).max(50)
    },
    create: {
      validate: joi.date()
    },
    updated: {
      validate: joi.date()
    }
  },
  {
    name: 'thread',
    cache: true
  });

  Thread.registerFactorySQL({
    name: "get",
    sql: (args) => SQL`SELECT threads.id, threads.forum_id, threads.author, threads.subject, threads.open, threads.locked, threads.tags, threads.created, threads.updated
  FROM threads
  JOIN forums ON threads.forum_id=forums.id
  JOIN forums_access ON forums_access.forum_id=forums.id
  WHERE threads.id=${args.thread_id} AND (forums_access.user_id=${args.user_id} OR forums.owner=${args.user_id})`,
    oneResult: true
  });

  Thread.registerFactorySQL({
    name: "deconste",
    sql: (args) => SQL`DELETE FROM threads WHERE id=${args.id} AND author=${args.user}`,
    oneResult: true
  });

  const ThreadPage = new gatepost.Model({
    results: {collection: 'thread'},
    count: {type: 'integer'},
    total: {type: 'integer'}
  });

  ThreadPage.registerFactorySQL({
    name: "all",
    sql: (args) => SQL`SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='threads') AS total,
  json_agg(row_to_json(thread_rows)) as results,
  count(thread_rows.*)::INTEGER as count
  FROM (SELECT threads.id, threads.forum_id, threads.author, threads.subject, threads.open, threads.locked, threads.tags, threads.created, threads.updated
  FROM threads
  JOIN forums ON threads.forum_id=forums.id
  JOIN forums_access ON forums.id=forums_access.forum_id
  WHERE user_id=${args.user_id} OR forums.owner=${args.user_id}
  ORDER BY threads.id LIMIT ${args.limit} OFFSET ${args.offset}) thread_rows`,
    defaults: {
      limit: 20,
      offset: 0
    },
    oneResult: true
  });

  Thread.fromSQL({
    name: 'insert',
    instance: true,
    sql: (args, model) => SQL`SELECT * FROM create_thread(${model.toJSON()}, ${args.user})`,
    oneResult: true,
    required: true
  });

  Thread.registerFactorySQL({
    name: 'update',
    instance: true,
    sql: (args, model) => SQL`SELECT * from update_thread(${model.toJSON()}, ${args.user_id})`,
    oneResult: true
  });

  Thread.registerFactorySQL({
    name: 'delete',
    sql: (args, model) => SQL`DELETE FROM threads WHERE id=${args.id} RETURNING id`,
    oneResult: true
  });

  ThreadPage.registerFactorySQL({
    name: "allByForum",
    sql: (args) => SQL`SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='threads') AS total,
      json_agg(row_to_json(thread_rows)) as results,
      count(thread_rows.*) as count
      FROM (SELECT threads.id, threads.forum_id, threads.author, threads.subject, threads.open, threads.locked, threads.tags, threads.created, threads.updated
      FROM forums
      JOIN forums_access ON forums_access.forum_id=forums.id
      JOIN threads ON forums.id=threads.forum_id
      WHERE forums.id=${args.forum_id} AND forums_access.user_id=${args.user_id}
      ORDER BY id LIMIT ${args.limit} OFFSET ${args.offset}) thread_rows`,
    defaults: {
      limit: 20,
      offset: 0
    },
    oneResult: true
  });

  Thread.all = ThreadPage.all;
  Thread.allByForum = ThreadPage.allByForum;

  return Thread;
};

