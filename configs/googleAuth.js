import { google } from 'googleapis';

const googleAuth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

export default googleAuth;