const fs = require('fs');
const path = require('path');

const render = require('koa-ejs');

//Run an client app from within KOA.
//This is a kack fest.
// 
//MAN THIS SI CRAZY
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
// Not sure what does...I hate regexp



module.exports = (config, {strapi})=> {

    const appDir = path.resolve(strapi.dirs.root, config.appdir);
    const viewDir = path.join(appDir,config.viewdir || 'views');


    console.log('EJS-MIDDLEWARE directory where your app lives:'+appDir);
    console.log('EJS-MIDDLEWARE directory where your .ejs files live:'+viewDir);
    
    //return an array of directory names below a given path.
    let walkDir = function(dir) {
	var results = [dir];
	var dirList = fs.readdirSync(dir,{withFileTypes: true}).filter((f) => f.isDirectory());
	dirList.forEach(function(d) {
	    results = results.concat(walkDir(dir + '/' + d.name));
	});
	return results;
    }

    let routePathsNeeded = walkDir(viewDir);
    
    console.log('EJS-MIDDLEWARE routePathsNeeded:'+routePathsNeeded);

    let routes = routePathsNeeded.map((rp) => {
	return {
	    method: 'GET',
	    path: rp.replace(strapi.dirs.root,'')+'/(.*)',
	    handler: async (ctx,next) => {
		let ejsPageName = ctx.url.split('/').pop().split('.')[0];
		console.log('WTF:'+rp+' basename:'+path.basename(rp)+' url:'+ctx.url+' ejsPageName:'+ejsPageName);
		await ctx.render(ejsPageName,{title: 'EJS OBJECT TITLE',strapi: strapi});
	    },
	    config: {auth: false}
	}
    });
    console.log('EJS-MIDDLEWARE ROUTES ADDED',routes);

    render(strapi.server.app,{
	root: viewDir,
	fs: fs, //require('mz/fs'),
	layout: false, //'template',
	viewExt: 'ejs',
	cache: false,
	debug: false
    });
    
    strapi.server.routes(routes);
    /*
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

