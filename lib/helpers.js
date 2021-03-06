var Promise = require('bluebird');
var knex = require('../db/knex');

function Authors() {
  return knex('authors');
}

function Books(){
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}

function prepIds(ids) {
  return ids.filter(function (id) {
    return id !== '';
  })
}

function insertIntoAuthorsBooks(bookIds, authorId) {
  bookIds = prepIds(bookIds);
  return Promise.all(bookIds.map(function (book_id) {
    book_id = Number(book_id)
    return Authors_Books().insert({
      book_id: book_id,
      author_id: authorId
    })
  }))
}

function getAuthorBooks(author) {
  return Authors_Books().join('books', 'books.id', '=', 'authors_books.book_id').where('authors_books.author_id',author)
}

function getBookAuthors(book) {
  return Authors_Books().join('authors', 'authors.id', '=', 'authors_books.author_id').where('authors_books.book_id', book)
}


module.exports = {
  getAuthorBooks: getAuthorBooks,
  getBookAuthors: getBookAuthors,
  insertIntoAuthorsBooks: insertIntoAuthorsBooks
}
