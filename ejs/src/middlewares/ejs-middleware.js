const fs = require('fs');
const path = require('path');
const koaStatic = require('koa-static');

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



    console.log('OSA-MIDDLEWARE directory where your app lives:'+appDir);
    //console.log('OSA-MIDDLEWARE server.routes:'+strapi.server.routes);
    //console.log('OSA-MIDDLEWARE strapi:',strapi);
    
    //return an array of directory names below a given path.
    let walkDir = function(dir) {
	var results = [dir];
	var dirList = fs.readdirSync(dir,{withFileTypes: true}).filter((f) => f.isDirectory());
	dirList.forEach(function(d) {
	    results = results.concat(walkDir(dir + '/' + d.name));
	});
	return results;
    }

    
    let routePathsNeeded = walkDir(appDir);
    
    console.log('OSA-MIDDLEWARE routePathsNeeded:'+routePathsNeeded);

    const serveStatic = (filesDir, koaStaticOptions = {}) => {
	const serve = koaStatic(filesDir, koaStaticOptions);
	
	return async (ctx, next) => {
	    const prev = ctx.path;
	    const newPath = path.basename(ctx.path);
	    ctx.path = newPath;
	    await serve(ctx, async () => {
		ctx.path = prev;
		await next();
		ctx.path = newPath;
	    });
	    ctx.path = prev;
	};
    };


    let routes = routePathsNeeded.map((rp) => {
	return {
	    method: 'GET',
	    path: rp.replace(strapi.dirs.root,'')+'/(.*)',
	    handler: serveStatic(rp,{maxage: 60000,defer: true}),
	    config: {auth: false}
	}
    });
    //console.log('ROUTES',routes);

    //strapi.server.routes(routes);
    
    //console.log('OAS-MIDDLEWARE INITIALIZATION:',strapi.server.router);

    render(strapi.server.app,{
	root: path.join(strapi.dirs.root, 'dog/views'),
	fs: fs, //require('mz/fs'),
	layout: false, //'template',
	viewExt: 'ejs',
	cache: false,
	debug: false
    });
    
    strapi.server.routes([
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
    

    
    return null;

    // if no resource is matched by koa-static, just default to serve index file
    // useful for SPA routes
    //strapi.router.get('*', ctx => {
    //	ctx.type = 'html';
    //	ctx.body = fs.createReadStream(path.join(staticDir + '/index.html'));
    //});
};

/* works
    strapi.server.router.get('/'+config.appdir+'/(.*)',
			     async (ctx,next) => {
				 console.log('FOUND A DOG IN '+ctx.url);
				 console.log('MATCHED '+ctx._matchedRoute);				 
				 await next();
			     },
			     async (ctx,next) => {
				 console.log('STEP TWO');
				 await next();
			     },
			    );
*/

/* These work.
	{
            method: 'GET',
            path: '/dog/(.*)',
	    handler: async (ctx,next) => {
	    	console.log('FOUND A DOG IN '+ctx.url);
	    	console.log('MATCHED '+ctx._matchedRoute);				 
	    	await next();
	    },
            //handler: serve(staticDir, {
	    //	maxage: 1000,
	    //	defer: true,
            //}),

            config: { auth: false },
	},
	{
            method: 'GET',
            path: '/dog/(.*)',
	    handler: async (ctx,next) => {
	    	console.log('STEP TWO '+ctx.url);
	    	await next();
	    },
            config: { auth: false },
	},
	Why does the following work but not 
	{
            method: 'GET',
            path: '/dog/(.*)',
            handler: koaStatic(staticDir,{maxage: 60000,defer: true}),
            config: { auth: false },
	}
	It is an asyncy thing. 
	Note the await serve call.
	I had tried a similar thing but just fell back to strapi's own source.
*/
    
    

/* THIS WORKS
    strapi.server.routes([

	{
            method: 'GET',
            path: '/dog(.*)',
            handler: serveStatic(staticDir,{maxage: 60000,defer: true}),
            config: { auth: false },
	}

    ]);
*/
/* THIS WORKS
    strapi.server.router.get(
	'/dog/poop.html',
	
	async (ctx, next) => {
	    console.log('FOUND A DOG IN '+ctx.url);
	    console.log('MATCHED '+ctx._matchedRoute);

	    const parse = path.parse(ctx.url);
	    let newUrl = path.join(parse.dir, parse.base);
	    console.log('NEW URL '+newUrl);
	    //ctx.url = path.join(parse.dir, parse.base);

	    ctx.type = 'html';
    	    ctx.body = fs.createReadStream(path.join(staticDir + '/'+'poop.html'));

	    
	    await next();
	},
	
	serve(staticDir+'/', {
	    maxage: 0,
	    defer: false, // do not allow other middleware to serve content before this one
	})
    );
*/

/* 




  VEStIGAL ATTEMPTS
    return async (ctx, next) => {
    	await next();
    	console.log('OSA-MIDDLEWARE');
    	return ctx;
    };
    
    
    //DNW: strapi.server.use(serve('./dog',{maxAge:1000,defer:false}));

    
    return async(ctx,next) => {
	return {
	    initialize() {
		strapi.log.info('YO MAN THIS IS THE OSA-MIDDLEWARE CONFIG',config);
		//const {maxAge, path: publicPath} = strapi.config.middleware.settings.public;
		//const staticDir = path.resolve(strapi.dir, publicPath || strapi.config.paths.static);
	    
	    }
	}	
    }
    

    //const {maxAge, path: publicPath} = strapi.config.middleware.settings.public;
    //const staticDir = path.resolve(strapi.dir, publicPath || strapi.config.paths.static);


    //const {maxAge, path: publicPath} = strapi.config.middleware.settings.public;

*/
