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
