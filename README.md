# strapion (strap on to strapi)

**The strapion repository is a collection of hooks, middleware, plugins, and hacks
intended to do in strapi what the creators would not like you to do. I dont know why they wouldnt want it but that is the impression I get.**

## My config ##
- strapi 4.2.3
- which currently contains Koa 2.13.4
- postgres 12
- node 16.3
- npm 7.15

## FUN TAGS EJS,MPA,VUE,VUETIFY
EJS-VUE-MPA...Its an oldstyle Vue 2 app completely downloaded to browser after being rendered by the EJS engine.  
An Eue (pronounced Ewwww) app...   

**I call dibs on the EUE (Ewwwww) app moniker**   

## Quick Starts  
### EJS ejs-middleware test
There are a couple test .ejs files. ejs/test-views/pig.ejs and ejs/test-views/pig-vue.ejs.  
The intent here is to demo a plain .ejs to html and a .ejs to html that is a client only Vue app.  

Need A clean running strapi4 app named "cow".
e.g.   
`psql> create database cowdb; `  
`$ npx create-strapi-app@latest cow`   

Fill in database connection information for database cowdb.  
So we now have a running strapi app in directory ./cow  
Lets check out this repository.  

`$ git clone git@github.com:crussell42/strapion.git`  

So our directory structure looks like this now.  
`$ ls`     
./cow  <- working strapi app.   
./strapion <- this repository.   

Now, lets test the ejs-middleware.
Note: strapi does not seem to read symbolic links...hard links may work depending on your environment   
So you need to copy or merge these files into cow.   
-or- clone the repo inside cow but this can get messy.  

    $ cd strapion   
    $ cp ejs/config/middlewares.js ../cow/config/   
    $ cp ejs/src/middlewares/ejs-middleware.js ../cow/src/middlewares/   

    $ cd ../cow    
    $ mkdir dog   
    $ mkdir dog/views  
    $ mkdir public/images 
    
    $ cp ../strapion/ejs/test-views/*.ejs dog/views/  
    $ cp ../strapion/ejs/test-images/* public/images/  
    $ npm run develop  

Browser to http://localhost:1337/dog/views/pig-vue.ejs  
Should see a very simple EJS,Vue,Vuetify application with some dog pictures.  

Browser to http://localhost:1337/dog/views/pig.ejs
Should see a very basic html hello world message generated from the pig.ejs file.
 
If you see Content Security Policy issues in your browser javascript console,
make sure you changed cow/config/middlewares.js

    CSP NOTES: The Content Security Policy header of returned html needs to be changed to allow   
    <script> tags to get https stuff.   
    
    Please see https://github.com/strapi/strapi/issues/11637#issuecomment-977244572 for the answer which is included   
    in the config/middlewares.js provided...  
    This is good stuff to know.  
    Also, this clue led me to add the 'unsafe-eval' to the Content Security Policy config as well  
    to allow the Vue compiler to do its thing on the client side.  
        >VueJS has 2 different versions: the full version and the runtime version.  
        >'unsafe-eval' is only needed for the full version of VueJS; the runtime version doesn't need it. See details here.  

    [Vue warn]: It seems you are using the standalone build of Vue.js in an environment with Content Security Policy 
    that prohibits unsafe-eval. The template compiler cannot work in this environment. 
    Consider relaxing the policy to allow unsafe-eval or pre-compiling your templates into render functions.  

### strapi::security middleware config changes  

    module.exports = ({ env }) => [
        'strapi::errors',
        {
            name: 'strapi::security',
            config: {
                contentSecurityPolicy: {
                    directives: {
                        'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
                        'img-src': ["'self'", 'data:', 'cdn.jsdelivr.net', 'strapi.io', `${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`],
                    },
            }
        },
      },
 

## Objective
1. Place to collect thoughts and notes on how I broke the rules of strapi.
2. Use Brute Force And Ignorance (BFI) to run my app in a strapi4 instance.
A Lot of the code and hints I got were from strapi3 and and a bunch of looking at strapi4 code.
There are a lot of docs on strapi4 but the detail is still fairly light.
(e.g. try and find what attributes the strapi object has now...used to have it in strapi3)
If any of this helps I have acheived the goal. 

## STRAPI4 GRIPES
- strapi4 is now using winston 3.3.3 but they didnt duplicate console.log stype logging. Even using %o or %j didnt work.
So a simple console.log('Inspect an object',myobject)  
Should have become `strapi.log.debug('Inspect an object',myobject)`  
But NO...now its `strapi.log.debug('Inspect an object',util.inspect(myobject,{showHidden:false,depth:null}))`  
Should have stuck with pino...maybe it will get corrected...maybe I'm doing it wrong...cant worry about it now.

## Quick Rant
`Everyone has an opinion about how we should or shouldnt use strapi.
Screw that. I dont care about your opinion. 
There are things I would like to do. 
They may be silly, and I may have picked the worst possible way to do it.
But now I know how to do what I shouldnt do.
Too many code snobs on the interwebs say "Why would you ever want to do that?"`

## Motivation
I have a rather large express app that sits on top of postgres and serves a  
MPA Vue app that uses vuetify.

The MPA part is OLD SCHOOL in that I serve straight html (Using ejs as the render engine).
All the restful calls to the back end are just hand rolled fetch calls.
Postgres is hit using pg. Some prisma.
This system has grown out of control and out of necessity over time.

I kinda like the ejs based MPA Vue architecture though.

Think of how SPA's got popular then turned into a pariah.
Hey I know, lets add everything into the client and do it all there.
Oh, crap the client is too big now.
I know, lets split up and slice and dice where the code is executed to generate this html and javascript
that ultimately lands in the browser.
Oh, crap now we are hydrating chunks of obfuscated js at the browser and there is a massive build stage 
for production.
Not impressed.

So I want to transition off of express/ejs to strapi/koa/ejs first.
Long term I know I want strapi in the fray.
Not just the api access to strapi, I want the use of its Koa, Router, and particularly the strapi internal
api, services, plugins etc. In the same v8 engine.

Imagine we wanted to write a Vue version of the admin part of strapi.
Where would we start?
I still want the admin panel but I dont want a full on plugin react app contained in the admin panel.
I want an other app strapped onto strapi.


### Plan of Action (strapi4 only)
1. Serve (render) static html files from a directory within my strapi app (strapion-static-dir)
2. Serve (render) ejs files passing the internal strapi object into the ejs engine (strapion-ejs-dir)

## The Journey
I started by writing an app using a content type to start with. e.g. create
