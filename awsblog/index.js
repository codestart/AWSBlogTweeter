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
var awsBlogSections = {
    "aws": "News",
    "podcasts": "Podcast",
    "architecture": "Architecture",
    "deardevopsabby": "Abby",
    "apn": "AWS Partner Network",
    "awsmarketplace": "Marketplace",
    "big-data": "Big Data",
    "business-productivity": "Business Productivity",
    "contact-center": "Contact Center",
    "compute": "Compute",
    "database": "Database",
    "desktop-and-application-streaming": "Desktop and Application Streaming",
    "developer": "Developer",
    "devops": "DevOps",
    "enterprise-strategy": "Enterprise Strategy",
    "gametech": "Game Tech",
    "iot": "Internet of Things",
    "machine-learning": "Machine Learning",
    "mt": "Management Tools",
    "media": "Media",
    "messaging-and-targeting": "Messaging And Targeting",
    "mobile": "Mobile",
    "networking-and-content-delivery": "Networking and Content Delivery",
    "opensource": "Open Source",
    "publicsector": "Public Sector",
    "awsforsap": "SAP",
    "security": "Security Identity and Compliance",
    "startups": "Startups"};

var awsBlogHashtags = {
    "aws": "AWSNews",
    "podcasts": "AWSPodcast",
    "architecture": "AWSArchitecture",
    "deardevopsabby": "AWSAbby",
    "apn": "AWSPartners",
    "awsmarketplace": "AWSMarket",
    "big-data": "AWSBigData",
    "business-productivity": "AWSBusiness",
    "contact-center": "AWSContactCenter",
    "compute": "AWSCompute",
    "database": "AWSDB",
    "desktop-and-application-streaming": "AWSStreaming",
    "developer": "AWSDev",
    "devops": "AWSDevOps",
    "enterprise-strategy": "AWSEnterprise",
    "gametech": "AWSGame",
    "iot": "AWSIOT",
    "machine-learning": "AWSMachineLearning",
    "mt": "AWSManagementTools",
    "media": "AWSMedia",
    "messaging-and-targeting": "AWSMessagingTargeting",
    "mobile": "AWSMobile",
    "networking-and-content-delivery": "AWSNetworkingCDN",
    "opensource": "AWSOpenSource",
    "publicsector": "AWSPublicSector",
    "awsforsap": "AWSSAP",
    "security": "AWSSecurity",
    "startups": "AWSStartups"};

module.exports = {
    getBlogPost: getBlogPost,
    awsBlogSections: awsBlogSections,
    awsBlogHashtags: awsBlogHashtags
  };
