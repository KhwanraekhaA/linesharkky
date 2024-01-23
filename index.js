const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');
const fs = require('fs').promises;
const FormData = require('form-data');
const crypto = require('crypto');



const app = express();
app.use(express.json());

dotenv.config();
const env = dotenv.config().parsed;

const lineConfig = {
  channelAccessToken: env.ACCESS_TOKEN,
  channelSecret: env.SECRET_TOKEN
};

const client = new line.Client(lineConfig);

app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  const signature = req.headers['x-line-signature'];

  try {
    // Validate the signature
    const hash = crypto.createHmac('sha256', lineConfig.channelSecret)
                        .update(JSON.stringify(req.body), 'utf-8')
                        .digest('base64');
    if (hash !== signature) {
      console.error('Invalid signature');
      return res.status(401).send('Unauthorized');
    }

    // Process each event
    for (const event of events) {
      await handleEvent(event);
    }

    // Send success response
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in webhook processing:', error);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type === 'message') {
    if (event.message.type === 'text') {
      // ตัวอย่างการส่งข้อความกลับ
      const echoText = event.message.text;
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: echoText,
      });
    } else if (event.message.type === 'image') {
      // ตัวอย่างการตอบกลับเมื่อได้รับรูปภาพ
      const contentId = event.message.id;
      const buffer = await client.getMessageContent(contentId);

      // บันทึกรูปภาพลงดิสก์ในโฟลเดอร์ uploads
      const filePath = `D:/Senoir Proj/App_shark/uploads/${contentId}.jpg`;
      await fs.writeFile(filePath, buffer);

      // เปลี่ยนจาก fs.createReadStream(filePath) เป็น buffer โดยใส่ buffer เป็นค่าของไฟล์ที่ได้รับมา
      const formData = new FormData();
      formData.append('file', buffer, { filename: `${contentId}.jpg` });

      // ส่งรูปภาพไปยัง API YOLO
      const apiUrl = 'https://sharkapi.onrender.com/yolo/';

      try {
        const response = await axios.post(apiUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
          timeout: 0,
        });
      
        console.log('YOLO API response:', response.data);
      
        // ทำสิ่งที่คุณต้องการกับข้อมูลที่ได้รับจาก API ที่นี่
      } catch (error) {
        console.error('Error sending image to YOLO API:', error.message);
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `An error occurred while processing the message: ${error.message}`
        });
      }
    }
  }
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
