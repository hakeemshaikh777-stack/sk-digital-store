const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");
app.use(express.json({limit:"20kb"}));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.warn("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before enabling live payments.");
}

const razorpay = KEY_ID && KEY_SECRET
  ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  : null;

const PRODUCTS = {
  "canva-social": 19900,
  "resume": 14900,
  "ai-prompts": 24900,
  "excel": 29900,
  "marketing": 19900,
  "branding": 34900,
  "notion-freelancer": 39900,
  "content-calendar": 19900,
  "capcut-reels": 29900,
  "money-planner": 24900,
  "freelance-kit": 44900,
  "figma-ui": 49900,
  "email-swipes": 24900,
  "ai-workflows": 59900,
  "creator-growth": 29900
};

const FILES = {
  "canva-social":"01_Canva_Social_Media_Pack.pdf",
  "resume":"02_Professional_Resume_Pack.pdf",
  "ai-prompts":"03_AI_Prompt_Mega_Pack.pdf",
  "excel":"04_Excel_Business_Toolkit.pdf",
  "marketing":"05_Digital_Marketing_Guide.pdf",
  "branding":"06_Branding_Starter_Kit.pdf",
  "notion-freelancer":"07_Notion_Freelancer_OS.pdf",
  "content-calendar":"08_30_Day_Content_Calendar.pdf",
  "capcut-reels":"09_Reels_CapCut_Creator_Pack.pdf",
  "money-planner":"10_Personal_Finance_Planner.pdf",
  "freelance-kit":"11_Freelancer_Client_Kit.pdf",
  "figma-ui":"12_Figma_UI_Starter_Kit.pdf",
  "email-swipes":"13_Email_Swipe_Copy_Kit.pdf",
  "ai-workflows":"14_AI_Workflow_Automation_Pack.pdf",
  "creator-growth":"15_Creator_Growth_Planner.pdf"
};

function safeEqualHex(a,b){
  if(!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a,"hex"), Buffer.from(b,"hex"));
}

function makeDownloadToken(productId, orderId){
  const exp = Math.floor(Date.now()/1000) + 60*60; // 1 hour
  const payload = `${productId}.${orderId}.${exp}`;
  const sig = crypto.createHmac("sha256", DOWNLOAD_SECRET || "CHANGE_ME").update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function readDownloadToken(token){
  try{
    const raw = Buffer.from(token,"base64url").toString("utf8");
    const [productId,orderId,exp,sig] = raw.split(".");
    if(!productId || !orderId || !exp || !sig || !FILES[productId]) return null;
    if(Number(exp) < Math.floor(Date.now()/1000)) return null;
    const payload = `${productId}.${orderId}.${exp}`;
    const expected = crypto.createHmac("sha256", DOWNLOAD_SECRET || "CHANGE_ME").update(payload).digest("hex");
    return safeEqualHex(sig, expected) ? {productId,orderId} : null;
  }catch(_){ return null; }
}

app.post("/api/create-order", async (req,res)=>{
  try{
    const {productId,name,email,phone} = req.body || {};
    if(!razorpay) return res.status(503).json({error:"Razorpay is not configured on this server."});
    if(!PRODUCTS[productId]) return res.status(400).json({error:"Invalid product."});
    if(!name || String(name).trim().length < 2) return res.status(400).json({error:"Valid name is required."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||""))) return res.status(400).json({error:"Valid email is required."});
    if(!/^\d{10}$/.test(String(phone||""))) return res.status(400).json({error:"Valid 10-digit mobile number is required."});

    const order = await razorpay.orders.create({
      amount: PRODUCTS[productId],
      currency: "INR",
      receipt: `sk_${Date.now()}`,
      notes: { product_id: productId, customer_email: String(email).slice(0,120) }
    });
    res.json({id:order.id,amount:order.amount,currency:order.currency,key_id:KEY_ID});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"Unable to create payment order."});
  }
});

app.post("/api/verify-payment", (req,res)=>{
  try{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature,productId} = req.body || {};
    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !PRODUCTS[productId] || !KEY_SECRET){
      return res.status(400).json({verified:false,error:"Incomplete payment verification data."});
    }
    const expected = crypto.createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const verified = safeEqualHex(expected, razorpay_signature);
    if(!verified) return res.status(400).json({verified:false,error:"Payment verification failed."});
    const token = makeDownloadToken(productId, razorpay_order_id);
    res.json({verified:true,downloadUrl:`/api/download?token=${encodeURIComponent(token)}`});
  }catch(e){
    console.error(e);
    res.status(500).json({verified:false,error:"Verification error."});
  }
});

app.get("/api/download",(req,res)=>{
  const info = readDownloadToken(String(req.query.token||""));
  if(!info) return res.status(403).send("Download link is invalid or expired.");
  const file = path.join(__dirname,"product-files",FILES[info.productId]);
  if(!fs.existsSync(file)) return res.status(404).send("Product file is unavailable.");
  res.download(file, FILES[info.productId]);
});

app.get("/health",(req,res)=>res.json({ok:true,service:"SK Digital Store"}));

app.listen(PORT,()=>console.log(`SK Digital Store running on port ${PORT}`));
