const fs = require('fs');
const path = require('path');

const render = require('koa-ejs');
const util = require('util');

//EJS-MIDDLEWARE.
// This just uses the koa-ejs to render ejs files
// Just copy this file into yourstrapiapp/src/middlewares.
// Then add the middleware to yourstrapiapp/config/middlewares.js
//
// 
// Some Hints.
//https://stackoverflow.com/questions/55090339/strapi-custom-routes-to-redirect-to-public-directory
// STRAPI4 New Info.
// 1. There is no initialize, the way this is declared, just put initialization code before the middleware code (async(ctx,next) return)
//
// 2. The koa-router is at strapi.server.router now.
// console.log(strapi.server.router is helpful because it dumps clues like Layers e.g.
//     Layer {
//      opts: [Object],
//      name: null,
//      methods: [Array],
//      paramNames: [Array],
//      stack: [Array],
//      path: '/uploads/(.*)',
//      regexp: /^\/uploads(?:\/(.*))[\/#\?]?$/i
//    },
// koa-router uses path-to-regexp in @koa/router, so the old /dog/* dont work.
// /dog/(.*) does work.


module.exports = (config, {strapi})=> {

    const appDir = path.resolve(strapi.dirs.root, config.appdir);
    const viewDir = path.join(appDir,config.viewdir || 'views');


    strapi.log.debug('EJS-MIDDLEWARE directory where your app lives:'+appDir);
    strapi.log.debug('EJS-MIDDLEWARE directory where your .ejs files live:'+viewDir);

    // The real meat of the thing is here.
    // This adds a method render to the ctx object so that you can call
    // await ctx.render('my-ejs-file-name',{bunch of data to be used in the ejs});
    // which returns a clump of html (e.g. ctx.body = html generated from ejs file)
    // -Should change to allow config to override this stuff e.g. config.ejs.root, layout, viewExt, etc object.
    render(strapi.server.app,{
	root: viewDir,
	fs: fs, //require('mz/fs'),
	layout: false, //'template',
	viewExt: 'ejs',
	cache: false,
	debug: false
    });
    

    // Everything below here is just a TEST of the render.
    // This sets up some test routes for everything below the viewDir to
    // render the ejs.
    // Normally, we would just ctx.render a page from some other route endpoint.
    // 
    // helper function to get around obtuse koa-router path syntax
    // return an array of directory names below a given path.

    let walkDir = function(dir) {
	var results = [dir];
	var dirList = fs.readdirSync(dir,{withFileTypes: true}).filter((f) => f.isDirectory());
	dirList.forEach(function(d) {
	    results = results.concat(walkDir(dir + '/' + d.name));
	});
	return results;
    }

    let routePathsNeeded = walkDir(viewDir);
    
    strapi.log.debug('EJS-MIDDLEWARE routePathsNeeded:'+routePathsNeeded);

    let routes = routePathsNeeded.map((rp) => {
	return {
	    method: 'GET',
	    path: rp.replace(strapi.dirs.root,'')+'/(.*)',
	    handler: async (ctx,next) => {
		let ejsPageName = ctx.url.split('/').pop().split('.')[0];
		strapi.log.debug('ejs rendering:'+ejsPageName);
		await ctx.render(ejsPageName,{title: 'EJS OBJECT TITLE',strapi: strapi});
	    },
	    config: {auth: false}
	}
    });
    //console.log('EJS-MIDDLEWARE ROUTES ADDED:',routes);
    //strapi4 uses winston 3.3.3...was pino before and now we dont get the simple replacement for console.x (Damnit man!)
    //strapi.log.debug(routes); => [[Object],[Object]]
    // What a pain in the ass. Looks like strapi has not duplicated console.x functionality,
    
    strapi.log.debug('EJS-MIDDLEWARE ROUTES ADDED: '+util.inspect(routes,{showHidden:false,depth:null}));


    strapi.server.routes(routes);
    
    /* example route
    [
	{
            method: 'GET',
            path: '/dog/views/(.*)',
            handler: async (ctx,next) => {
		console.log('HIT IT');
		await ctx.render('pig',{title: 'EJS OBJECT TITLE',strapi: strapi});
		//await next();
	    },
            config: { auth: false },
	}	
    ]);
    */

    
    return null;

};

