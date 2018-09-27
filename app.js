const yargs = require('yargs');

const awsblog = require('./awsblog/index.js');
const twitter = require('./twitter/twitter.js');

const argv = yargs
  .options({
    l: {
      demand: true,
      alias: 'limit',
      describe: 'Number of blog entries to retrieve.',
      string: true // make sure an address is there!
    }
  })
  .help()
  .alias('help', 'h')
  .argv;
/*
{
  blogpostId: body.items[0].id,
  url: body.items[0].additionalFields.link
}
*/
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
