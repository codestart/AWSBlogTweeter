const yargs = require('yargs');

const awsblog = require('./awsblog/index.js');
const twitter = require('./twitter/twitter.js');

const argv = yargs
  .options({
    l: {
      demand: false,
      alias: 'limit',
      describe: 'Number of blog entries to retrieve.',
      default: 1,
      string: true // make sure an address is there!
    }
  })
  .help()
  .alias('help', 'h')
  .argv;

awsblog.getBlogPost('SortOrderValue', false, argv.limit, 'en_US', (error, blogPosts) => {
  if(error) {
    console.log('Oops! There was an error: ' + error);
  }
  else {
  //  console.log(JSON.stringify(blogPosts, undefined, 4));
    for(var i = 0; i < blogPosts.items.length; i++) {
      console.log(blogPosts.items[i].id + ') ' + blogPosts.items[i].additionalFields.link);
      twitter.sendTweet(blogPosts.items[i].additionalFields.link);
    }
  }
});
