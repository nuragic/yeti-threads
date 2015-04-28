/* jshint expr: true */
var config = require('getconfig');
var gatepost = require('gatepost');
var pg = require('pg');
var lab = exports.lab = require('lab').script();
var Hapi = require('hapi');
var util = require('util');
var code = require('code');

var client = new pg.Client(config.db);
gatepost.registerPG(client);
client.connect();

var server;

lab.experiment('forums', function () {
    var forum;
    lab.before(function (done) {
        server = new Hapi.Server();
        server.connection(config.server);

        server.register([
            {
                register: require('platform-gateway-auth')
            },
            {
                register: require('../'),
            },
        ], function (err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    lab.test('can create forum', function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test1',
                owner: 'bill',
                description: 'best forum ever 1'
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            forum = JSON.parse(res.payload);
            code.expect(forum.name).to.equal('test1');
            done();
        });
    });
    lab.test('can list forums', function (done) {
        server.inject({
            method: 'get',
            url: '/forums/' + forum.id,
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.name).to.equal('test1');
            done();
        });
    });

    lab.test('can update forum', function (done) {
        server.inject({
            method: 'put',
            url: '/forums/' + forum.id,
            payload: JSON.stringify({
                name: 'test2',
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.name).to.equal('test2');
            done();
        });
    });
    lab.test('can list forums', function (done) {
        server.inject({
            method: 'get',
            url: '/forums',
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.count).to.equal(1);
            done();
        });
    });
    lab.test('can delete forum', function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});

lab.experiment('threads', function () {
    var forum;
    var thread;
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test3',
                owner: 'bill',
                description: 'best forum ever 1'
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            forum = JSON.parse(res.payload);
            code.expect(forum.name).to.equal('test3');
            done();
        });
    });

    lab.test('can create thread', function (done) {
        server.inject({
            method: 'post',
            url: '/threads',
            payload: JSON.stringify({
                subject: 'test thread 1',
                author: 'bill',
                forum_id: forum.id,
                description: 'best thread ever 1'
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            thread = JSON.parse(res.payload);
            code.expect(thread.subject).to.equal('test thread 1');
            code.expect(thread.forum_id).to.equal(forum.id);
            done();
        });
    });
    
    lab.test('can get thread', function (done) {
        server.inject({
            method: 'get',
            url: '/threads/' + thread.id,
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            pl = JSON.parse(res.payload);
            code.expect(pl.subject).to.equal('test thread 1');
            code.expect(pl.forum_id).to.equal(forum.id);
            done();
        });
    });

    lab.test('can list threads', function (done) {
        server.inject({
            method: 'get',
            url: '/threads',
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            pl = JSON.parse(res.payload);
            code.expect(pl.count).to.equal(1);
            code.expect(pl.results[0].forum_id).to.equal(forum.id);
            done();
        });
    });
    
    lab.test('can delete thread', function (done) {
        server.inject({
            method: 'delete',
            url: '/threads/' + thread.id,
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });

    lab.after(function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});

lab.experiment('posts', function () {
    var forum;
    var thread;
    var post1, post2, post3, post4;
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test3',
                owner: 'bill',
                description: 'best forum ever 1'
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            forum = JSON.parse(res.payload);
            code.expect(forum.name).to.equal('test3');
            done();
        });
    });

    lab.before('can create thread', function (done) {
        server.inject({
            method: 'post',
            url: '/threads',
            payload: JSON.stringify({
                subject: 'test thread 1',
                author: 'bill',
                forum_id: forum.id,
                description: 'best thread ever 1'
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            thread = JSON.parse(res.payload);
            code.expect(thread.subject).to.equal('test thread 1');
            code.expect(thread.forum_id).to.equal(forum.id);
            done();
        });
    });

    lab.test('can create post', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 1',
                author: 'bill',
                thread_id: thread.id,
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post1 = JSON.parse(res.payload);
            code.expect(post1.body).to.equal('test post 1');
            code.expect(post1.thread_id).to.equal(thread.id);
            done();
        });
    });
    lab.test('can create post 2', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 2',
                author: 'bill',
                thread_id: thread.id,
                parent_id: post1.id
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post2 = JSON.parse(res.payload);
            code.expect(post2.body).to.equal('test post 2');
            code.expect(post2.thread_id).to.equal(thread.id);
            done();
        });
    });
    lab.test('can create post 3', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 3',
                author: 'bill',
                thread_id: thread.id,
                parent_id: post1.id
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post3 = JSON.parse(res.payload);
            code.expect(post3.body).to.equal('test post 3');
            code.expect(post3.thread_id).to.equal(thread.id);
            done();
        });
    });
    lab.test('can create post 4', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 4',
                author: 'bill',
                thread_id: thread.id,
                parent_id: post2.id
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post4 = JSON.parse(res.payload);
            code.expect(post4.body).to.equal('test post 4');
            code.expect(post4.thread_id).to.equal(thread.id);
            done();
        });
    });

    lab.test('can get posts in threaded order', function (done) {
        server.inject({
            method: 'get',
            url: '/threads/' + thread.id + '/posts',
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            pl = JSON.parse(res.payload);
            code.expect(pl.count).to.equal(4);
            code.expect(pl.results[0].body).to.equal('test post 1');
            code.expect(pl.results[1].body).to.equal('test post 2');
            code.expect(pl.results[2].body).to.equal('test post 4');
            code.expect(pl.results[3].body).to.equal('test post 3');
            done();
        });
    });
    
    lab.after('can delete post', function (done) {
        server.inject({
            method: 'delete',
            url: '/posts/' + post1.id,
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });

    lab.after('can delete thread', function (done) {
        server.inject({
            method: 'delete',
            url: '/threads/' + thread.id,
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });

    lab.after(function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});