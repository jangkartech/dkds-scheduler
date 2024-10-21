import fetch from 'node-fetch';
import {URLSearchParams} from 'url';
import {promises as fs} from 'fs';
import path from 'path';
import {config} from 'dotenv';

config(); // Load environment variables from .env file

// Define an async function to perform the POST request
export const getOrders = async () => {
    try {
        // Read and parse the credentials JSON file
        const credentialsPath = path.resolve('./credential.json');
        const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
        const credentials = JSON.parse(credentialsData);

        const csrf = credentials.DKDS_CSRF;
        const cookie = credentials.DKDS_COOKIE;
        const baseUrl = process.env.DKDS_BASE_URL;

        console.log({
            'csrf': csrf,
            'cookie': cookie,
            'baseUrl': baseUrl
        })

        // Create URLSearchParams for the form data
        const formData = new URLSearchParams();
        formData.append('_csrf', csrf);
        formData.append('RealOrder[distributor_code]', '70006022');
        formData.append('RealOrder[start_sales]', '');
        formData.append('RealOrder[end_sales]', '');
        formData.append('RealOrder[start_outlet]', '');
        formData.append('RealOrder[end_outlet]', '');
        formData.append('RealOrder[start_ro]', '');
        formData.append('RealOrder[end_ro]', '');
        formData.append('RealOrder[start_date]', '');
        formData.append('RealOrder[end_date]', '');

        // Perform the POST request
        const response = await fetch(baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Flist-rorder', {
            method: 'POST',
            headers: {
                'Cookie': cookie,
                'Accept': 'text/plain, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Host': '192.168.1.253',
                'Origin': baseUrl,
                'Referer': baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fmultiple',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        } else {
            return  await response.text();
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
};
