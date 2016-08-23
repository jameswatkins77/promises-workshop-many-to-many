var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var helpers = require('../lib/helpers')

function Books() {
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}

function Authors() {
  return knex('authors');
}

router.get('/', function(req, res, next) {
  // your code here
  // needs books and book.authors
  Books().then(function(books){
    var promises=[];
    for(var i=0; i<books.length; i++){
      promises.push(Authors_Books().join('authors', 'authors.id', '=', 'authors_books.author_id').where({book_id:books[i].id}))
    }
    return Promise.all(promises).then(function(results){
      var book = [];
      for (var i = 0; i < results.length; i++) {
        books[i].authors=results[i];
      }
      res.render('books/index', {books:books})
    })
  })
});

router.get('/new', function(req, res, next) {
  res.render('books/new');
});

router.post('/', function (req, res, next) {
  var errors = [];
  if(!req.body.title.trim()){errors.push("Title cannot be blank")}
  if(!req.body.genre.trim()){errors.push("Genre cannot be blank")}
  if(!req.body.cover_url.trim()){errors.push("Cover image cannot be blank")}
  if(!req.body.description.trim()){errors.push("Description cannot be blank")}
  if(errors.length){
    res.render('books/new', { book: req.body, errors: errors })
  } else {
    Books().insert(req.body).then(function (results) {
        res.redirect('/');
    })
  }
})

router.get('/:id/delete', function(req, res, next) {
  // your code here
  Books().where('id', req.params.id).first().then(function (book) {
    helpers.getBookAuthors(req.params.id).then(function (authors) {
      console.log("this is book");
      console.log(book);
      console.log("this is authors");
      console.log(authors);
      res.render('books/delete', {authors: authors, book: book });
    })
  })
});

router.post('/:id/delete', function(req, res, next) {
  Books().where('id', req.params.id).del().then(function (book) {
    res.redirect('/books');
  })
});

router.get('/:id/edit', function(req, res, next) {
  Books().where('id', req.params.id).first().then(function (book) {
    res.render('books/edit', {book: book});
  })
});

router.get('/:id', function(req, res, next) {
  // your code here
  Books().where('id', req.params.id).first().then(function(book){
    Authors_Books().pluck('author_id').where('book_id', req.params.id).then(function(author_ids){
      Authors().whereIn('id', author_ids).then(function(authors){
        res.render('books/show', {authors: authors, book:book})
      });
    })
  })
});

router.post('/:id', function(req, res, next) {
  var errors = [];
  if(!req.body.title.trim()){errors.push("Title cannot be blank")}
  if(!req.body.genre.trim()){errors.push("Genre cannot be blank")}
  if(!req.body.cover_url.trim()){errors.push("Cover image cannot be blank")}
  if(!req.body.description.trim()){errors.push("Description cannot be blank")}
  if(errors.length){
    res.render('books/edit', { book: req.body, errors: errors })
  } else {
    Books().where('id', req.params.id).update(req.body).then(function (results) {
      res.redirect('/');
    })
  }
});

module.exports = router;
