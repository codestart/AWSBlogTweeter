# AWSBlogTweeter

## Summary
Application to Tweet out the entries to the AWS Blog using the Twitter handle @AWSBlogUnreal (Unofficial would have exceeded Twitter's max length for a Twitter handle!)

## Step-by-step
Every Y minutes:
1. Call to AWS Blog site to get the latest X blog entries.
2. Of those blog entries which are less than Y minutes old.
3. Call to DynamoDB with details from the new blogs' URL
4. Retrieve Blog Name and Hashtag
5. Publish Blog Name, Hashtag & URL to Twitter (possibly multiple times)

## Updates due
Add a token to DynamoDB with the timestamp of the last poll.
This would allow poll-interval to be changed without possibility of missing a blog posting.
Currently Poll-length is parameterized in the application (Y above).
We have the authors' names but could we have their Twitter handles instead? We'd have to build-up a DB table of their name vs. Twitter handle to read from. (a) Look up the name (b) if it's not there add it (c) if it is there check for a Twitter handle (updated manually) (d) if there is none use just the name. 

## Development changes
1. Remove the CloudWatch trigger for the Lambda
2. Delete all CloudWatch logs
3. Comment out Twitter line if appropriate
4. Amend Env Variables to suit test (2880 = 2 Days for example as MINUTES_IN_PERIOD)
5. Delete previous tweets if necessary to avoid duplication error (unless testing error messages)
6. Replace files changed and upload new copy of .zip file
