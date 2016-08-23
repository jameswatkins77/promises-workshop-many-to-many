var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var Promise = require('bluebird');
var helpers = require('../lib/helpers');

function Authors() {
  return knex('authors');
}

function Books() {
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}


router.get('/', function(req, res, next) {
  Authors().select().then(function(authors){
    var promises=[];
    for(var i=0; i<authors.length; i++){
      promises.push(Authors_Books().select().where({author_id:authors[i].id}).join('books', 'books.id', '=', 'authors_books.book_id'))
    }
    return Promise.all(promises).then(function(results){
      var out=[];
      results=results.reverse()
      authors.forEach(function(value){
        value.books=results.pop()
        out.push(value)
      })
      res.render('authors/index', {authors:out})
    })
  })
});

router.get('/new', function(req, res, next) {
  Books().select().then(function (books) {
    res.render('authors/new', {books: books});
  })
});

router.post('/', function (req, res, next) {
  var bookIds = req.body.book_ids.split(",");
  delete req.body.book_ids;
  Authors().returning('id').insert(req.body).then(function (id) {
    helpers.insertIntoAuthorsBooks(bookIds, id[0]).then(function () {
      res.redirect('/authors');
    })
  })
});

router.get('/:id/delete', function (req, res, next) {
  Authors().where('id', req.params.id).first().then(function (author) {
    helpers.getAuthorBooks(req.params.id).then(function (authorBooks) {
      Books().select().then(function (books) {
        res.render('authors/delete', {author: author, author_books: authorBooks, books: books });
      })
    })
  })
})

router.post('/:id/delete', function (req, res, next) {
  Promise.all([
    Authors().where('id', req.params.id).del(),
    Authors_Books().where('author_id', req.params.id).del()
  ]).then(function (results) {
    res.redirect('/authors')
  })
})

router.get('/:id/edit', function (req, res, next) {
  Authors().where('id', req.params.id).first().then(function(author){
    Authors_Books().pluck('book_id').where('author_id', req.params.id).then(function(book_ids){
      Books().whereIn('id', book_ids).then(function(books){
        res.render('authors/edit', {author: author, author_books:books})
      });
    })
  })
})

router.post('/:id', function (req, res, next) {
  var bookIds = req.body.book_ids.split(",");
  delete req.body.book_ids;
  Authors().returning('id').where('id', req.params.id).update(req.body).then(function (id) {
    id = id[0];
    helpers.insertIntoAuthorsBooks(bookIds, id).then(function (){
    res.redirect('/authors');
    });
  })
})

router.get('/:id', function (req, res, next) {
  Authors().where('id', req.params.id).first().then(function(author){
    Authors_Books().pluck('book_id').where('author_id', req.params.id).then(function(book_ids){
      Books().whereIn('id', book_ids).then(function(books){
        res.render('authors/show', {author: author, books:books})
      });
    })
  })
})

module.exports = router;
