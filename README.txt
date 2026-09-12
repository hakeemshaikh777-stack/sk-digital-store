SK DIGITAL STORE — SELLING-READY WEBSITE
===========================================

Included:
- Responsive storefront with search, filters, sorting and FAQ
- 15 original starter digital-product PDF resources
- Contact page with supplied email, WhatsApp and call details
- Privacy, Terms, Refund/Cancellation pages
- Razorpay checkout integration
- Server-side Razorpay order creation and signature verification
- Signed, time-limited download links
- Product files kept outside the public web folder

CONTACT DETAILS
Email: hakeemshaikh777@gmail.com
WhatsApp: +91 97676 69139
Call: +91 93733 15964

LIVE PAYMENT SETUP
1. Deploy this package on a Node.js host that supports Express.
2. Run: npm install
3. Set environment variables:
   RAZORPAY_KEY_ID=your_live_key_id
   RAZORPAY_KEY_SECRET=your_live_key_secret
   DOWNLOAD_SECRET=a_long_random_secret
4. Run: npm start
5. Use the public HTTPS URL of this deployed site in your Razorpay website/app details.

IMPORTANT
- Never put RAZORPAY_KEY_SECRET or DOWNLOAD_SECRET in frontend code.
- Do not upload product-files into a public static folder.
- Test with Razorpay test mode before switching to live credentials.
- Razorpay account activation/approval is separate from this website package.
- Blogger cannot run this Node.js backend. If the final store remains on Blogger, use Razorpay Payment Links/Payment Button or host this backend separately and connect the storefront to it.
- Replace any business/legal details required by your payment provider with your actual registered/business information before going live.

PRODUCT DELIVERY
After successful Razorpay payment, the server verifies the signature and generates a signed download URL valid for 1 hour. The product file is served by the backend and is not exposed through the public static directory.

HEALTH CHECK
GET /health should return {"ok":true,"service":"SK Digital Store"} when the server is running.
