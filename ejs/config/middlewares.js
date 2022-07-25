module.exports = [
    'strapi::errors',
    'strapi::security',
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::logger',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',

    {
	name: 'global::ejs-middleware',
	config: {
	    appdir: 'dog',
	    viewdir: 'views',
	}
    },
];