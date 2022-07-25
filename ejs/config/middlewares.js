module.exports = ({env}) => [
    'strapi::errors',
    //'strapi::security',
    {
	name: 'strapi::security',
	config: {
	    contentSecurityPolicy: {
		directives: {
		    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
		    'img-src': ["'self'", 'data:', 'cdn.jsdelivr.net', 'strapi.io', `${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`],
		},
	    }
	},
    },
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
