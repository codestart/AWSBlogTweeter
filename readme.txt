// Start docker for the build to use

// Delete previous build (PowerShell terminal in VSCode):
del .\.aws-sam\ -R

// Build
sam build --use-container
// Or:
sam build --use-container --template config\template.yml

// Had up upper-case the params in the file to match the env vars in the code
// -d port is needed for connecting to the debugger only
sam local invoke tweetOutBlogPosts -d 5677 --no-event --env-vars dev.json
// Or using config folder to tidy things up:
// Note: to change the location of template.yml you have to change how it refers to where the codebase is
//       in its 'codebase' element.
sam local invoke tweetOutBlogPosts -d 5678 --no-event --env-vars config/dev.json --template config/template.yml

// Note: changes to template.yml and other files need a delete & build before they are in play.

// How to override cached layers either at the command-line during 'invoke' or in the template.yml file in
//       the layer's section?

// How to run sam deploy but not deploy tests OR node_modules (taken care of by node_modules layer)
// ...   also create script for when you want to deploy the node_modules layer (simply a separate template.yml?)

Then using the Debugger in VSCode select 'Run'
