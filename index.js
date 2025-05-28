const line = require('@line/bot-sdk');
const express = require('express');

// LINE bot configuration
const config = {
  channelAccessToken: 'H7a8tbJahy1uJFUQXHx5vGCSoFPNP/+En8y6sGZMjuNkmjz3Gn6xQ+Wf3xlRTGowYGgfLHbNTzCMGpltRpuGj+bt1OX+dW7rgxKcFL/TAfOiq7QEmlfOhEMcCuE3jZmEmxWi//k9i0qnRGe5OR45BgdB04t89/1O/w1cDnyilFU=',
  channelSecret: '49d1d6f2f35bd037cf046335a33d50a4',
};

// Initialize LINE client and Express app
const client = new line.Client(config);
const app = express();

// Configurable greeting message with @person placeholder
const GREETING_TEXT = 'hellO @person ! welcome to FruiGO ⋮ angel\'s could give yOu pretty little stuff ⊹ ࣪ ˖\n\nⓘ don\'t remove anything inside an album or the album itself! kindly chat the admin to invite your paL to this GO﹐persod/reqshare are avail! more check:\n\nʚ https://fruigoxxe.carrd.co/ ɞ\n\nthank yOu! semoga betah jajan disini ♡';

// Webhook endpoint
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook error:', err);
      res.status(500).end();
    });
});

// Handle LINE events
async function handleEvent(event) {
  if (event.type === 'memberJoined') {
    const groupId = event.source.groupId;
    const members = event.joined.members;

    let mentionText = GREETING_TEXT;
    let mentionees = [];

    // Find the position of @person in the GREETING_TEXT
    const placeholder = '@person';
    const placeholderIndex = mentionText.indexOf(placeholder);

    // Process each new member
    let memberMentions = '';
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      try {
        // Fetch member profile
        const profile = await client.getGroupMemberProfile(groupId, member.userId);
        const mentionName = profile.displayName;

        // Build the mentions string
        memberMentions += `@${mentionName}`;

        // Add mention object for LINE API
        mentionees.push({
          index: placeholderIndex + memberMentions.length - (mentionName.length + 1),
          length: mentionName.length + 1, // Include '@'
          userId: member.userId,
        });

        // Add comma and space for multiple members (except for the last one)
        if (i < members.length - 1) {
          memberMentions += ', ';
        }
      } catch (e) {
        console.error(`Failed to fetch profile for userId: ${member.userId}`, e);
        // Fallback for failed profile fetch
        memberMentions += '@someone';
        if (i < members.length - 1) {
          memberMentions += ', ';
        }
      }
    }

    // Replace @person with the actual mentions
    mentionText = mentionText.replace(placeholder, memberMentions);

    // Construct the message with mention
    const message = {
      type: 'text',
      text: mentionText,
      mention: {
        mentionees: mentionees,
      },
    };

    // Log the message for debugging
    console.log('Sending message:', JSON.stringify(message, null, 2));

    // Send the reply
    try {
      await client.replyMessage(event.replyToken, message);
    } catch (e) {
      console.error('Failed to send reply:', e);
    }
  }

  return Promise.resolve(null);
}

// Basic health check endpoint
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('👋 Bot LINE kamu sudah aktif! Jangan akses dari browser ya, ini khusus webhook.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});