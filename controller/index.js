var express = require('express');
var User = require('../model/user');
var Article = require('../model/article');
var Date = require('../util/dateUtil.js');
var Arr = require('../util/arrUtil.js');
var router = express.Router();

router.get('/', function (req, res, next) {

  //判断是否是第一页，并把请求的页数转换成 number 类型
  var page = req.query.p ? parseInt(req.query.p) : 1;
  Article.count({}, function (err, count) {
    Article.find({}, null, {skip: (page - 1) * 10, limit: 10, sort: {_id: -1}}, function (err, articles) {
      if (err) console.error(err);
      res.render('index', {
        name: '塔歌',
        page: page,
        isFirstPage: page == 1,
        isLastPage: (page - 1) * 10 + articles.length == count,
        articles: articles,
        user: req.session.user
      });
    })
  });

});

router.get('/tags', function (req, res, next) {

  //判断是否是顶部
  var isTop = req.query.top == 1;
  Article.find({}, function (err, articles) {
    if (err) console.log(err);
    if (articles && articles.length > 0) {
      var tags = [];
      for (var i = 0; i < articles.length; i++) {
        tags = tags.concat(articles[i].tags);
      }
      if (isTop) {
        res.send({"tags": Arr.map2arr(Arr.unique(tags)).slice(0, 4)});
      } else {
        res.send({"tags": Arr.map2arr(Arr.unique(tags))});
      }
    }

  })
});
router.get('/article/:id', function (req, res, next) {

  Article.findByIdAndUpdate({_id: req.params.id}, {"$inc": {"view": 1}}, function (err, article) {
    if (err) console.error(err);
    if (article) {
      res.render('article', {name: '塔歌', article: article});
    }
  })
});
router.get('/article/tags/:tag', function (req, res, next) {
  //判断是否是第一页，并把请求的页数转换成 number 类型
  var page = req.query.p ? parseInt(req.query.p) : 1;
  Article.count({tags: req.params.tag}, function (err, count) {
    Article.find({tags: req.params.tag}, null, {
      skip: (page - 1) * 10,
      limit: 10,
      sort: {_id: -1}
    }, function (err, articles) {
      if (err) console.error(err);
      res.render('index', {
        name: '塔歌',
        page: page,
        isFirstPage: page == 1,
        isLastPage: (page - 1) * 10 + articles.length == count,
        articles: articles,
        user: req.session.user
      });
    })
  });
});
router.post('/article', function (req, res, next) {
  var article = {
    title: req.body.title,
    head_img: req.body.head_img,
    tags: req.body.tags.split(' '),
    validity: req.body.validity,
    content: req.body.content,
    date: Date.getDateTime()
  };
  Article.create(article, function (err, article) {
    if (err) {
      console.log(err);
    } else {
      console.log(article._id);
      res.send({status: 1, id: article._id});
    }
  })

});
router.post('/article/:id', function (req, res, next) {
  var article = {
    title: req.body.title,
    head_img: req.body.head_img,
    tags: req.body.tags.split(' '),
    validity: req.body.validity,
    content: req.body.content
  };
  Article.findByIdAndUpdate(req.params.id, {$set:article}, function (err, article) {
    if (err) {
      console.log(err);
    } else {
      res.send({status: 1, id: article._id});
    }
  })
});
router.get('/editor', function (req, res, next) {
  if (req.session.user) {
    res.render('editor', {name: '塔歌', isArticle: 0});
  } else {
    res.end('login');
  }
});

router.get('/editor/:id', function (req, res, next) {
  if (req.session.user) {
    Article.findById({_id: req.params.id}, function (err, article) {
      if (err) console.error(err);
      if (article) {
        console.log(article);
        res.render("editor",{name: '塔歌', isArticle: 1, article: article});
      }
    })
  } else {
    res.redirect('/login');
  }
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', function (req, res, next) {
  User.findOne({name: req.body.user, pwd: req.body.pwd}, function (err, user) {
    if (err) console.error(err);
    if (user) {//如果用户存在添加session
      req.session.user = user;
      res.redirect('editor');
    } else {
      res.end('error', {msg: "用户名或密码错误"});
    }
  })
});
router.get('/logout', function (req, res, next) {
  req.session.user = null;
  res.redirect('/');//登出成功后跳转到主页
});
module.exports = router;
