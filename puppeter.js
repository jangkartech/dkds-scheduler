import puppeteer from 'puppeteer';
import {promises as fs} from 'fs'; // to write JSON file
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env

(async () => {
    const baseUrl = process.env.DKDS_BASE_URL;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the login page
    await page.goto(baseUrl+'/dkds/web/index.php?r=site%2Flogin', { waitUntil: 'networkidle2' });

    // Wait for the form fields to be visible
    await page.waitForSelector('#loginform-username');
    await page.waitForSelector('#loginform-password');

    // Fill in the username and password from .env
    await page.type('#loginform-username', process.env.DKDS_USERNAME, { delay: 100 });
    await page.type('#loginform-password', process.env.DKDS_PASSWORD, { delay: 100 });

    // Submit the form
    await Promise.all([
        page.click('button[type="submit"]'),  // Click the login button
        page.waitForNavigation({ waitUntil: 'networkidle2' })  // Wait for the next page to load
    ]);

    // Read all cookies after login, including HttpOnly cookies
    const cookies = await page.cookies();

    // Read existing data from credential.json
    let existingData = {};
    try {
        const fileContent = await fs.readFile('credential.json', 'utf-8');
        existingData = JSON.parse(fileContent);
    } catch (error) {
        console.log('No existing credential.json file found, creating a new one.');
    }

    // Update the cookies key
    existingData["COOKIES"] = cookies;

    // Write updated data back to credential.json
    await fs.writeFile('credential.json', JSON.stringify(existingData, null, 2));

    console.log('Cookies updated in credential.json');

    await browser.close();
})();
