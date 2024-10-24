import puppeteer from 'puppeteer';
import fs from 'fs/promises';  // to write JSON file
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env

(async () => {
    const baseUrl = process.env.DKDS_BASE_URL;
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the login page
    await page.goto(baseUrl+'/dkds/web/index.php?r=site%2Flogin', { waitUntil: 'networkidle2' });

    // Wait for the form fields to be visible
    await page.waitForSelector('#loginform-username');
    await page.waitForSelector('#loginform-password');

    // Fill in the username and password from .env
    await page.type('#loginform-username', process.env.DKDS_USERNAME, { delay: 100 });
    await page.type('#loginform-password', process.env.DKDS_PASSWORD, { delay: 100 });

    // Optionally check the "Remember me" checkbox
    const rememberMeCheckbox = await page.$('#loginform-rememberme');
    const isChecked = await (await rememberMeCheckbox.getProperty('checked')).jsonValue();
    if (!isChecked) {
        await rememberMeCheckbox.click();
    }

    // Submit the form
    await Promise.all([
        page.click('button[name="login-button"]'),  // Click the login button
        page.waitForNavigation({ waitUntil: 'networkidle2' })  // Wait for the next page to load
    ]);

    // Read all cookies after login, including HttpOnly cookies
    const cookies = await page.cookies();

    // Create an object to write to credential.json
    const data = {
        cookies: cookies
    };

    // Write cookies data to credential.json file
    await fs.writeFile('credential.json', JSON.stringify(data, null, 2));

    console.log('Cookies saved to credential.json');

    await browser.close();
})();
