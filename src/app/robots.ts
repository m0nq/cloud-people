import { MetadataRoute } from 'next';

const robots = (): MetadataRoute.Robots => ({
    rules: [
        {
            userAgent: '*',
            disallow: '/'
        },
        {
            userAgent: [
                'baiduspider',
                'baiduspider-image',
                'baiduspider-mobile',
                'baiduspider-news',
                'baiduspider-video',
                'bingbot',
                'msnbot',
                'msnbot-media',
                'adidxbot',
                'Googlebot',
                'Googlebot-Image',
                'Googlebot-Mobile',
                'Googlebot-News',
                'Googlebot-Video',
                'Storebot-Google',
                'Mediapartners-Google',
                'AdsBot-Google',
                'slurp',
                'yandex'
            ],
            allow: '/',
            disallow: ['/community', '/dashboard', '/profile', '/sandbox', '/store']
        }
    ]
});

export default robots;
