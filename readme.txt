// See IAM breakdown below the step-by-step.
// Test Commit (create HEAD!)

// Start docker for the build to use



// Delete previous build (PowerShell terminal in VSCode):
// Note: changes to template.yml and other files need a delete & build before they are in play.
del .\.aws-sam\ -R
del .\packaged.yaml

// Build the docker instance as per thhe template.yml
sam build --use-container
// Or:
sam build --use-container --template config\template.yml

// Had up upper-case the params in the file to match the env vars in the code
// -d port is needed for connecting to the debugger only
sam local invoke tweetOutBlogPosts -d 5677 --no-event --env-vars dev.json
// Or using config folder to tidy things up:
sam local invoke tweetOutBlogPosts -d 5678 --no-event --env-vars config/dev.json --profile deployer

// How to run sam deploy but not deploy tests OR node_modules (taken care of by node_modules layer)
// ...   also create script for when you want to deploy the node_modules layer (simply a separate template.yml?)

// Then using the Debugger in VSCode select 'Run'

// Once you've run a few times and debugged all the issues and fixed them...
// Had to comment-out the nodejs.jar section of the template file 1st. Not sure what to do there???
sam package --template-file config/template.yml --s3-bucket awsblogtweeter --output-template-file packaged.yaml
// Or: with default location for the template file and a specific credential from the ./.aws/credentials file called [deployer]
sam package --s3-bucket awsblogtweeter --output-template-file packaged.yaml --profile deployer

// Then this command is given to you by the output of the previous command:
// Once you get the IAM Role created correctly
// Then be sure that your function in your template file has a name you don't use already!
// Then:
sam deploy --template-file C:\Users\Lakelands\Desktop\NodeJS\AWSBlogTweeter\packaged.yaml --stack-name aws-blog-tweeter --capabilities CAPABILITY_IAM
// Or: with default location for the template file and a specific credential from the ./.aws/credentials file called [deployer]
sam deploy --template-file C:\Users\Lakelands\Desktop\NodeJS\AWSBlogTweeter\packaged.yaml --stack-name aws-blog-tweeter --capabilities CAPABILITY_IAM --profile deployer

