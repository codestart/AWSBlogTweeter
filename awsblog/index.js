const axios = require('axios');

// https://aws.amazon.com/api/dirs/blog-posts/items?order_by=SortOrderValue&sort_ascending=false&limit=26&locale=en_US
//
// https://aws.amazon.com/api/dirs/blog-posts/items?
//        order_by=SortOrderValue &
//        sort_ascending=false &
//        limit=26 &
//        locale=en_US
//



var getBlogPost = (orderBy, sortAscending, limit, locale) => {
  var awsBlogUrl = `https://aws.amazon.com/api/dirs/blog-posts/items?order_by=${orderBy}&sort_ascending=${sortAscending}&limit=${limit}&locale=${locale}`;

  axios.get(awsBlogUrl).then((response) => {
    // success case expression:
    console.log('Axios response.data is: ', JSON.stringify(response.data, undefined, 4));
  })
};

module.exports = {
    getBlogPost: getBlogPost
  };
