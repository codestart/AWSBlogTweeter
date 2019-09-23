// Start docker for the build to use

// Delete previous build:
del .\.aws-sam\ -R

// Build
sam build --use-container

// Had up upper-case the params in the file to match the env vars in the code
// -d port is needed for connecting to the debugger only
sam local invoke tweetOutBlogPosts -d 5677 --no-event --env-vars dev.json

// Note: changes to template.yml and other files need a delete & build before they are in play.
