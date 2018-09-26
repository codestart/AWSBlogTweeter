const request = require('request');

// https://aws.amazon.com/api/dirs/blog-posts/items?order_by=SortOrderValue&sort_ascending=false&limit=26&locale=en_US
//
// https://aws.amazon.com/api/dirs/blog-posts/items?
//        order_by=SortOrderValue &
//        sort_ascending=false &
//        limit=26 &
//        locale=en_US
//

var getBlogPost = (orderBy, sortAscending, limit, locale, callback) => {
  request({
    url: `https://aws.amazon.com/api/dirs/blog-posts/items?order_by=${orderBy}&sort_ascending=${sortAscending}&limit=${limit}&locale=${locale}`,
    json: true // convert returned JSON to a JS obj.
  }, (error, response, body) => {
    if(!error && response.statusCode === 200) {
      callback(undefined, body);
    }
    else {
      callback(error);
    }
  })
};

module.exports.getBlogPost = getBlogPost;
