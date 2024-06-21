const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

const stripe = require("stripe")(stripeSecretKey);
const axios = require("axios");

const participantTypes = [
  {
    value: "scholar_student_physical",
    label: "Research Scholar/Student (Physical Mode)",
  },
  {
    value: "scholar_student_online",
    label: "Research Scholar/Student (Online Mode)",
  },
  {
    value: "standard_authors_physical",
    label: "Standard Authors (Physical Mode)",
  },
  { value: "standard_authors_online", label: "Standard Authors (Online Mode)" },
  {
    value: "scholar_student_participant",
    label: "Research Scholar/Student Participants",
  },
  { value: "standard_participant", label: "Standard Participants" },
];
const prices = {
  "Research Scholar/Student (Physical Mode)": 25000,
  "Research Scholar/Student (Online Mode)": 20000,
  "Standard Authors (Physical Mode)": 30000,
  "Standard Authors (Online Mode)": 25000,
  "Research Scholar/Student Participants": 15000,
  "Standard Participants": 20000,
};

app.get("/checkout", (req, res) => {
  res.render("checkout", { participantTypes, stripePublicKey });
});
const getClientIp = (req) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  // Handle multiple IPs in 'x-forwarded-for' header
  const ipList = ip.split(",");
  return ipList[0].trim();
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log(req.body);
    const userType = req.body.participantType;
    let fees = prices[userType];
    let currencyCode = "usd";

    // const clientIp = getClientIp(req);
    // console.log('Client IP:', clientIp);

    // Fetch location information from extreme-ip-lookup
    // const response = await axios.get(`https://extreme-ip-lookup.com/json/${clientIp}`);

    // if (response.data.status === 'success') {
    //     const country =response.data.country;
    //     console.log('IP Lookup Response:', response.data);
    //     console.log('Country:', country);

    //     if (country === 'India') {
    //         currencyCode = 'inr';
    //         fees *= 83; // Convert fees to INR
    //     }
    // } else {
    //     console.error('IP Lookup Failed:', response.data.message);
    // }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currencyCode,
            product_data: {
              name: userType,
            },
            unit_amount: Math.round(fees + fees * 0.03),
          },
          quantity: 1,
        },
      ],
      custom_fields: [
        {
          key: "paper_id",
          label: {
            type: "custom",
            custom: "Paper ID",
          },
          optional: false,
          type: "text",
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/failed",
    });
    // console.log(session.url);

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send({ message: "Something went wrong!" });
  }
});

app.listen(3001, (err) => {
  console.log("Server running on port 3001");
});
