const fs = require('fs');
const path = require('path');
const util = require('util');

const koaStatic = require('koa-static');

//EJS-MIDDLEWARE.
// This just uses the koa-static to render html files
// Just copy this file into yourstrapiapp/src/middlewares.
// Then add the middleware to yourstrapiapp/config/middlewares.js
//
// Lot you could do in here...just a proff of concept.
// strapi::public could also be hijacked to do this.


module.exports = (config, {strapi})=> {

    const staticDir = path.resolve(strapi.dirs.root, config.staticdir || 'moose');

    strapi.log.debug('STATIC-MIDDLEWARE directory where your static files live:'+staticDir);

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

    let routePathsNeeded = walkDir(staticDir);
    
    strapi.log.debug('STATIC-MIDDLEWARE routePathsNeeded:'+routePathsNeeded);

    const serveStatic = (filesDir, koaStaticOptions = {}) => {
	const serve = koaStatic(filesDir, koaStaticOptions);
	
	return async (ctx, next) => {
	    const prev = ctx.path;
	    const newPath = path.basename(ctx.path);
	    ctx.path = newPath;

	    strapi.log.debug('STATIC-MIDDLEWARE ctx.path:'+ctx.path+' getting basename:'+newPath);

	    await serve(ctx, async () => {
		ctx.path = prev;
		//reset context path to what it was originally so that other middlewares get the raw.
		await next();
		ctx.path = newPath;
		//seems redundant
	    });
	    //?why.
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
    //console.log('EJS-MIDDLEWARE ROUTES ADDED:',routes);
    //strapi4 uses winston 3.3.3...was pino before and now we dont get the simple replacement for console.x (Damnit man!)
    //strapi.log.debug(routes); => [[Object],[Object]]
    // What a pain in the ass. Looks like strapi has not duplicated console.x functionality,
    
    strapi.log.debug('STATIC-MIDDLEWARE ROUTES ADDED: '+util.inspect(routes,{showHidden:false,depth:null}));


    strapi.server.routes(routes);
    
    
    return null;

};

