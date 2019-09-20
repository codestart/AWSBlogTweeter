sam local invoke --event events.json --env-vars dev.json 

// to use with no events:
sam local invoke --no-event --env-vars dev.json


// Had up upper-case the params in the file to match the env vars in the code
// The Params section of the template.yml file does not appear to be used (maybe only for when you're using the params on the command-line?
// -d port is needed for connecting to the debugger only
sam local invoke tweetOutBlogPosts -d 5677 --no-event --env-vars dev.json