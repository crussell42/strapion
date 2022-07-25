# strapion (strap on to strapi)

**The strapion repository is a collection of hooks, middleware, plugins, and hacks
intended to do in strapi what the creators would not like you to do. I dont know why they wouldnt want it but that is the impression I get.**

## My config ##
- strapi 4.2.3
- which currently contains Koa 2.13.4
- postgres 12
- node 16.3
- npm 7.15

## Quick Start
### ejs-middleware test (contained in the ejs directory) 
Test a basic .ejs file render. (From browser http://localhost:1337/dog/views/pig.ejs) 
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

`$ cd strapion`  
`$ cp ejs/config/middlewares.js ../cow/config/`  
`$ cp ejs/src/middlewares/ejs-middleware.js ../cow/src/middlewares/`  

`$ cd ../cow`  
`$ mkdir dog`  
`$ mkdir dog/views`  
`$ cp ../strapion/ejs/test-views/pig.ejs dog/views/`  
`$ npm run develop`  

Browser to http://localhost:1337/dog/views/pig.ejs  

## Objective
1. Place to collect thoughts and notes on how I broke the rules of strapi.
2. Use Brute Force And Ignorance (BFI) to run my app in a strapi4 instance.
A Lot of the code and hints I got were from strapi3 and and a bunch of looking at strapi4 code.
There are a lot of docs on strapi4 but the detail is still fairly light.
(e.g. try and find what attributes the strapi object has now...used to have it in strapi3)
If any of this helps I have acheived the goal. 

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
