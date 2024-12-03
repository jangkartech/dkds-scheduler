import fetch from 'node-fetch';

const botToken = '7572978358:AAHI8zBEfKGBDvy-ABPY8d0BlROKNVoQK2c';
const chatId = '-4676535399'; // Replace with the group chat ID
const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

async function sendAlertMessage(errorMessage) {
  const payload = {
    chat_id: chatId,
    text: `${errorMessage}`,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
    } else {
      console.log('Message sent successfully:', data);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
