import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [analytics,html]=await Promise.all([
 readFile(new URL('../analytics.js',import.meta.url),'utf8'),
 readFile(new URL('../index.html',import.meta.url),'utf8')
]);

assert(analytics.includes("MEASUREMENT_ID='G-9K2LH06SM9'"));
assert(analytics.includes("localStorage.getItem(CONSENT_KEY)==='granted'"));
assert(analytics.includes("script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`"));
assert(analytics.includes("ad_storage:'denied'"));
assert(analytics.includes("allow_google_signals:false"));
assert(!/event\.detail\?\.room\.(id|name)|phone|birth|answer|result_value/.test(analytics));
assert(html.includes('analytics.js?v=analytics-1'));
assert(html.includes('analytics.css?v=analytics-1'));

console.log('Analytics policy: consent gate, GA4 ID, privacy controls and anonymous aggregate events passed.');
